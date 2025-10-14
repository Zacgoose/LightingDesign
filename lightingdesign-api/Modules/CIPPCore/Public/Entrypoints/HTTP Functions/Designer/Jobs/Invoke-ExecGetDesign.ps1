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
        $Filter = "PartitionKey eq '$JobId'"
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if ($Row) {
            # Parse the JSON
            # The DesignData property is already reassembled by Get-CIPPAzDataTableEntity
            $DesignData = if ($Row.DesignData) {
                $Row.DesignData | ConvertFrom-Json -Depth 20
            } else {
                # Return empty design structure if no data
                @{
                    canvasSettings = @()
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
                    canvasSettings = @()
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
