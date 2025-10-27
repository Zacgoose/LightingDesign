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
        $Filter = "PartitionKey eq '$JobId'"
        $ExistingDesign = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        # Convert design data to JSON
        $DesignDataJson = if ($DesignData) {
            [string]($DesignData | ConvertTo-Json -Depth 20 -Compress)
        } else {
            '{}'
        }

        # Validate JSON before saving
        try {
            $null = $DesignDataJson | ConvertFrom-Json -ErrorAction Stop
        } catch {
            Write-Error "JSON validation failed: $_"
            throw "Invalid design data structure"
        }

        # Create entity - let Add-CIPPAzDataTableEntity handle splitting automatically
        $Entity = @{
            PartitionKey = [string]$JobId
            RowKey       = if ($ExistingDesign) { $ExistingDesign.RowKey } else { [guid]::NewGuid().ToString() }
            JobId        = [string]$JobId
            DesignData   = $DesignDataJson  # Store as single property - function will split if needed
            LastModified = (Get-Date).ToUniversalTime().ToString('o')
        }

        # Add-CIPPAzDataTableEntity will automatically:
        # 1. Try to save as-is
        # 2. If too large, split DesignData into DesignData_Part0, DesignData_Part1, etc.
        # 3. Add SplitOverProps metadata for reassembly
        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force


        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results  = 'Design saved successfully'
                DesignId = $Entity.RowKey
                JobId    = $JobId
            }
        }

    } catch {
        Write-Error "Error saving design: $_"
        Write-Error "Stack trace: $($_.ScriptStackTrace)"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error   = 'Failed to save design'
                message = $_.Exception.Message
                details = $_.Exception.ToString()
            }
        }
    }
}
