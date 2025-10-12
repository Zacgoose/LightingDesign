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
        $Filter = "JobId eq '{0}'" -f $JobId
        $Row = Get-AzDataTableEntity @Table -Filter $Filter
        
        if ($Row) {
            $DesignDataJson = $null
            
            # Check if data is chunked
            if ($Row.ChunkCount -and $Row.ChunkCount -gt 0) {
                # Reassemble chunks
                $StringBuilder = New-Object System.Text.StringBuilder
                for ($i = 0; $i -lt $Row.ChunkCount; $i++) {
                    $ChunkProperty = "DesignData_$i"
                    if ($Row.$ChunkProperty) {
                        [void]$StringBuilder.Append($Row.$ChunkProperty)
                    }
                }
                $DesignDataJson = $StringBuilder.ToString()
            } elseif ($Row.DesignData) {
                # Single property (not chunked)
                $DesignDataJson = $Row.DesignData
            }
            
            # Parse the JSON
            $DesignData = if ($DesignDataJson -and (Test-Json -Json $DesignDataJson -ErrorAction SilentlyContinue)) {
                $DesignDataJson | ConvertFrom-Json -Depth 20
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
