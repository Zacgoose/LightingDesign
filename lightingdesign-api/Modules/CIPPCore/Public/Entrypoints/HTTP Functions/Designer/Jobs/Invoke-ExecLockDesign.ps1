function Invoke-ExecLockDesign {
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
    $null = Test-CIPPAccess -Request $Request -StoreId $Job.StoreId

    $Table = Get-CIPPTable -TableName 'DesignLocks'

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
            Body       = @{ error = 'Unable to identify user. Editing not allowed.' }
        }
    }

    try {
        # Check if lock already exists for this job
        $Filter = "PartitionKey eq '$JobId'"
        $ExistingLock = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        $Now = (Get-Date).ToUniversalTime()
        $LockTimeout = 15 # minutes - auto unlock after 15 minutes if not refreshed

        if ($ExistingLock) {
            # Check if lock is expired
            $LockExpiry = [DateTime]::Parse($ExistingLock.ExpiresAt)

            if ($LockExpiry -gt $Now) {
                # Lock is still valid
                if ($ExistingLock.LockedBy -eq $Username) {
                    # User already has the lock, refresh it
                    $ExistingLock.ExpiresAt = $Now.AddMinutes($LockTimeout).ToString('o')
                    $ExistingLock.LastRefreshed = $Now.ToString('o')
                    Add-CIPPAzDataTableEntity @Table -Entity $ExistingLock -Force

                    return [HttpResponseContext]@{
                        StatusCode = [System.Net.HttpStatusCode]::OK
                        Body       = @{
                            Results   = 'Lock refreshed successfully'
                            LockedBy  = $ExistingLock.LockedBy
                            LockedAt  = $ExistingLock.LockedAt
                            ExpiresAt = $ExistingLock.ExpiresAt
                            IsLocked  = $true
                            IsOwner   = $true
                        }
                    }
                } else {
                    # Someone else has the lock
                    return [HttpResponseContext]@{
                        StatusCode = [System.Net.HttpStatusCode]::Conflict
                        Body       = @{
                            error     = 'Design is locked by another user'
                            LockedBy  = $ExistingLock.LockedBy
                            LockedAt  = $ExistingLock.LockedAt
                            ExpiresAt = $ExistingLock.ExpiresAt
                            IsLocked  = $true
                            IsOwner   = $false
                        }
                    }
                }
            }
        }

        # Create new lock or replace expired lock
        $LockEntity = @{
            PartitionKey  = [string]$JobId
            RowKey        = [string]$JobId
            JobId         = [string]$JobId
            LockedBy      = [string]$Username
            LockedAt      = $Now.ToString('o')
            ExpiresAt     = $Now.AddMinutes($LockTimeout).ToString('o')
            LastRefreshed = $Now.ToString('o')
        }

        Add-CIPPAzDataTableEntity @Table -Entity $LockEntity -Force

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results   = 'Design locked successfully'
                LockedBy  = $LockEntity.LockedBy
                LockedAt  = $LockEntity.LockedAt
                ExpiresAt = $LockEntity.ExpiresAt
                IsLocked  = $true
                IsOwner   = $true
            }
        }

    } catch {
        Write-Error "Error locking design: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error   = 'Failed to lock design'
                message = $_.Exception.Message
            }
        }
    }
}
