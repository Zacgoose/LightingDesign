function Invoke-ExecGetUserInfo {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.User.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Get current user from request headers
        $User = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($Request.Headers.'x-ms-client-principal')) | ConvertFrom-Json
        
        $UserInfo = @{
            userId       = $User.userId
            userDetails  = $User.userDetails
            userName     = if ($User.claims) { ($User.claims | Where-Object { $_.typ -eq 'name' }).val } else { $User.userDetails }
            userEmail    = if ($User.claims) { ($User.claims | Where-Object { $_.typ -in @('email', 'preferred_username') }).val | Select-Object -First 1 } else { $null }
            userRoles    = $User.userRoles
            identityProvider = $User.identityProvider
        }

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = $UserInfo
        }
    }
    catch {
        Write-LogMessage -API 'GetUserInfo' -message "Failed to get user info: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{ error = "Failed to get user info: $($_.Exception.Message)" }
        }
    }
}
