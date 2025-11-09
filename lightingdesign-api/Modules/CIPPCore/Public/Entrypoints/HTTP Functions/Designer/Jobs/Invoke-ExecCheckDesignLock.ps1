function Invoke-ExecCheckDesignLock {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'DesignLocks'
    $JobId = $Request.Query.jobId
    $Username = $Request.Headers.'x-ms-client-principal-name'

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId parameter is required' }
        }
    }

    if (-not $Username) {
        $Username = 'Unknown User'
    }

    try {
        # Check if lock exists
        $Filter = "PartitionKey eq '$JobId'"
        $ExistingLock = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if (-not $ExistingLock) {
            return [HttpResponseContext]@{
                StatusCode = [System.Net.HttpStatusCode]::OK
                Body       = @{
                    IsLocked = $false
                    IsOwner  = $false
                }
            }
        }

        $Now = (Get-Date).ToUniversalTime()
        $LockExpiry = [DateTime]::Parse($ExistingLock.ExpiresAt)

        # Check if lock is expired
        if ($LockExpiry -le $Now) {
            # Lock has expired, remove it
            Remove-AzDataTableEntity @Table -Entity $ExistingLock

            return [HttpResponseContext]@{
                StatusCode = [System.Net.HttpStatusCode]::OK
                Body       = @{
                    IsLocked = $false
                    IsOwner  = $false
                }
            }
        }

        # Lock is valid
        $IsOwner = $ExistingLock.LockedBy -eq $Username

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                IsLocked  = $true
                IsOwner   = $IsOwner
                LockedBy  = $ExistingLock.LockedBy
                LockedAt  = $ExistingLock.LockedAt
                ExpiresAt = $ExistingLock.ExpiresAt
            }
        }

    } catch {
        Write-Error "Error checking design lock: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error   = 'Failed to check design lock'
                message = $_.Exception.Message
            }
        }
    }
}
