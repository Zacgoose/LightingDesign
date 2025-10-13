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

    try {
        # Lookup design by JobId
        # Note: Get-CIPPAzDataTableEntity handles chunked properties automatically by reassembling them
        $Filter = "JobId eq '{0}'" -f $JobId
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if ($Row) {
            # Parse the JSON
            # The DesignData property is already reassembled by Get-CIPPAzDataTableEntity
            $DesignData = if ($Row.DesignData -and (Test-Json -Json $Row.DesignData -ErrorAction SilentlyContinue)) {
                $Row.DesignData | ConvertFrom-Json -Depth 20
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
    } catch {
        Write-Error "Error retrieving design: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error = 'Failed to retrieve design'
                message = $_.Exception.Message
            }
        }
    }
}
