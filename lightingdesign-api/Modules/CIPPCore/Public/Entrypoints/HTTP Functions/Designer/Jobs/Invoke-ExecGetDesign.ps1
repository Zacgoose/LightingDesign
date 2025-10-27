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
        # Get-CIPPAzDataTableEntity automatically reassembles split properties
        $Filter = "PartitionKey eq '$JobId'"
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if ($Row) {
            Write-Host "Retrieved design: RowKey=$($Row.RowKey)"

            # Check if DesignData exists and is valid
            $DesignDataJson = $Row.DesignData

            if ([string]::IsNullOrWhiteSpace($DesignDataJson)) {
                Write-Warning "DesignData is empty or null"
                $DesignData = @{
                    canvasSettings = @()
                    layers         = @()
                }
            } else {
                Write-Host "DesignData length: $($DesignDataJson.Length) characters"

                # Debug: Check for common issues
                if ($DesignDataJson -match '[^\x20-\x7E\r\n\t]' -and $DesignDataJson -notmatch '^[\x20-\x7E\r\n\t]*$') {
                    Write-Warning "DesignData contains unexpected non-printable characters"
                }

                try {
                    $DesignData = $DesignDataJson | ConvertFrom-Json -Depth 20 -ErrorAction Stop
                    Write-Host "✓ JSON parsing successful"
                } catch {
                    Write-Error "JSON parsing failed: $_"
                    Write-Host "Error at position: $($_.Exception.Message -replace '.*position (\d+).*', '$1')"

                    # Get context around error
                    if ($_.Exception.Message -match 'position (\d+)') {
                        $errorPos = [int]$matches[1]
                        $contextStart = [Math]::Max(0, $errorPos - 100)
                        $contextEnd = [Math]::Min($DesignDataJson.Length, $errorPos + 100)
                        $context = $DesignDataJson.Substring($contextStart, $contextEnd - $contextStart)
                        Write-Host "Context around error position:"
                        Write-Host $context

                        # Show bytes around error position
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($DesignDataJson.Substring($contextStart, [Math]::Min(50, $contextEnd - $contextStart)))
                        Write-Host "Hex bytes: $([BitConverter]::ToString($bytes))"
                    }

                    throw "Design data is corrupted. The design must be re-saved. Error: $($_.Exception.Message)"
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
            Write-Host "No existing design found for JobId: $JobId"
            $ReturnedDesign = [PSCustomObject]@{
                designId     = $null
                jobId        = $JobId
                designData   = @{
                    canvasSettings = @()
                    layers         = @()
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
                error   = 'Failed to retrieve design'
                message = $_.Exception.Message
            }
        }
    }
}
