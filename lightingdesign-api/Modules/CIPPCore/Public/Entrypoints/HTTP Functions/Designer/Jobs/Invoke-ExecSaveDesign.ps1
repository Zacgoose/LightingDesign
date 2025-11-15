function Invoke-ExecSaveDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $JobId = $Request.Body.jobId

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
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

    $Table = Get-CIPPTable -TableName 'Designs'
    $LocksTable = Get-CIPPTable -TableName 'DesignLocks'

    $DesignData = $Request.Body.designData

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

    if (-not $Username) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::Forbidden
            Body       = @{ error = 'Unable to identify user. Saving not allowed.' }
        }
    }

    try {
        # Check if design is locked and if user owns the lock
        $LockFilter = "PartitionKey eq '$JobId'"
        $DesignLock = Get-CIPPAzDataTableEntity @LocksTable -Filter $LockFilter

        if ($DesignLock) {
            $Now = (Get-Date).ToUniversalTime()
            $LockExpiry = [DateTime]::Parse($DesignLock.ExpiresAt)

            # Check if lock is still valid and owned by current user
            if ($LockExpiry -gt $Now) {
                if ($DesignLock.LockedBy -ne $Username) {
                    return [HttpResponseContext]@{
                        StatusCode = [System.Net.HttpStatusCode]::Forbidden
                        Body       = @{
                            error    = "Design is locked by $($DesignLock.LockedBy). You cannot save changes."
                            LockedBy = $DesignLock.LockedBy
                        }
                    }
                }
            }
        }

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

        Write-Host "Original JSON size: $($DesignDataJson.Length) characters"

        # Compress the data
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($DesignDataJson)
        $compressedStream = New-Object System.IO.MemoryStream
        $gzipStream = New-Object System.IO.Compression.GZipStream($compressedStream, [System.IO.Compression.CompressionMode]::Compress)
        $gzipStream.Write($bytes, 0, $bytes.Length)
        $gzipStream.Close()

        $compressedBytes = $compressedStream.ToArray()
        $compressedData = [Convert]::ToBase64String($compressedBytes)

        $compressionRatio = [math]::Round((1 - $compressedData.Length / $DesignDataJson.Length) * 100, 2)
        Write-Host "Compressed size: $($compressedData.Length) characters (saved $compressionRatio%)"

        # Create entity
        $Entity = @{
            PartitionKey     = [string]$JobId
            RowKey           = if ($ExistingDesign) { $ExistingDesign.RowKey } else { [guid]::NewGuid().ToString() }
            JobId            = [string]$JobId
            DesignData       = $compressedData
            OriginalSize     = $DesignDataJson.Length
            CompressionRatio = $compressionRatio
            LastModified     = (Get-Date).ToUniversalTime().ToString('o')
        }

        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

        Write-LogMessage -API 'SaveDesign' -message "Design saved successfully for JobId: $JobId (DesignId: $($Entity.RowKey)) by user: $Username - CompressionRatio: $compressionRatio%" -Sev 'Info' -headers $Request.Headers

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results          = 'Design saved successfully'
                DesignId         = $Entity.RowKey
                JobId            = $JobId
                OriginalSize     = $DesignDataJson.Length
                CompressedSize   = $compressedData.Length
                CompressionRatio = $compressionRatio
            }
        }

    } catch {
        Write-Error "Error saving design: $_"
        Write-Error "Stack trace: $($_.ScriptStackTrace)"
        Write-LogMessage -API 'SaveDesign' -message "Failed to save design for JobId: $JobId - Error: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
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
