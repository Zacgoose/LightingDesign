using namespace System.Net

function Invoke-ExecCreateSAMApp {
    <#
    .FUNCTIONALITY
        Entrypoint,AnyTenant
    .ROLE
        CIPP.AppSettings.ReadWrite
    #>
    [System.Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingConvertToSecureStringWithPlainText', '')]
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $KV = $env:WEBSITE_DEPLOYMENT_ID

    try {
        $Token = $Request.body
        if ($Token) {
            $URL = ($Request.headers.'x-ms-original-url').split('/api') | Select-Object -First 1
            $TenantId = (Invoke-RestMethod 'https://graph.microsoft.com/v1.0/organization' -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method GET -ContentType 'application/json').value.id
            #Find Existing app registration
            $AppId = (Invoke-RestMethod "https://graph.microsoft.com/v1.0/applications?`$filter=displayName eq 'CIPP-SAM'" -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method GET -ContentType 'application/json').value | Select-Object -Last 1
            #Check if the appId has the redirect URI, if not, add it.
            if ($AppId) {
                Write-Host "Found existing app: $($AppId.id). Reusing."
                $state = 'updated'
                #remove the entire web object from the app registration
                $ModuleBase = Get-Module -Name CIPPCore | Select-Object -ExpandProperty ModuleBase
                $SamManifestFile = Get-Item (Join-Path $ModuleBase 'Public\SAMManifest.json')
                $app = Get-Content $SamManifestFile.FullName | ConvertFrom-Json
                $app.web.redirectUris = @("$($url)/authredirect")
                $app = ConvertTo-Json -Depth 15 -Compress -InputObject $app
                Invoke-RestMethod "https://graph.microsoft.com/v1.0/applications/$($AppId.id)" -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method PATCH -Body $app -ContentType 'application/json'
            } else {
                $state = 'created'
                $ModuleBase = Get-Module -Name CIPPCore | Select-Object -ExpandProperty ModuleBase
                $SamManifestFile = Get-Item (Join-Path $ModuleBase 'Public\SAMManifest.json')
                $app = Get-Content $SamManifestFile.FullName | ConvertFrom-Json
                $app.web.redirectUris = @("$($url)/authredirect")
                $app = $app | ConvertTo-Json -Depth 15
                $AppId = (Invoke-RestMethod 'https://graph.microsoft.com/v1.0/applications' -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method POST -Body $app -ContentType 'application/json')
                $attempt = 0
                do {
                    try {
                        $SPN = (Invoke-RestMethod 'https://graph.microsoft.com/v1.0/servicePrincipals' -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method POST -Body "{ `"appId`": `"$($AppId.appId)`" }" -ContentType 'application/json')
                        Start-Sleep 2
                        $attempt ++
                    } catch {
                        $attempt ++
                    }
                } until ($attempt -gt 3)
            }
            $AppPassword = (Invoke-RestMethod "https://graph.microsoft.com/v1.0/applications/$($AppId.id)/addPassword" -Headers @{ authorization = "Bearer $($Token.access_token)" } -Method POST -Body '{"passwordCredential":{"displayName":"CIPPInstall"}}' -ContentType 'application/json').secretText

            if ($env:AzureWebJobsStorage -eq 'UseDevelopmentStorage=true' -or $env:NonLocalHostAzurite -eq 'true') {
                $DevSecretsTable = Get-CIPPTable -tablename 'DevSecrets'
                $Secret = Get-CIPPAzDataTableEntity @DevSecretsTable -Filter "PartitionKey eq 'Secret' and RowKey eq 'Secret'"
                if (!$Secret) { $Secret = New-Object -TypeName PSObject }
                $Secret | Add-Member -MemberType NoteProperty -Name 'PartitionKey' -Value 'Secret' -Force
                $Secret | Add-Member -MemberType NoteProperty -Name 'RowKey' -Value 'Secret' -Force
                $Secret | Add-Member -MemberType NoteProperty -Name 'tenantid' -Value $TenantId -Force
                $Secret | Add-Member -MemberType NoteProperty -Name 'applicationid' -Value $AppId.appId -Force
                $Secret | Add-Member -MemberType NoteProperty -Name 'applicationsecret' -Value $AppPassword -Force
                Write-Information ($Secret | ConvertTo-Json -Depth 5)
                Add-CIPPAzDataTableEntity @DevSecretsTable -Entity $Secret -Force
            } else {

                Set-AzKeyVaultSecret -VaultName $kv -Name 'tenantid' -SecretValue (ConvertTo-SecureString -String $TenantId -AsPlainText -Force)
                Set-AzKeyVaultSecret -VaultName $kv -Name 'applicationid' -SecretValue (ConvertTo-SecureString -String $Appid.appId -AsPlainText -Force)
                Set-AzKeyVaultSecret -VaultName $kv -Name 'applicationsecret' -SecretValue (ConvertTo-SecureString -String $AppPassword -AsPlainText -Force)
            }
            $ConfigTable = Get-CippTable -tablename 'Config'
            #update the ConfigTable with the latest appId, for caching compare.
            $NewConfig = @{
                PartitionKey  = 'AppCache'
                RowKey        = 'AppCache'
                ApplicationId = $AppId.appId
            }
            Add-CIPPAzDataTableEntity @ConfigTable -Entity $NewConfig -Force | Out-Null
            $Results = @{'message' = "Succesfully $state the application registration. The application ID is $($AppId.appid). You may continue to the next step."; severity = 'success' }
        }

    } catch {
        $Results = [pscustomobject]@{'Results' = "Failed. $($_.InvocationInfo.ScriptLineNumber):  $($_.Exception.message)"; severity = 'failed' }
    }

    # Associate values to output bindings by calling 'Push-OutputBinding'.
    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Results
        })

}
