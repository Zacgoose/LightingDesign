function Invoke-ExecLockDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'DesignLocks'
    $JobId = $Request.Body.jobId
    $Username = $Request.Headers.'x-ms-client-principal-name'

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    if (-not $Username) {
        $Username = 'Unknown User'
    }

    try {
        # Check if lock already exists for this job
        $Filter = "PartitionKey eq '$JobId'"
        $ExistingLock = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        $Now = (Get-Date).ToUniversalTime()
        $LockTimeout = 30 # minutes

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
