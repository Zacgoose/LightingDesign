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
        # Lookup design by JobId (PartitionKey)
        $Filter = "PartitionKey eq '$JobId'"
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if ($Row) {
            Write-Host "Retrieved design: RowKey=$($Row.RowKey)"
            # Get the compressed design data
            $CompressedData = $Row.DesignData
            if ([string]::IsNullOrWhiteSpace($CompressedData)) {
                Write-Warning "DesignData is empty or null"
                $DesignData = @{
                    canvasSettings = @()
                    layers         = @()
                }
            } else {
                Write-Host "Compressed size: $($CompressedData.Length) characters"

                try {
                    # Decode from Base64
                    $compressedBytes = [Convert]::FromBase64String($CompressedData)

                    # Decompress
                    $inputStream = New-Object System.IO.MemoryStream(, $compressedBytes)
                    $gzipStream = New-Object System.IO.Compression.GZipStream($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
                    $outputStream = New-Object System.IO.MemoryStream

                    $gzipStream.CopyTo($outputStream)
                    $gzipStream.Close()

                    $decompressedBytes = $outputStream.ToArray()
                    $DesignDataJson = [System.Text.Encoding]::UTF8.GetString($decompressedBytes)

                    Write-Host "Decompressed to: $($DesignDataJson.Length) characters"
                } catch {
                    Write-Error "Decompression failed: $_"
                    throw "Failed to decompress design data: $($_.Exception.Message)"
                }

                try {
                    $DesignData = $DesignDataJson | ConvertFrom-Json -Depth 20 -ErrorAction Stop
                    Write-Host "✓ JSON parsing successful"
                } catch {
                    Write-Error "JSON parsing failed: $_"
                    # Debug info

                    if ($_.Exception.Message -match 'position (\d+)') {
                        $errorPos = [int]$matches[1]
                        $contextStart = [Math]::Max(0, $errorPos - 100)
                        $contextEnd = [Math]::Min($DesignDataJson.Length, $errorPos + 100)
                        $context = $DesignDataJson.Substring($contextStart, $contextEnd - $contextStart)
                        Write-Host "Context around error position:"
                        Write-Host $context
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
