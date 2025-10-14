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
            $null
        }

        # Create or update design entity
        # Note: Add-CIPPAzDataTableEntity handles large properties automatically by splitting into chunks
        if ($ExistingDesign) {
            # Update existing design
            $Entity = @{
                PartitionKey = [string]$JobId
                RowKey       = $ExistingDesign.RowKey
                JobId        = [string]$JobId
                DesignData   = $DesignDataJson
                LastModified = (Get-Date).ToString('o')
            }
        } else {
            # Create new design
            $Entity = @{
                PartitionKey = [string]$JobId
                RowKey       = [guid]::NewGuid().ToString()
                JobId        = [string]$JobId
                DesignData   = $DesignDataJson
                LastModified = (Get-Date).ToString('o')
            }
        }

        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results = 'Design saved successfully'
                DesignId = $Entity.RowKey
                JobId = $JobId
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
