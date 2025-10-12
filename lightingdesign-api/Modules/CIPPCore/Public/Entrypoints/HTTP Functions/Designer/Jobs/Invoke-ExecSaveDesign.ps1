function Invoke-ExecSaveDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Designs'

    $JobId = $Request.Body.jobId
    $DesignData = $Request.Body.designData

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    try {
        # Check if design already exists for this job
        $Filter = "JobId eq '{0}'" -f $JobId
        $ExistingDesign = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter

        # Convert design data to JSON
        $DesignDataJson = if ($DesignData) {
            [string]($DesignData | ConvertTo-Json -Depth 20 -Compress)
        } else {
            $null
        }

        # Azure Table Storage has a 64KB limit per property (32K characters for UTF-16)
        # Use 60KB (30K characters) as safe threshold to account for overhead
        $MaxChunkSize = 30000
        $ChunkCount = 0
        $Chunks = @{}

        if ($DesignDataJson -and $DesignDataJson.Length -gt $MaxChunkSize) {
            # Split data into chunks
            $ChunkCount = [Math]::Ceiling($DesignDataJson.Length / $MaxChunkSize)

            for ($i = 0; $i -lt $ChunkCount; $i++) {
                $Start = $i * $MaxChunkSize
                $Length = [Math]::Min($MaxChunkSize, $DesignDataJson.Length - $Start)
                $Chunks["DesignData_$i"] = [string]$DesignDataJson.Substring($Start, $Length)
            }
        }

        if ($ExistingDesign) {
            # Update existing design
            $Entity = @{
                PartitionKey = $ExistingDesign.PartitionKey
                RowKey       = $ExistingDesign.RowKey
                JobId        = [string]$JobId
                LastModified = (Get-Date).ToString('o')
            }

            # Clear old chunk properties if they exist
            if ($ExistingDesign.ChunkCount) {
                for ($i = 0; $i -lt $ExistingDesign.ChunkCount; $i++) {
                    $Entity["DesignData_$i"] = $null
                }
            }

            # Add chunk count and chunks or single property
            if ($ChunkCount -gt 0) {
                $Entity['ChunkCount'] = $ChunkCount
                $Entity['DesignData'] = $null
                foreach ($Key in $Chunks.Keys) {
                    $Entity[$Key] = $Chunks[$Key]
                }
            } else {
                $Entity['ChunkCount'] = 0
                $Entity['DesignData'] = $DesignDataJson
            }
        } else {
            # Create new design
            $Entity = @{
                PartitionKey = 'Design'
                RowKey       = [guid]::NewGuid().ToString()
                JobId        = [string]$JobId
                LastModified = (Get-Date).ToString('o')
                ChunkCount   = $ChunkCount
            }

            # Add chunks or single property
            if ($ChunkCount -gt 0) {
                $Entity['DesignData'] = $null
                foreach ($Key in $Chunks.Keys) {
                    $Entity[$Key] = $Chunks[$Key]
                }
            } else {
                $Entity['DesignData'] = $DesignDataJson
            }
        }

        Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results = 'Design saved successfully'
                DesignId = $Entity.RowKey
                JobId = $JobId
                ChunkCount = $ChunkCount
            }
        }
    } catch {
        Write-Error "Error saving design: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error = 'Failed to save design'
                message = $_.Exception.Message
                details = $_.Exception.ToString()
            }
        }
    }
}
