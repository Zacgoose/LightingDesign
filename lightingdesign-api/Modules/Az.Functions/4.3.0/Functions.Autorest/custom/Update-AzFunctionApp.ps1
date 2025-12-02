
function Update-AzFunctionApp {
    [OutputType([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.ISite])]
    [Microsoft.Azure.PowerShell.Cmdlets.Functions.Description('Updates a function app.')]
    [CmdletBinding(DefaultParameterSetName='ByName', SupportsShouldProcess=$true, ConfirmImpact='Medium')]
    param(
        [Parameter(ParameterSetName="ByName", HelpMessage='The Azure subscription ID.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.DefaultInfo(Script='(Get-AzContext).Subscription.Id')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${SubscriptionId},
        
        [Parameter(Mandatory=$true, ParameterSetName='ByName', HelpMessage='The name of the resource group.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${ResourceGroupName},
        
        [Parameter(Mandatory=$true, ParameterSetName="ByName", HelpMessage='The name of the function app.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${Name},

        [Parameter(ParameterSetName='ByObjectInput', Mandatory=$true, ValueFromPipeline=$true)]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.ISite]
        [ValidateNotNull()]
        ${InputObject},

        [Parameter(HelpMessage='The name of the service plan.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${PlanName},

        [Parameter(HelpMessage='Forces the cmdlet to update the function app without prompting for confirmation.')]
        [System.Management.Automation.SwitchParameter]
        ${Force},

        [Parameter(HelpMessage='Name of the existing App Insights project to be added to the function app.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        [Alias("AppInsightsName")]
        ${ApplicationInsightsName},

        [Parameter(HelpMessage='Instrumentation key of App Insights to be added.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        [System.String]
        [Alias("AppInsightsKey")]
        ${ApplicationInsightsKey},

        [Parameter(HelpMessage='Resource tags.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.Info(PossibleTypes=([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.IResourceTags]))]
        [System.Collections.Hashtable]
        [ValidateNotNull()]
        ${Tag},

        [Parameter(HelpMessage="Specifies the type of identity used for the function app.
            The type 'None' will remove any identities from the function app. The acceptable values for this parameter are:
            - SystemAssigned
            - UserAssigned
            - None
            ")]
        [ArgumentCompleter([Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.FunctionAppManagedServiceIdentityUpdateType])]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.ManagedServiceIdentityType]
        ${IdentityType},

        [Parameter(HelpMessage="Specifies the list of user identities associated with the function app.
            The user identity references will be ARM resource ids in the form:
            '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedIdentity/identities/{identityName}'")]
        [ValidateNotNullOrEmpty()]
        [System.String[]]
        ${IdentityID},

        [Parameter(HelpMessage='Starts the operation and returns immediately, before the operation is completed. In order to determine if the operation has successfully been completed, use some other mechanism.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${NoWait},
        
        [Parameter(HelpMessage='Runs the cmdlet as a background job.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${AsJob},
        
        [Alias('AzureRMContext', 'AzureCredential')]
        [ValidateNotNull()]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Azure')]
        [System.Management.Automation.PSObject]
        ${DefaultProfile},

        [Parameter(DontShow)]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        # Wait for .NET debugger to attach
        ${Break},

        [Parameter(DontShow)]
        [ValidateNotNull()]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.SendAsyncStep[]]
        # SendAsync Pipeline Steps to be appended to the front of the pipeline
        ${HttpPipelineAppend},

        [Parameter(DontShow)]
        [ValidateNotNull()]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.SendAsyncStep[]]
        # SendAsync Pipeline Steps to be prepended to the front of the pipeline
        ${HttpPipelinePrepend},

        [Parameter(DontShow)]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Uri]
        # The URI for the proxy server to use
        ${Proxy},

        [Parameter(DontShow)]
        [ValidateNotNull()]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.PSCredential]
        # Credentials for a proxy server to use for the remote call
        ${ProxyCredential},

        [Parameter(DontShow)]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        # Use the default credentials for the proxy
        ${ProxyUseDefaultCredentials}
    )

    process {

        RegisterFunctionsTabCompleters

        # Remove bound parameters from the dictionary that cannot be process by the intenal cmdlets.
        $paramsToRemove = @(
            "PlanName",
            "ApplicationInsightsName",
            "ApplicationInsightsKey"
            "IdentityType",
            "IdentityID",
            "Tag"
        )
        foreach ($paramName in $paramsToRemove)
        {
            if ($PSBoundParameters.ContainsKey($paramName))
            {
                $PSBoundParameters.Remove($paramName)  | Out-Null
            }
        }

        $useParams = $false
        $params = GetParameterKeyValues -PSBoundParametersDictionary $PSBoundParameters `
                                        -ParameterList @("SubscriptionId", "HttpPipelineAppend", "HttpPipelinePrepend")

        $existingFunctionApp = $null

        if ($PsCmdlet.ParameterSetName -eq "ByObjectInput")
        {
            if ($PSBoundParameters.ContainsKey("InputObject"))
            {
                $PSBoundParameters.Remove("InputObject")  | Out-Null
            }

            $Name = $InputObject.Name
            
            $PSBoundParameters.Add("Name", $Name)  | Out-Null
            $PSBoundParameters.Add("ResourceGroupName", $InputObject.ResourceGroupName)  | Out-Null
            $PSBoundParameters.Add("SubscriptionId", $InputObject.SubscriptionId)  | Out-Null
            
            $existingFunctionApp = $InputObject                
        }
        else
        {
            $useParams = $true
            $existingFunctionApp = GetFunctionAppByName -Name $Name -ResourceGroupName $ResourceGroupName @params
        }

        $appSettings = New-Object -TypeName System.Collections.Generic.List[System.Object]
        $siteCofig = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.SiteConfig
        $functionAppDef = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.Site

        # Identity information
        if ($IdentityType)
        {
            $functionAppDef.IdentityType = $IdentityType

            if ($IdentityType -eq "UserAssigned")
            {
                # Set UserAssigned managed identity
                if (-not $IdentityID)
                {
                    $errorMessage = "IdentityID is required for UserAssigned identity"
                    $exception = [System.InvalidOperationException]::New($errorMessage)
                    ThrowTerminatingError -ErrorId "IdentityIDIsRequiredForUserAssignedIdentity" `
                                            -ErrorMessage $errorMessage `
                                            -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                            -Exception $exception

                }

                $identityUserAssignedIdentity = NewIdentityUserAssignedIdentity -IdentityID $IdentityID
                $functionAppDef.IdentityUserAssignedIdentity = $identityUserAssignedIdentity
            }
        }
        elseif ($existingFunctionApp.IdentityType)
        {
            if ($existingFunctionApp.IdentityType -eq "UserAssigned")
            {
                $functionAppDef.IdentityType = "UserAssigned"

                if ($existingFunctionApp.IdentityUserAssignedIdentity -and $existingFunctionApp.IdentityUserAssignedIdentity.Count -gt 0)
                {
                    $identityUserAssignedIdentity = NewIdentityUserAssignedIdentity -IdentityID $existingFunctionApp.IdentityUserAssignedIdentity.Keys
                    $functionAppDef.IdentityUserAssignedIdentity = $identityUserAssignedIdentity
                }
            }
            elseif ($existingFunctionApp.IdentityType -eq "SystemAssigned")
            {
                $functionAppDef.IdentityType = "SystemAssigned"
            }
            else
            {
                $errorMessage = "Unknown IdentityType '$($existingFunctionApp.IdentityType)'"
                $exception = [System.InvalidOperationException]::New($errorMessage)
                ThrowTerminatingError -ErrorId "UnknownIdentityType" `
                                        -ErrorMessage $errorMessage `
                                        -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                        -Exception $exception
            }
        }
        
        # Update function app hosting plan
        if ($PlanName)
        {
            # Validate that the new plan is exists
            $newFunctionAppPlan = GetServicePlan $PlanName @params

            # Get the current plan in which the app is being hosted
            $currentFunctionAppPlan = GetFunctionAppServicePlanInfo $existingFunctionApp.ServerFarmId @params

            ValidatePlanSwitchCompatibility -CurrentServicePlan $currentFunctionAppPlan -NewServicePlan $newFunctionAppPlan

            $functionAppDef.ServerFarmId = $newFunctionAppPlan.Id
            $functionAppDef.Location = $newFunctionAppPlan.Location
            $functionAppDef.Reserved = $newFunctionAppPlan.Reserved
        }
        else
        {
            # Copy the existing function app plan settings
            $functionAppDef.ServerFarmId = $existingFunctionApp.ServerFarmId
            $functionAppDef.Location = $existingFunctionApp.Location
            $functionAppDef.Reserved = $existingFunctionApp.Reserved
        }

        # Set Application Insights
        $currentApplicationSettings = $null
        $settings =  if ($useParams)
                     {
                        Az.Functions.internal\Get-AzWebAppApplicationSetting -Name $existingFunctionApp.Name -ResourceGroupName $existingFunctionApp.ResourceGroupName @params
                     } else {
                        Az.Functions.internal\Get-AzWebAppApplicationSetting -Name $existingFunctionApp.Name -ResourceGroupName $existingFunctionApp.ResourceGroupName -SubscriptionId $existingFunctionApp.SubscriptionId
                     }
        if ($null -ne $settings)
        {
            $currentApplicationSettings = ConvertWebAppApplicationSettingToHashtable -ApplicationSetting $settings -ShowAllAppSettings
        }

        if ($ApplicationInsightsKey)
        {
            $currentApplicationSettings['APPINSIGHTS_INSTRUMENTATIONKEY'] = $ApplicationInsightsKey
        }
        elseif ($ApplicationInsightsName)
        {
            $params = GetParameterKeyValues -PSBoundParametersDictionary $PSBoundParameters `
                                            -ParameterList @("SubscriptionId", "HttpPipelineAppend", "HttpPipelinePrepend")
            $appInsightsProject = GetApplicationInsightsProject -Name $ApplicationInsightsName @params
            if (-not $appInsightsProject)
            {
                $errorMessage = "Failed to get application insights key for project name '$ApplicationInsightsName'. Please make sure the project exist."
                $exception = [System.InvalidOperationException]::New($errorMessage)
                ThrowTerminatingError -ErrorId "ApplicationInsightsProjectNotFound" `
                                    -ErrorMessage $errorMessage `
                                    -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                    -Exception $exception
            }

            $currentApplicationSettings['APPINSIGHTS_INSTRUMENTATIONKEY'] = $appInsightsProject.InstrumentationKey
        }

        # Set app settings
        foreach ($appSettingName in $currentApplicationSettings.Keys)
        {
            $appSettingValue = $currentApplicationSettings[$appSettingName]
            $appSettings.Add((NewAppSetting -Name $appSettingName -Value $appSettingValue))
        }

        # Set Tag
        if ($Tag -and ($Tag.Count -gt 0))
        {
            $resourceTag = NewResourceTag -Tag $Tag
            $functionAppDef.Tag = $resourceTag
        }
        elseif ($existingFunctionApp.Tag.AdditionalProperties -and ($existingFunctionApp.Tag.AdditionalProperties.Count -gt 0))
        {
            $functionAppDef.Tag = $existingFunctionApp.Tag
        }

        # Set siteConfig properties: AlwaysOn, LinuxFxVersion, JavaVersion, PowerShellVersion
        $siteCofig.AlwaysOn = $existingFunctionApp.SiteConfig.AlwaysOn
        $siteCofig.LinuxFxVersion = $existingFunctionApp.SiteConfig.LinuxFxVersion            
        $siteCofig.JavaVersion = $existingFunctionApp.SiteConfig.JavaVersion
        $siteCofig.PowerShellVersion = $existingFunctionApp.SiteConfig.PowerShellVersion

        # Set the function app Kind
        $functionAppDef.Kind = $existingFunctionApp.Kind

        # Set app settings and site configuration
        $siteCofig.AppSetting = $appSettings
        $functionAppDef.Config = $siteCofig
        $PSBoundParameters.Add("SiteEnvelope", $functionAppDef)  | Out-Null

        if ($PsCmdlet.ShouldProcess($Name, "Updating function app"))
        {
            # Save the ErrorActionPreference
            $currentErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Stop'

            try
            {
                if ($PsCmdlet.ShouldProcess($Name, "Updating function app"))
                {
                    if ($Force.IsPresent -or $PsCmdlet.ShouldContinue("Update function app '$Name'?", "Updating function app"))
                    {
                        # Remove bound parameters from the dictionary that cannot be process by the intenal cmdlets
                        if ($PSBoundParameters.ContainsKey("Force"))
                        {
                            $PSBoundParameters.Remove("Force")  | Out-Null
                        }

                        Az.Functions.internal\Set-AzFunctionApp @PSBoundParameters
                    }
                }
            }
            catch
            {
                $errorMessage = GetErrorMessage -Response $_

                if ($errorMessage)
                {
                    $exception = [System.InvalidOperationException]::New($errorMessage)
                    ThrowTerminatingError -ErrorId "FailedToUdpateFunctionApp" `
                                            -ErrorMessage $errorMessage `
                                            -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                            -Exception $exception
                }

                throw $_
            }
            finally
            {
                # Reset the ErrorActionPreference
                $ErrorActionPreference = $currentErrorActionPreference
            }
        }
    }
}

# SIG # Begin signature block
# MIIoVQYJKoZIhvcNAQcCoIIoRjCCKEICAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCB+joQ4udqc4BI7
# 4CdnFC52vGxe/sxBTqS/Ow8BDFqjZKCCDYUwggYDMIID66ADAgECAhMzAAAEhJji
# EuB4ozFdAAAAAASEMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMjUwNjE5MTgyMTM1WhcNMjYwNjE3MTgyMTM1WjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQDtekqMKDnzfsyc1T1QpHfFtr+rkir8ldzLPKmMXbRDouVXAsvBfd6E82tPj4Yz
# aSluGDQoX3NpMKooKeVFjjNRq37yyT/h1QTLMB8dpmsZ/70UM+U/sYxvt1PWWxLj
# MNIXqzB8PjG6i7H2YFgk4YOhfGSekvnzW13dLAtfjD0wiwREPvCNlilRz7XoFde5
# KO01eFiWeteh48qUOqUaAkIznC4XB3sFd1LWUmupXHK05QfJSmnei9qZJBYTt8Zh
# ArGDh7nQn+Y1jOA3oBiCUJ4n1CMaWdDhrgdMuu026oWAbfC3prqkUn8LWp28H+2S
# LetNG5KQZZwvy3Zcn7+PQGl5AgMBAAGjggGCMIIBfjAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQUBN/0b6Fh6nMdE4FAxYG9kWCpbYUw
# VAYDVR0RBE0wS6RJMEcxLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
# dGlvbnMgTGltaXRlZDEWMBQGA1UEBRMNMjMwMDEyKzUwNTM2MjAfBgNVHSMEGDAW
# gBRIbmTlUAXTgqoXNzcitW2oynUClTBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
# d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0EyMDExXzIw
# MTEtMDctMDguY3JsMGEGCCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDov
# L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0EyMDEx
# XzIwMTEtMDctMDguY3J0MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQELBQADggIB
# AGLQps1XU4RTcoDIDLP6QG3NnRE3p/WSMp61Cs8Z+JUv3xJWGtBzYmCINmHVFv6i
# 8pYF/e79FNK6P1oKjduxqHSicBdg8Mj0k8kDFA/0eU26bPBRQUIaiWrhsDOrXWdL
# m7Zmu516oQoUWcINs4jBfjDEVV4bmgQYfe+4/MUJwQJ9h6mfE+kcCP4HlP4ChIQB
# UHoSymakcTBvZw+Qst7sbdt5KnQKkSEN01CzPG1awClCI6zLKf/vKIwnqHw/+Wvc
# Ar7gwKlWNmLwTNi807r9rWsXQep1Q8YMkIuGmZ0a1qCd3GuOkSRznz2/0ojeZVYh
# ZyohCQi1Bs+xfRkv/fy0HfV3mNyO22dFUvHzBZgqE5FbGjmUnrSr1x8lCrK+s4A+
# bOGp2IejOphWoZEPGOco/HEznZ5Lk6w6W+E2Jy3PHoFE0Y8TtkSE4/80Y2lBJhLj
# 27d8ueJ8IdQhSpL/WzTjjnuYH7Dx5o9pWdIGSaFNYuSqOYxrVW7N4AEQVRDZeqDc
# fqPG3O6r5SNsxXbd71DCIQURtUKss53ON+vrlV0rjiKBIdwvMNLQ9zK0jy77owDy
# XXoYkQxakN2uFIBO1UNAvCYXjs4rw3SRmBX9qiZ5ENxcn/pLMkiyb68QdwHUXz+1
# fI6ea3/jjpNPz6Dlc/RMcXIWeMMkhup/XEbwu73U+uz/MIIHejCCBWKgAwIBAgIK
# YQ6Q0gAAAAAAAzANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNV
# BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
# c29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlm
# aWNhdGUgQXV0aG9yaXR5IDIwMTEwHhcNMTEwNzA4MjA1OTA5WhcNMjYwNzA4MjEw
# OTA5WjB+MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYD
# VQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExMIICIjANBgkqhkiG
# 9w0BAQEFAAOCAg8AMIICCgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGfQhsqa+la
# UKq4BjgaBEm6f8MMHt03a8YS2AvwOMKZBrDIOdUBFDFC04kNeWSHfpRgJGyvnkmc
# 6Whe0t+bU7IKLMOv2akrrnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13YxC4D
# dato88tt8zpcoRb0RrrgOGSsbmQ1eKagYw8t00CT+OPeBw3VXHmlSSnnDb6gE3e+
# lD3v++MrWhAfTVYoonpy4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nk
# kDstrjNYxbc+/jLTswM9sbKvkjh+0p2ALPVOVpEhNSXDOW5kf1O6nA+tGSOEy/S6
# A4aN91/w0FK/jJSHvMAhdCVfGCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmd
# X4jiJV3TIUs+UsS1Vz8kA/DRelsv1SPjcF0PUUZ3s/gA4bysAoJf28AVs70b1FVL
# 5zmhD+kjSbwYuER8ReTBw3J64HLnJN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zd
# sGbiwZeBe+3W7UvnSSmnEyimp31ngOaKYnhfsi+E11ecXL93KCjx7W3DKI8sj0A3
# T8HhhUSJxAlMxdSlQy90lfdu+HggWCwTXWCVmj5PM4TasIgX3p5O9JawvEagbJjS
# 4NaIjAsCAwEAAaOCAe0wggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBRI
# bmTlUAXTgqoXNzcitW2oynUClTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTAL
# BgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBD
# uRQFTuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jv
# c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3J0MIGfBgNVHSAEgZcwgZQwgZEGCSsGAQQBgjcuAzCBgzA/BggrBgEF
# BQcCARYzaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1h
# cnljcHMuaHRtMEAGCCsGAQUFBwICMDQeMiAdAEwAZQBnAGEAbABfAHAAbwBsAGkA
# YwB5AF8AcwB0AGEAdABlAG0AZQBuAHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn
# 8oalmOBUeRou09h0ZyKbC5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+vj/oCso7
# v0epo/Np22O/IjWll11lhJB9i0ZQVdgMknzSGksc8zxCi1LQsP1r4z4HLimb5j0b
# pdS1HXeUOeLpZMlEPXh6I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6VoCo/
# KmtYSWMfCWluWpiW5IP0wI/zRive/DvQvTXvbiWu5a8n7dDd8w6vmSiXmE0OPQvy
# CInWH8MyGOLwxS3OW560STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBp
# mLJZiWhub6e3dMNABQamASooPoI/E01mC8CzTfXhj38cbxV9Rad25UAqZaPDXVJi
# hsMdYzaXht/a8/jyFqGaJ+HNpZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYb
# BL7fQccOKO7eZS/sl/ahXJbYANahRr1Z85elCUtIEJmAH9AAKcWxm6U/RXceNcbS
# oqKfenoi+kiVH6v7RyOA9Z74v2u3S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sL
# gOppO6/8MO0ETI7f33VtY5E90Z1WTk+/gFcioXgRMiF670EKsT/7qMykXcGhiJtX
# cVZOSEXAQsmbdlsKgEhr/Xmfwb1tbWrJUnMTDXpQzTGCGiYwghoiAgEBMIGVMH4x
# CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
# b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01p
# Y3Jvc29mdCBDb2RlIFNpZ25pbmcgUENBIDIwMTECEzMAAASEmOIS4HijMV0AAAAA
# BIQwDQYJYIZIAWUDBAIBBQCgga4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQw
# HAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIBNE
# jK/ov1Qo9b2FP7SLuHAow/SmQZh3UT2OkTkrpD4YMEIGCisGAQQBgjcCAQwxNDAy
# oBSAEgBNAGkAYwByAG8AcwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20wDQYJKoZIhvcNAQEBBQAEggEAAJnT68ju6gCj0fnHx8tfmUkjsIXrzVYh2M/X
# KGtmUUuGcBRGxQltfBWqun+ULjH+T/AR6n/kY+2RlJWqwDImqVn/CsaW2u9Uq9r1
# PKFKiMze/gZbhP0EGLT96yHiFFOVuBfQruCD7dEDoxmX4zSaBtqeCW9ItQKa3DiP
# oOAgM/ccaUD/Nw7/mHJ/2nCyfez8NSP1mzL8S41QqsDIf9bFPL5qxZp4KzXYfPo5
# W7WXoGhfD9YBB9s6Cv5R9A0cdzfoRLYctcsCdrLOKFkO1m2ItwWtwuTGgP65VkT3
# 5MEcUi28r4obXkJnjVAM7yLPR8eVOI80R1Gg8bXrOR9oAX8OmKGCF7AwghesBgor
# BgEEAYI3AwMBMYIXnDCCF5gGCSqGSIb3DQEHAqCCF4kwgheFAgEDMQ8wDQYJYIZI
# AWUDBAIBBQAwggFaBgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYBBAGE
# WQoDATAxMA0GCWCGSAFlAwQCAQUABCDnI+t4TR5BBFXI4sia+EwLFMWiscGWbaLR
# 4/bP2qPo4wIGaR3sRqgAGBMyMDI1MTEyMDA2MzI1Mi42NDZaMASAAgH0oIHZpIHW
# MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
# EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
# Hm5TaGllbGQgVFNTIEVTTjo1NTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCEf4wggcoMIIFEKADAgECAhMzAAACG9Cy
# uAJn93LPAAEAAAIbMA0GCSqGSIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
# IFBDQSAyMDEwMB4XDTI1MDgxNDE4NDgzMFoXDTI2MTExMzE4NDgzMFowgdMxCzAJ
# BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
# MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
# c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEnMCUGA1UECxMeblNoaWVs
# ZCBUU1MgRVNOOjU1MUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
# ZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
# jsWd52ZZkzB5Xe5g/l2GsOjAz30sg6jVxfFJV+w4xIDVyaI3LO8bIpmzYul3AZHg
# 50UIQ8PrSRZGpQqFkRNu+o3YKJ4g2uGYBRksHnHYR0uVSCQg58ThkYyeplGX3oAv
# GRVuPIpQtAiTsR76A/gdoU7HDwEbb73bJwTyrbKHhR+WaMy9DQHI4k5Qo4+bZDs0
# kj76bvhJvdGU+S8zxQBp7UAhjJnFqKxIusSITE7zCCR422ELhkhVVOFqK2w6h1MA
# vILe76hxRIcPj0SBL2r8O9tx5njU4+tg2rAdU153pmyhqazdpUccYBE9wDRFUd/e
# 9CoWx7TdnUicB+Mai7RT6qse7e5aGqX1B7bnj/ZHvrrfF+BJEIlS9iDXAUgekvXZ
# +FZmjvLwP+dN+0/crh++r4e8FknF7EX6IJfnmNeDN/68Z59kbaJ1f+P5mnKYfydC
# eZmxrGpS0taWkDk36D3jPVZflvxrc+1rhCIlM5v9agLEFI12QiBTfpOBOBr3AGCP
# k+eH0+latjQajug+2/BD12qb82500LQytUWT2ota/HYnRgSv1jvZ0/dml1FsxWYz
# OnCrjfdB/7N6pNySt4vn+PGN6dFLim7kxos+B9WfQPezJi3fuKyyDAB9zSHPj1Zu
# 8nZfecZJ9um4zj7DFgvJXTDTnG5qlG4ZdbFRa/rrfzkCAwEAAaOCAUkwggFFMB0G
# A1UdDgQWBBS2vp93/lxLppNK8OkauJ2AvNmIUDAfBgNVHSMEGDAWgBSfpxVdAF5i
# XYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
# c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
# JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRw
# Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRp
# bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1Ud
# JQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsF
# AAOCAgEAZkU1XxQD4OTM3GTht32TXShIfPBoMfSsFsBQqFOZqLJOxyJOllIBFpmp
# vOtGNPkC5Z8ldG8aCpvgFNo/jDWeT5FiW53dAj9KnZxpsQ3Pf5fRzSGHRcxEMOdX
# IVzDJwcZUX0cjfxna7ydNv8eXB/Xk6G6SyrR2OH6S1LHMW11m3UvKF+eLjIPl45r
# ximuDCoEd+ad0lOAXA5/vZOKN5n/ePYeP0LRchZX0Q6H8n/ZmSPMlbli3MO851Q0
# 9RmT/ZGHa+/Fdy+WLDrwcYykV9mUy/4TbwKw6FtdR6ZPHxMdIi1pk8Y2mC/GzCq0
# LCsH0uTFeQ6Q7Nc3MRmER/3mLWUhbaWHgX1FbYchvR22b+Bup+YPR5Q/0BhaaAN6
# AIBfcGs+u/nJoIByyZKA8cTyCmnUI/4vW6D4vywg3XBFf4f2DwFHy/evsC+58KMl
# +k2wa05X2kK0T/bCPLhaov9ZXyobawfNOLYGiauKT2FWvbwZzHIFCTxjBww6Pt5u
# RvCE/jnUcf/xhlOGMn6iKO9Xt49vZTE2SfIBk/34iLTRBJ6H7aGPTTQnza3OfWu1
# /dRycC6Wl5ons3PjnGXTSKSxXllJPmg6R/ulGonP/UCYoJ6mN+EXjfyDLPXLqsr9
# 1+VTG1rYzRCjPwBFAHv4EIwaE0ajCrf75eUGI3+oXU0UP6rloZ8wggdxMIIFWaAD
# AgECAhMzAAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQswCQYD
# VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
# MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3Nv
# ZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAxODIy
# MjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
# aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
# cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
# MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5
# vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64
# NmeFRiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhu
# je3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl
# 3GoPz130/o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SHJMPg
# yY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJiss254o2I
# 5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2
# ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afomXw/
# TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy
# 16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
# 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6H
# XtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMB
# AAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQW
# BBSfpxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30B
# ATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
# L0RvY3MvUmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYB
# BAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMB
# Af8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBL
# oEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
# TWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
# BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
# b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1Vffwq
# reEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27
# DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AFvonoaeC6Ce5732pv
# vinLbtg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9Ak
# vUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWK
# NsIdw2FzLixre24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2
# kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+
# c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep
# 8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L+Dvk
# txW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1Zyvg
# DbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
# 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDWTCCAkECAQEwggEBoYHZpIHW
# MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
# EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
# Hm5TaGllbGQgVFNTIEVTTjo1NTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUAhoV6r49M4GBd
# 41K1RYB1Z0f4zuCggYMwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
# aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
# cnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
# MDANBgkqhkiG9w0BAQsFAAIFAOzJE4AwIhgPMjAyNTExMjAwNDExNDRaGA8yMDI1
# MTEyMTA0MTE0NFowdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA7MkTgAIBADAKAgEA
# AgIoNQIB/zAHAgEAAgITUzAKAgUA7MplAAIBADA2BgorBgEEAYRZCgQCMSgwJjAM
# BgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3DQEB
# CwUAA4IBAQBFa9pLTioDJA71o0VttM5Fs+MMpmhQcKCq5JtwgnbLWEMN7fjn8Pf6
# o5UQZ2rO3Kg2OP8WVENKg1THcpPSfsBtbMjEUpdBlI6FhjIZDYFOSNG55hK7A4Gx
# Qt9Gfklz/8kZYWF3sIaowblRtPAtTCTTU9Aeoulof89E33UWi0MnErNs/dBPbA+w
# o5fBE4bsgMyYpzSzehWzUptd6QI6iCfdJ5XOaKI7zKYx8ifbUiFdsJzMGb6CSwtP
# SWya9VulE69WnWguNWwqvrsB1wV+C7fSpuRlsiOnRFlyrOmQ4K0ufEoQ30RMh27I
# gVLgj/LJonrOKQXuP2hQKFgbAQ/jxRDXMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UE
# BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
# BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
# IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAIb0LK4Amf3cs8AAQAAAhswDQYJYIZI
# AWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG
# 9w0BCQQxIgQgF7qqc76BnvsSPEev1YMh+mgL9OV/2ogaXhXgi2BzvK0wgfoGCyqG
# SIb3DQEJEAIvMYHqMIHnMIHkMIG9BCAwJRSVuD2jmMcQCFXdLuJAwDpUVNZ6bc6d
# fJU83Q2LgDCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMz
# AAACG9CyuAJn93LPAAEAAAIbMCIEIDSfzxR0NDXj45RIW9sZOyy8kHITtDlR9e3M
# 62uZQ8OrMA0GCSqGSIb3DQEBCwUABIICAB2KDWLNgcPfQWNXdbjszd3nUVkCR0n0
# rLr65SHDNJsSJDYIqumkAYtnW3N0go92teZkwtvjSNfZC2Lc8nuetcv46rnYTbee
# Pjm3PJdL3UXG/Iw1ieWUBoDqNId+78Ysz7hygknC93OEA1iFCbllnHpVll8Vafbn
# Mdr+C6XoKokUnSZnbA2atrDKhCYpn8nLeiOiLDuZrvve5vZ4JqajbVqwerykrOlf
# 9i5CJC15sgakCR4gmYIb3Ia3qZaOfpgFcgaleBJY6EgtYW8906h2/AVJ6b9Fv9hd
# f7VYlgza22dK3Ogpj0ES1+TREW11o6fRMEBkVVJTlY2RfWr549Q8dFSBsYK5dzxy
# dz+GBl8UgiuvWmukajSVDWDlKO5Uc7bNDiS7Otl8IZfLjOjiEbqfQwWXZTDl01+Y
# XIX/dA8gsmExtzimX0wOtxX0k/l4DGZP/5N+hEwNQNVepwjZRHiLUWPU1poHzjWW
# saBOelsEIJ9r9JrP0dQTkr0IQuNjLVggHOlyZ0AyXAOBvyvuIOiKjLZbBrgzFFLz
# uGeQzsFfBAmwtf1MtPhwOtjHoUSX0/7O6QolaYrT4Q9Y0e4KNeVnEBD2lv1tOmWD
# o4Ngveqc7CddAzY1cHCN1lvOyu+82+KaHDTFc6ZCoSmixZcbimpRcPoEJ8hpm485
# mPPaPiGeSdeP
# SIG # End signature block
