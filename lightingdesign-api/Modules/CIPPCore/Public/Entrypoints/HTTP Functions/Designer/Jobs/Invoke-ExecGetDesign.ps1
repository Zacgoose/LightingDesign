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
        Write-Host "=== GET DESIGN DEBUG START ==="
        Write-Host "JobId: $JobId"
        
        # Lookup design by JobId
        # Note: Get-CIPPAzDataTableEntity handles chunked properties automatically by reassembling them
        $Filter = "JobId eq '$JobId'"
        Write-Host "Filter: $Filter"
        
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        Write-Host "Retrieved row from table"
        if ($Row) {
            Write-Host "Row found - RowKey: $($Row.RowKey)"
            Write-Host "Row has DesignData: $(if ($Row.DesignData) { 'Yes' } else { 'No' })"
            if ($Row.DesignData) {
                Write-Host "DesignData length: $($Row.DesignData.Length) bytes"
                Write-Host "DesignData starts with: $($Row.DesignData.Substring(0, [Math]::Min(100, $Row.DesignData.Length)))"
                Write-Host "DesignData ends with: $($Row.DesignData.Substring([Math]::Max(0, $Row.DesignData.Length - 100), [Math]::Min(100, $Row.DesignData.Length)))"
                
                # Check if there are any background images in the raw DesignData
                $backgroundImageMatches = [regex]::Matches($Row.DesignData, '"backgroundImage":\s*"([^"]{0,100})')
                Write-Host "Found $($backgroundImageMatches.Count) backgroundImage properties in raw DesignData"
                foreach ($match in $backgroundImageMatches) {
                    Write-Host "  Background starts with: $($match.Groups[1].Value)"
                }
            }
        } else {
            Write-Host "No row found for JobId: $JobId"
        }

        write-host $Row | ConvertFrom-Json -Depth 20

        if ($Row) {
            # Parse the JSON
            # The DesignData property is already reassembled by Get-CIPPAzDataTableEntity
            Write-Host "About to parse JSON from DesignData"
            $DesignData = if ($Row.DesignData) {
                $parsedData = $Row.DesignData | ConvertFrom-Json -Depth 20
                Write-Host "JSON parsed successfully"
                Write-Host "Parsed data has layers: $(if ($parsedData.layers) { 'Yes' } else { 'No' })"
                if ($parsedData.layers) {
                    Write-Host "Number of layers: $($parsedData.layers.Count)"
                    for ($i = 0; $i -lt $parsedData.layers.Count; $i++) {
                        $layer = $parsedData.layers[$i]
                        Write-Host "  Layer $i - Name: $($layer.name), HasBackground: $(if ($layer.backgroundImage) { 'Yes' } else { 'No' })"
                        if ($layer.backgroundImage) {
                            Write-Host "    Background length: $($layer.backgroundImage.Length)"
                            Write-Host "    Background starts with: $($layer.backgroundImage.Substring(0, [Math]::Min(50, $layer.backgroundImage.Length)))"
                        }
                    }
                }
                $parsedData
            } else {
                # Return empty design structure if no data
                @{
                    canvasSettings = @()
                    layers = @()
                }
            }

            Write-Host "Creating return object"
            $ReturnedDesign = [PSCustomObject]@{
                designId     = $Row.RowKey
                jobId        = $Row.JobId
                designData   = $DesignData
                lastModified = $Row.LastModified
                created      = $Row.Timestamp
            }
            Write-Host "Return object created with designId: $($ReturnedDesign.designId)"
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
            Write-Host "Returning empty design structure for new job"
        }

        Write-Host "=== GET DESIGN DEBUG END ==="

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
