function Invoke-ExecGetDesignLockStatus {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $LocksTable = Get-CippTable -tablename 'DesignLocks'

    $JobId = $Request.Query.jobId
    
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

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId parameter is required' }
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

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = $LockInfo
        }
    } catch {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{ error = "Failed to check lock status: $($_.Exception.Message)" }
        }
    }
}
