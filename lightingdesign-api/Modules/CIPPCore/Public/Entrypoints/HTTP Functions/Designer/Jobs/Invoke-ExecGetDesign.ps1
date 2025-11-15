function Invoke-ExecGetDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $JobId = $Request.Query.jobId

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId parameter is required' }
        }
    }

    # Get the job to retrieve its StoreId for access validation
    $JobTable = Get-CIPPTable -TableName 'Jobs'
    $JobFilter = "RowKey eq '{0}'" -f $JobId
    $Job = Get-CIPPAzDataTableEntity @JobTable -Filter $JobFilter

    if (-not $Job) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    # Validate store access
    Test-CIPPAccess -Request $Request -StoreId $Job.StoreId

    $Table = Get-CippTable -tablename 'Designs'
    $LocksTable = Get-CippTable -tablename 'DesignLocks'

    # Extract username using the correct method (same as Write-LogMessage)
    if ($Request.Headers.'x-ms-client-principal-idp' -eq 'azureStaticWebApps' -or !$Request.Headers.'x-ms-client-principal-idp') {
        $user = $Request.Headers.'x-ms-client-principal'
        try {
            $Username = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($user)) | ConvertFrom-Json).userDetails
        } catch {
            $Username = $null
        }
    } elseif ($Request.Headers.'x-ms-client-principal-idp' -eq 'aad') {
        $ClientTable = Get-CIPPTable -TableName 'ApiClients'
        $Client = Get-CIPPAzDataTableEntity @ClientTable -Filter "RowKey eq '$($Request.Headers.'x-ms-client-principal-name')'"
        $Username = $Client.AppName ?? $null
    } else {
        try {
            $user = $Request.Headers.'x-ms-client-principal'
            $Username = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($user)) | ConvertFrom-Json).userDetails
        } catch {
            $Username = $null
        }
    }

    # Note: Username can be null for read-only viewing, but lock ownership won't be granted

    try {
        # Check lock status
        $LockFilter = "PartitionKey eq '$JobId'"
        $LockRow = Get-CIPPAzDataTableEntity @LocksTable -Filter $LockFilter

        $LockInfo = $null
        if ($LockRow) {
            $Now = (Get-Date).ToUniversalTime()
            $LockExpiry = [DateTime]::Parse($LockRow.ExpiresAt)

            # Check if lock is still valid
            if ($LockExpiry -gt $Now) {
                $IsOwner = $LockRow.LockedBy -eq $Username
                $LockInfo = @{
                    IsLocked  = $true
                    IsOwner   = $IsOwner
                    LockedBy  = $LockRow.LockedBy
                    LockedAt  = $LockRow.LockedAt
                    ExpiresAt = $LockRow.ExpiresAt
                }
            } else {
                # Lock expired, remove it
                try {
                    Remove-AzDataTableEntity @LocksTable -Entity $LockRow
                } catch {
                    Write-Warning "Failed to remove expired lock: $_"
                }
                $LockInfo = @{
                    IsLocked = $false
                    IsOwner  = $false
                }
            }
        } else {
            $LockInfo = @{
                IsLocked = $false
                IsOwner  = $false
            }
        }

        # Lookup design by JobId (PartitionKey)
        $Filter = "PartitionKey eq '$JobId'"
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if ($Row) {
            Write-Host "Retrieved design: RowKey=$($Row.RowKey)"
            Write-LogMessage -API 'GetDesign' -message "Retrieved design for JobId: $JobId (DesignId: $($Row.RowKey))" -Sev 'Info' -headers $Request.Headers
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
                lockInfo     = $LockInfo
            }
        } else {
            # Return empty design for new jobs
            Write-Host "No existing design found for JobId: $JobId"
            Write-LogMessage -API 'GetDesign' -message "No existing design found for JobId: $JobId, returning empty design" -Sev 'Info' -headers $Request.Headers
            $ReturnedDesign = [PSCustomObject]@{
                designId     = $null
                jobId        = $JobId
                designData   = @{
                    canvasSettings = @()
                    layers         = @()
                }
                lastModified = $null
                created      = $null
                lockInfo     = $LockInfo
            }
        }

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = $ReturnedDesign
        }

    } catch {
        Write-Error "Error retrieving design: $_"
        Write-LogMessage -API 'GetDesign' -message "Failed to retrieve design for JobId: $JobId - Error: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error   = 'Failed to retrieve design'
                message = $_.Exception.Message
            }
        }
    }
}
