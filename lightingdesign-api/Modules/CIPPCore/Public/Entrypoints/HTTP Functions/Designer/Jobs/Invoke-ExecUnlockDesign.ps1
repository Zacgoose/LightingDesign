function Invoke-ExecUnlockDesign {
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
    $Force = $Request.Body.force -eq $true

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
        # Check if lock exists
        $Filter = "PartitionKey eq '$JobId'"
        $ExistingLock = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if (-not $ExistingLock) {
            return [HttpResponseContext]@{
                StatusCode = [System.Net.HttpStatusCode]::OK
                Body       = @{
                    Results  = 'No lock exists for this design'
                    IsLocked = $false
                }
            }
        }

        # Check if user owns the lock or force flag is set
        if ($ExistingLock.LockedBy -ne $Username -and -not $Force) {
            return [HttpResponseContext]@{
                StatusCode = [System.Net.HttpStatusCode]::Forbidden
                Body       = @{
                    error    = 'You cannot unlock a design locked by another user'
                    LockedBy = $ExistingLock.LockedBy
                }
            }
        }

        # Remove the lock
        Remove-AzDataTableEntity @Table -Entity $ExistingLock

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results  = 'Design unlocked successfully'
                IsLocked = $false
            }
        }

    } catch {
        Write-Error "Error unlocking design: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error   = 'Failed to unlock design'
                message = $_.Exception.Message
            }
        }
    }
}
