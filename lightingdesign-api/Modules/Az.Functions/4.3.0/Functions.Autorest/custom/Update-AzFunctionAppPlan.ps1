function Update-AzFunctionAppPlan {
    [OutputType([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.IAppServicePlan])]
    [Microsoft.Azure.PowerShell.Cmdlets.Functions.Description('Updates a function app service plan.')]
    [CmdletBinding(DefaultParameterSetName='ByName', SupportsShouldProcess=$true, ConfirmImpact='Medium')]
    param(
        [Parameter(ParameterSetName='ByName', HelpMessage='The Azure subscription ID.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Path')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.DefaultInfo(Script='(Get-AzContext).Subscription.Id')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${SubscriptionId},

        [Parameter(Mandatory=$true, ParameterSetName='ByName', HelpMessage='Name of the resource group to which the resource belongs.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Path')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${ResourceGroupName},

        [Parameter(Mandatory=$true, ParameterSetName='ByName', HelpMessage='Name of the App Service plan.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Path')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${Name},

        [Parameter(ParameterSetName='ByObjectInput', Mandatory=$true, ValueFromPipeline=$true)]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.IAppServicePlan]
        [ValidateNotNull()]
        ${InputObject},

        [Parameter(HelpMessage='The plan sku. Valid inputs are: EP1, EP2, EP3')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [ArgumentCompleter([Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.SkuType])]
        [ValidateNotNullOrEmpty()]
        [System.String]
        # Sku (EP1, EP2 or EP3)
        ${Sku},

        [Parameter(HelpMessage='The maximum number of workers for the app service plan.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [System.Int32]
        [ValidateRange(1,100)]
        [Alias("MaxBurst")]
        ${MaximumWorkerCount},

        [Parameter(HelpMessage='The minimum number of workers for the app service plan.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [System.Int32]
        [Alias("MinInstances")]
        [ValidateRange(1,20)]
        ${MinimumWorkerCount},

        [Parameter(HelpMessage='Forces the cmdlet to update the function app plan without prompting for confirmation.')]
        [System.Management.Automation.SwitchParameter]
        ${Force},

        [Parameter(HelpMessage='Resource tags.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.Info(PossibleTypes=([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.IResourceTags]))]
        [System.Collections.Hashtable]
        [ValidateNotNull()]
        ${Tag},

        [Parameter(HelpMessage='Run the command asynchronously.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${NoWait},

        [Parameter(HelpMessage='Run the command as a job.')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${AsJob},

        [Parameter()]
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
        foreach ($paramName in @("Sku", "MaximumWorkerCount", "MinimumWorkerCount", "Tag"))
        {
            if ($PSBoundParameters.ContainsKey($paramName))
            {
                $PSBoundParameters.Remove($paramName)  | Out-Null
            }
        }

        $existingPlan = $null

        if ($PsCmdlet.ParameterSetName -eq "ByObjectInput")
        {
            if ($PSBoundParameters.ContainsKey("InputObject"))
            {
                $PSBoundParameters.Remove("InputObject")  | Out-Null
            }

            $Name = $InputObject.Name
            $ResourceGroupName = $InputObject.ResourceGroupName
            
            $PSBoundParameters.Add("Name", $Name)  | Out-Null
            $PSBoundParameters.Add("ResourceGroupName", $ResourceGroupName)  | Out-Null
            $PSBoundParameters.Add("SubscriptionId", $InputObject.SubscriptionId)  | Out-Null

            $existingPlan = $InputObject
        }
        else
        {
            $params = GetParameterKeyValues -PSBoundParametersDictionary $PSBoundParameters `
                                            -ParameterList @("SubscriptionId", "HttpPipelineAppend", "HttpPipelinePrepend")
            $existingPlan = Az.Functions.internal\Get-AzFunctionAppPlan -ResourceGroupName $ResourceGroupName `
                                                                        -Name $Name `
                                                                        -ErrorAction SilentlyContinue `
                                                                        @params

            if (-not $existingPlan)
            {
                $errorMessage = "Plan name '$Name' in resource group name '$ResourceGroupName' does not exist."
                $exception = [System.InvalidOperationException]::New($errorMessage)
                ThrowTerminatingError -ErrorId "PlanDoesNotExist" `
                                        -ErrorMessage $errorMessage `
                                        -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                        -Exception $exception
            }
        }

        # Make sure the plan is a 'ElasticPremium'
        if ($existingPlan.SkuTier -ne "ElasticPremium")
        {
            $errorMessage = "Only ElasticPremium sku is suported when updating a function app plan. Current plan sku is: $($existingPlan.SkuTier)."
            $exception = [System.InvalidOperationException]::New($errorMessage)
            ThrowTerminatingError -ErrorId "InvalidPlanSku" `
                                    -ErrorMessage $errorMessage `
                                    -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                    -Exception $exception
        }

        if ($MaximumWorkerCount -lt $MinimumWorkerCount)
        {
            $errorMessage = "MinimumWorkerCount '$($MinimumWorkerCount)' cannot be less than '$($MaximumWorkerCount)'."
            $exception = [System.InvalidOperationException]::New($errorMessage)
            ThrowTerminatingError -ErrorId "MaximumWorkerCountIsOnlySupportedForElasticPremiumPlan" `
                                    -ErrorMessage $errorMessage `
                                    -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                    -Exception $exception
        }

        $shouldUpdateFunctionAppPlan = $false;
        $servicePlan = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.AppServicePlan
        
        # Plan settings
        $servicePlan.Location = $existingPlan.Location
        $servicePlan.SkuTier  = $existingPlan.SkuTier
        $servicePlan.SkuName  = $existingPlan.SkuName
        $servicePlan.Capacity = $existingPlan.Capacity
        $servicePlan.Reserved = $existingPlan.Reserved
        
        if ($existingPlan.MaximumElasticWorkerCount)
        {
            $servicePlan.MaximumElasticWorkerCount = $existingPlan.MaximumElasticWorkerCount
        }

        if ($Sku)
        {
            $Sku = NormalizeSku -Sku $Sku
            $tier = GetSkuName -Sku $Sku
            if ($existingPlan.SkuName -ne $SkuName)
            {
                $servicePlan.SkuTier = $tier
                $servicePlan.SkuName = $Sku
                $shouldUpdateFunctionAppPlan = $true
            }
        }

        if ($Tag -and ($Tag.Count -gt 0))
        {
            $resourceTag = NewResourceTag -Tag $Tag
            $servicePlan.Tag = $resourceTag
            $shouldUpdateFunctionAppPlan = $true
        }

        if ($MinimumWorkerCount -gt 0)
        {
            $servicePlan.Capacity = $MinimumWorkerCount
            $shouldUpdateFunctionAppPlan = $true
        }

        if ($MaximumWorkerCount -gt 0)
        {
            $servicePlan.MaximumElasticWorkerCount = $MaximumWorkerCount
            $shouldUpdateFunctionAppPlan = $true
        }

        # Add the service plan definition
        $PSBoundParameters.Add("AppServicePlan", $servicePlan)  | Out-Null

        if ($PsCmdlet.ShouldProcess($Name, "Updating function app plan"))
        {
            # Save the ErrorActionPreference
            $currentErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Stop'

            try
            {
                if (-not $shouldUpdateFunctionAppPlan)
                {
                    # No changes for the current plan, return.
                    return
                }
                
                if ($PsCmdlet.ShouldProcess($Name, "Updating function app plan"))
                {
                    if ($Force.IsPresent -or $PsCmdlet.ShouldContinue("Update function app plan '$Name'?", "Updating function app plan"))
                    {
                        # Remove bound parameters from the dictionary that cannot be process by the intenal cmdlets
                        if ($PSBoundParameters.ContainsKey("Force"))
                        {
                            $PSBoundParameters.Remove("Force")  | Out-Null
                        }

                        Az.Functions.internal\Set-AzFunctionAppPlan @PSBoundParameters
                    }
                }
            }
            catch
            {
                $errorMessage = GetErrorMessage -Response $_
                if ($errorMessage)
                {
                    $exception = [System.InvalidOperationException]::New($errorMessage)
                    ThrowTerminatingError -ErrorId "FailedToUpdateFunctionAppPlan" `
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
# MIIoKgYJKoZIhvcNAQcCoIIoGzCCKBcCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCAl+y6s0M00na4y
# DS6Ej1lLyl5+Dk94c/AmGx+5SX21bqCCDXYwggX0MIID3KADAgECAhMzAAAEhV6Z
# 7A5ZL83XAAAAAASFMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMjUwNjE5MTgyMTM3WhcNMjYwNjE3MTgyMTM3WjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQDASkh1cpvuUqfbqxele7LCSHEamVNBfFE4uY1FkGsAdUF/vnjpE1dnAD9vMOqy
# 5ZO49ILhP4jiP/P2Pn9ao+5TDtKmcQ+pZdzbG7t43yRXJC3nXvTGQroodPi9USQi
# 9rI+0gwuXRKBII7L+k3kMkKLmFrsWUjzgXVCLYa6ZH7BCALAcJWZTwWPoiT4HpqQ
# hJcYLB7pfetAVCeBEVZD8itKQ6QA5/LQR+9X6dlSj4Vxta4JnpxvgSrkjXCz+tlJ
# 67ABZ551lw23RWU1uyfgCfEFhBfiyPR2WSjskPl9ap6qrf8fNQ1sGYun2p4JdXxe
# UAKf1hVa/3TQXjvPTiRXCnJPAgMBAAGjggFzMIIBbzAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQUuCZyGiCuLYE0aU7j5TFqY05kko0w
# RQYDVR0RBD4wPKQ6MDgxHjAcBgNVBAsTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEW
# MBQGA1UEBRMNMjMwMDEyKzUwNTM1OTAfBgNVHSMEGDAWgBRIbmTlUAXTgqoXNzci
# tW2oynUClTBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0EyMDExXzIwMTEtMDctMDguY3JsMGEG
# CCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDovL3d3dy5taWNyb3NvZnQu
# Y29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0EyMDExXzIwMTEtMDctMDguY3J0
# MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQELBQADggIBACjmqAp2Ci4sTHZci+qk
# tEAKsFk5HNVGKyWR2rFGXsd7cggZ04H5U4SV0fAL6fOE9dLvt4I7HBHLhpGdE5Uj
# Ly4NxLTG2bDAkeAVmxmd2uKWVGKym1aarDxXfv3GCN4mRX+Pn4c+py3S/6Kkt5eS
# DAIIsrzKw3Kh2SW1hCwXX/k1v4b+NH1Fjl+i/xPJspXCFuZB4aC5FLT5fgbRKqns
# WeAdn8DsrYQhT3QXLt6Nv3/dMzv7G/Cdpbdcoul8FYl+t3dmXM+SIClC3l2ae0wO
# lNrQ42yQEycuPU5OoqLT85jsZ7+4CaScfFINlO7l7Y7r/xauqHbSPQ1r3oIC+e71
# 5s2G3ClZa3y99aYx2lnXYe1srcrIx8NAXTViiypXVn9ZGmEkfNcfDiqGQwkml5z9
# nm3pWiBZ69adaBBbAFEjyJG4y0a76bel/4sDCVvaZzLM3TFbxVO9BQrjZRtbJZbk
# C3XArpLqZSfx53SuYdddxPX8pvcqFuEu8wcUeD05t9xNbJ4TtdAECJlEi0vvBxlm
# M5tzFXy2qZeqPMXHSQYqPgZ9jvScZ6NwznFD0+33kbzyhOSz/WuGbAu4cHZG8gKn
# lQVT4uA2Diex9DMs2WHiokNknYlLoUeWXW1QrJLpqO82TLyKTbBM/oZHAdIc0kzo
# STro9b3+vjn2809D0+SOOCVZMIIHejCCBWKgAwIBAgIKYQ6Q0gAAAAAAAzANBgkq
# hkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
# EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
# bjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
# IDIwMTEwHhcNMTEwNzA4MjA1OTA5WhcNMjYwNzA4MjEwOTA5WjB+MQswCQYDVQQG
# EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
# A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQg
# Q29kZSBTaWduaW5nIFBDQSAyMDExMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIIC
# CgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGfQhsqa+laUKq4BjgaBEm6f8MMHt03
# a8YS2AvwOMKZBrDIOdUBFDFC04kNeWSHfpRgJGyvnkmc6Whe0t+bU7IKLMOv2akr
# rnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13YxC4Ddato88tt8zpcoRb0Rrrg
# OGSsbmQ1eKagYw8t00CT+OPeBw3VXHmlSSnnDb6gE3e+lD3v++MrWhAfTVYoonpy
# 4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nkkDstrjNYxbc+/jLTswM9
# sbKvkjh+0p2ALPVOVpEhNSXDOW5kf1O6nA+tGSOEy/S6A4aN91/w0FK/jJSHvMAh
# dCVfGCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmdX4jiJV3TIUs+UsS1Vz8k
# A/DRelsv1SPjcF0PUUZ3s/gA4bysAoJf28AVs70b1FVL5zmhD+kjSbwYuER8ReTB
# w3J64HLnJN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zdsGbiwZeBe+3W7UvnSSmn
# Eyimp31ngOaKYnhfsi+E11ecXL93KCjx7W3DKI8sj0A3T8HhhUSJxAlMxdSlQy90
# lfdu+HggWCwTXWCVmj5PM4TasIgX3p5O9JawvEagbJjS4NaIjAsCAwEAAaOCAe0w
# ggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBRIbmTlUAXTgqoXNzcitW2o
# ynUClTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYwDwYD
# VR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBDuRQFTuHqp8cx0SOJNDBa
# BgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
# bC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNfMjIuY3JsMF4GCCsG
# AQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
# L3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNfMjIuY3J0MIGfBgNV
# HSAEgZcwgZQwgZEGCSsGAQQBgjcuAzCBgzA/BggrBgEFBQcCARYzaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1hcnljcHMuaHRtMEAGCCsG
# AQUFBwICMDQeMiAdAEwAZQBnAGEAbABfAHAAbwBsAGkAYwB5AF8AcwB0AGEAdABl
# AG0AZQBuAHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn8oalmOBUeRou09h0ZyKb
# C5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+vj/oCso7v0epo/Np22O/IjWll11l
# hJB9i0ZQVdgMknzSGksc8zxCi1LQsP1r4z4HLimb5j0bpdS1HXeUOeLpZMlEPXh6
# I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6VoCo/KmtYSWMfCWluWpiW5IP0
# wI/zRive/DvQvTXvbiWu5a8n7dDd8w6vmSiXmE0OPQvyCInWH8MyGOLwxS3OW560
# STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBpmLJZiWhub6e3dMNABQam
# ASooPoI/E01mC8CzTfXhj38cbxV9Rad25UAqZaPDXVJihsMdYzaXht/a8/jyFqGa
# J+HNpZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYbBL7fQccOKO7eZS/sl/ah
# XJbYANahRr1Z85elCUtIEJmAH9AAKcWxm6U/RXceNcbSoqKfenoi+kiVH6v7RyOA
# 9Z74v2u3S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sLgOppO6/8MO0ETI7f33Vt
# Y5E90Z1WTk+/gFcioXgRMiF670EKsT/7qMykXcGhiJtXcVZOSEXAQsmbdlsKgEhr
# /Xmfwb1tbWrJUnMTDXpQzTGCGgowghoGAgEBMIGVMH4xCzAJBgNVBAYTAlVTMRMw
# EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
# aWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNp
# Z25pbmcgUENBIDIwMTECEzMAAASFXpnsDlkvzdcAAAAABIUwDQYJYIZIAWUDBAIB
# BQCgga4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEO
# MAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIL/u2axFj9wKmOfTey3x4Q9U
# 7q6+kSlXEOMoaRpGY3ByMEIGCisGAQQBgjcCAQwxNDAyoBSAEgBNAGkAYwByAG8A
# cwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20wDQYJKoZIhvcNAQEB
# BQAEggEAZgNqT9WZIs4feTxduxKqa3Rn9S7c9iNTqUqf5QxoAy40h6GSXfakIl5v
# rneuuDATHI6sD94//VrCAQp+PRZ3CtUXYPP/vP/AKrexcl7HIfmF3ETaYd5vJokJ
# +4qh6dS3seM13sEPq/6MvKiaOUdPl4Z+MFwdCDUJb6I1NOUhNYg3fUWAq7/twE3w
# 1YGw8qRkgQvGHrheepD+9nPjJ5rCVU/DtEfSdkGN6wbE74wd2YE9dpZROK6LN55R
# /SHZQXr32WByPt5fp81dsehKaGwgrINQoTRIzS86k+dfnHrPU2/i6BMf7PbPQDbU
# WY+4lu5f3x/64av5TFdsjMnGralg2qGCF5QwgheQBgorBgEEAYI3AwMBMYIXgDCC
# F3wGCSqGSIb3DQEHAqCCF20wghdpAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFSBgsq
# hkiG9w0BCRABBKCCAUEEggE9MIIBOQIBAQYKKwYBBAGEWQoDATAxMA0GCWCGSAFl
# AwQCAQUABCCb6onDOMsy3CS4laR6l/osAt5UrMSxFCGq8WSf/X19YgIGaRXVFIpN
# GBMyMDI1MTEyMDA2MzMyNy4yMzFaMASAAgH0oIHRpIHOMIHLMQswCQYDVQQGEwJV
# UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
# ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1l
# cmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046QTkzNS0w
# M0UwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wg
# ghHqMIIHIDCCBQigAwIBAgITMwAAAgy5ZOM1nOz0rgABAAACDDANBgkqhkiG9w0B
# AQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
# VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNTAxMzAxOTQz
# MDBaFw0yNjA0MjIxOTQzMDBaMIHLMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
# aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
# cnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25z
# MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046QTkzNS0wM0UwLUQ5NDcxJTAjBgNV
# BAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3DQEB
# AQUAA4ICDwAwggIKAoICAQDKAVYmPeRtga/U6jzqyqLD0MAool23gcBN58+Z/Xsk
# YwNJsZ+O+wVyQYl8dPTK1/BC2xAic1m+JvckqjVaQ32KmURsEZotirQY4PKVW+eX
# wRt3r6szgLuic6qoHlbXox/l0HJtgURkzDXWMkKmGSL7z8/crqcvmYqv8t/slAF4
# J+mpzb9tMFVmjwKXONVdRwg9Q3WaPZBC7Wvoi7PRIN2jgjSBnHYyAZSlstKNrpYb
# 6+Gu6oSFkQzGpR65+QNDdkP4ufOf4PbOg3fb4uGPjI8EPKlpwMwai1kQyX+fgcgC
# oV9J+o8MYYCZUet3kzhhwRzqh6LMeDjaXLP701SXXiXc2ZHzuDHbS/sZtJ3627cV
# pClXEIUvg2xpr0rPlItHwtjo1PwMCpXYqnYKvX8aJ8nawT9W8FUuuyZPG1852+q4
# jkVleKL7x+7el8ETehbdkwdhAXyXimaEzWetNNSmG/KfHAp9czwsL1vKr4Rgn+pI
# IkZHuomdf5e481K+xIWhLCPdpuV87EqGOK/jbhOnZEqwdvA0AlMaLfsmCemZmupe
# jaYuEk05/6cCUxgF4zCnkJeYdMAP+9Z4kVh7tzRFsw/lZSl2D7EhIA6Knj6RffH2
# k7YtSGSv86CShzfiXaz9y6sTu8SGqF6ObL/eu/DkivyVoCfUXWLjiSJsrS63D0EH
# HQIDAQABo4IBSTCCAUUwHQYDVR0OBBYEFHUORSH/sB/rQ/beD0l5VxQ706GIMB8G
# A1UdIwQYMBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCG
# Tmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jvc29mdCUy
# MFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4w
# XAYIKwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2Vy
# dHMvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwG
# A1UdEwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/BAQD
# AgeAMA0GCSqGSIb3DQEBCwUAA4ICAQDZMPr4gVmwwf4GMB5ZfHSr34uhug6yzu4H
# UT+JWMZqz9uhLZBoX5CPjdKJzwAVvYoNuLmS0+9lA5S74rvKqd/u9vp88VGk6U7g
# MceatdqpKlbVRdn2ZfrMcpI4zOc6BtuYrzJV4cEs1YmX95uiAxaED34w02BnfuPZ
# XA0edsDBbd4ixFU8X/1J0DfIUk1YFYPOrmwmI2k16u6TcKO0YpRlwTdCq9vO0eEI
# ER1SLmQNBzX9h2ccCvtgekOaBoIQ3ZRai8Ds1f+wcKCPzD4qDX3xNgvLFiKoA6ZS
# G9S/yOrGaiSGIeDy5N9VQuqTNjryuAzjvf5W8AQp31hV1GbUDOkbUdd+zkJWKX4F
# mzeeN52EEbykoWcJ5V9M4DPGN5xpFqXy9aO0+dR0UUYWuqeLhDyRnVeZcTEu0xgm
# o+pQHauFVASsVORMp8TF8dpesd+tqkkQ8VNvI20oOfnTfL+7ZgUMf7qNV0ll0Wo5
# nlr1CJva1bfk2Hc5BY1M9sd3blBkezyvJPn4j0bfOOrCYTwYsNsjiRl/WW18NOpi
# wqciwFlUNqtWCRMzC9r84YaUMQ82Bywk48d4uBon5ZA8pXXS7jwJTjJj5USeRl9v
# jT98PDZyCFO2eFSOFdDdf6WBo/WZUA2hGZ0q+J7j140fbXCfOUIm0j23HaAV0ckD
# S/nmC/oF1jCCB3EwggVZoAMCAQICEzMAAAAVxedrngKbSZkAAAAAABUwDQYJKoZI
# hvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
# DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
# MjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eSAy
# MDEwMB4XDTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4MzIyNVowfDELMAkGA1UEBhMC
# VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
# BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
# bWUtU3RhbXAgUENBIDIwMTAwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoIC
# AQDk4aZM57RyIQt5osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX9gF/bErg4r25Phdg
# M/9cT8dm95VTcVrifkpa/rg2Z4VGIwy1jRPPdzLAEBjoYH1qUoNEt6aORmsHFPPF
# dvWGUNzBRMhxXFExN6AKOG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2Nr41JmTamDu6
# GnszrYBbfowQHJ1S/rboYiXcag/PXfT+jlPP1uyFVk3v3byNpOORj7I5LFGc6XBp
# Dco2LXCOMcg1KL3jtIckw+DJj361VI/c+gVVmG1oO5pGve2krnopN6zL64NF50Zu
# yjLVwIYwXE8s4mKyzbnijYjklqwBSru+cakXW2dg3viSkR4dPf0gz3N9QZpGdc3E
# XzTdEonW/aUgfX782Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgSUei/BQOj0XOmTTd0
# lBw0gg/wEPK3Rxjtp+iZfD9M269ewvPV2HM9Q07BMzlMjgK8QmguEOqEUUbi0b1q
# GFphAXPKZ6Je1yh2AuIzGHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ
# +QuJYfM2BjUYhEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AFemzFER1y7435UsSFF5PA
# PBXbGjfHCBUYP3irRbb1Hode2o+eFnJpxq57t7c+auIurQIDAQABo4IB3TCCAdkw
# EgYJKwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUKqdS/mTEmr6CkTxG
# NSnPEP8vBO4wHQYDVR0OBBYEFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMFwGA1UdIARV
# MFMwUQYMKwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWlj
# cm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAK
# BggrBgEFBQcDCDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMC
# AYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV9lbLj+iiXGJo0T2UkFvX
# zpoYxDBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20v
# cGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcmwwWgYI
# KwYBBQUHAQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20vcGtpL2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNydDANBgkqhkiG
# 9w0BAQsFAAOCAgEAnVV9/Cqt4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4sQaTlz0x
# M7U518JxNj/aZGx80HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN3Zi6th542DYunKmC
# VgADsAW+iehp4LoJ7nvfam++Kctu2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f8449
# xvNo32X2pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnDvBewVIVCs/wM
# nosZiefwC2qBwoEZQhlSdYo2wh3DYXMuLGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDS
# PeZKPmY7T7uG+jIa2Zb0j/aRAfbOxnT99kxybxCrdTDFNLB62FD+CljdQDzHVG2d
# Y3RILLFORy3BFARxv2T5JL5zbcqOCb2zAVdJVGTZc9d/HltEAY5aGZFrDZ+kKNxn
# GSgkujhLmm77IVRrakURR6nxt67I6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+Crvs
# QWY9af3LwUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8CwYKiexcdFYmNcP7ntdAoGokL
# jzbaukz5m/8K6TT4JDVnK+ANuOaMmdbhIurwJ0I9JZTmdHRbatGePu1+oDEzfbzL
# 6Xu/OHBE0ZDxyKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZqELQdVTNYs6FwZvKhggNN
# MIICNQIBATCB+aGB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
# bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
# b3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEn
# MCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkE5MzUtMDNFMC1EOTQ3MSUwIwYDVQQD
# ExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQDv
# u8hkhEMt5Z8Ldefls7z1LVU8pqCBgzCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
# IFBDQSAyMDEwMA0GCSqGSIb3DQEBCwUAAgUA7MjkZjAiGA8yMDI1MTEyMDAwNTA0
# NloYDzIwMjUxMTIxMDA1MDQ2WjB0MDoGCisGAQQBhFkKBAExLDAqMAoCBQDsyORm
# AgEAMAcCAQACAjXVMAcCAQACAhNQMAoCBQDsyjXmAgEAMDYGCisGAQQBhFkKBAIx
# KDAmMAwGCisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAwDQYJKoZI
# hvcNAQELBQADggEBABwKFJpeF25R8RyW1awsGwKtOCbCOTsxVinmdCGrq/I0lwHN
# 6ZgTGgcxh/P0WBwNpb9tCfWyfMjdquQVvfgH3pStqg/HO5biYLn/S+B1ZE8qB0n+
# foSdIHZVv9ZIcrKnGLXjHuzYTMepSwBL+q+vhFbFL0v+YHHACD0pFdUoOxu8p7z4
# uNvGzdYfqd6Kicvx4IAUfY9W7CeVTkg+3i3GZ4ukZ7acc77SdkCY27EEpui/jV7g
# 7s6YIA8gAX9m+nhx9BmHr8oA/g27KXPQlQOYa/N6TqbExG4KUS5/pIwesovIrLpL
# M4FsWHk968AkuS3ViDAl8+5i11I93mlc6jSMdcIxggQNMIIECQIBATCBkzB8MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
# b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAgy5ZOM1nOz0rgABAAACDDAN
# BglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8G
# CSqGSIb3DQEJBDEiBCCb+dZmzfFFgDfgrJ/OrVOC1WDSlREcClmsuD+XJawMEjCB
# +gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EINUo17cFMZN46MI5NfIAg9Ux5cO5
# xM9inre5riuOZ8ItMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
# c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
# b3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
# MTACEzMAAAIMuWTjNZzs9K4AAQAAAgwwIgQgSOreOC/FKmfTpRzHBDX7WVikKRXs
# FDXPxasrs46PxXQwDQYJKoZIhvcNAQELBQAEggIAdoYQghMxMmvs+RQMK493lnWi
# n8FPyetSa/3pkbE5q3zNLiDZTkNGMBzxHo7q5UVLQhH9bfwc5PxvWiZjEGmNGa4D
# dirLVBla/PizmKrOyNT2BmT5O6jOfAKgoAkmdRaOpct58pADIa5jHf9Hpbfl3ycx
# KFyrQPALy1ypImzQKkJ0JUpWGekz1trHUFPqSX2r4Cgi6L7D98k8iaeDteid+gp0
# X5p9eff7xAIRlInXZkUJgKk2ATtyBg3xcQTLMjADW0nOXhEH91S4+nZfJgAQUt+i
# Yh5VDUP8a16kpkGTTuDv4UJh/FY0WluRxHZT4Ou5oNyMdTzUL2ZWSyV4ZZSDM5yx
# jVburvTyvFHO/uZLkUIPDUp/65lkacp9gozVnigeTjPUXe0BOqVHyutAkMiGu+Wh
# xjfs7y2thPGd8RfEekXYkDT67hX80S1uELnaCxseLDDkqX9npVd2vDt4UhtwA69k
# xCA6My8/jfREj1G70gW1jkLNZl2I5sxa1xnZxMAxHcN3BvNafDA9LdtqtfxZQri/
# x+rfTh2Gv+V3HXFPKZVrOJMR8zu0GxloTaRmqUQL9WtHE9RjU3hytf3mz9udPQuU
# LAjtdErWrArx4SarhG3kThj86mTOH60EnfVXiHQG0HgqBH5W7Jt0NSQ5Wsw9Gs+A
# V/NC3eRaBXL9c8/6tj4=
# SIG # End signature block
