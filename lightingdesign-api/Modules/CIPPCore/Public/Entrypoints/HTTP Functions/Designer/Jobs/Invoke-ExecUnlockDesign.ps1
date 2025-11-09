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
    $Force = $Request.Body.force -eq $true
    
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
            Body       = @{ error = 'jobId is required' }
        }
    }

    if (-not $Username) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::Forbidden
            Body       = @{ error = 'Unable to identify user. Editing not allowed.' }
        }
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
