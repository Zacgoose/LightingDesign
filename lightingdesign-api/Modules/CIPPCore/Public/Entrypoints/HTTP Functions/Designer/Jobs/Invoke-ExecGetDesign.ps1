function Invoke-ExecGetDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Designs'
    
    $JobId = $Request.Query.jobId
    
    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId parameter is required' }
        }
    }

    # Lookup design by JobId
    $Filter = "JobId eq '{0}'" -f $JobId
    $Row = Get-AzDataTableEntity @Table -Filter $Filter
    
    if ($Row) {
        $DesignData = if ($Row.DesignData -and (Test-Json -Json $Row.DesignData -ErrorAction SilentlyContinue)) {
            $Row.DesignData | ConvertFrom-Json
        } else { 
            # Return empty design structure if no data
            @{
                products = @()
                connectors = @()
                layers = @()
            }
        }
        
        $ReturnedDesign = [PSCustomObject]@{
            designId     = $Row.RowKey
            jobId        = $Row.JobId
            designData   = $DesignData
            lastModified = $Row.LastModified
            created      = $Row.Timestamp
        }
    } else {
        # Return empty design for new jobs
        $ReturnedDesign = [PSCustomObject]@{
            designId     = $null
            jobId        = $JobId
            designData   = @{
                products = @()
                connectors = @()
                layers = @()
            }
            lastModified = $null
            created      = $null
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = $ReturnedDesign
    }
}
