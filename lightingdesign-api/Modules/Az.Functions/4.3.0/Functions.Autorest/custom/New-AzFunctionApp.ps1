function New-AzFunctionApp {
    [OutputType([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.ISite])]
    [Microsoft.Azure.PowerShell.Cmdlets.Functions.Description('Creates a function app.')]
    [CmdletBinding(SupportsShouldProcess=$true, DefaultParametersetname="Consumption")]
    param(
        [Parameter(ParameterSetName="Consumption", HelpMessage='The Azure subscription ID.')]
        [Parameter(ParameterSetName="ByAppServicePlan")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.DefaultInfo(Script='(Get-AzContext).Subscription.Id')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${SubscriptionId},
        
        [Parameter(Mandatory=$true, ParameterSetName="Consumption", HelpMessage='The name of the resource group.')]
        [Parameter(Mandatory=$true, ParameterSetName="ByAppServicePlan")]
        [Parameter(Mandatory=$true, ParameterSetName="CustomDockerImage")]
        [Parameter(Mandatory=$true, ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(Mandatory=$true, ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${ResourceGroupName},
        
        [Parameter(Mandatory=$true, ParameterSetName="Consumption", HelpMessage='The name of the function app.')]
        [Parameter(Mandatory=$true, ParameterSetName="ByAppServicePlan")]
        [Parameter(Mandatory=$true, ParameterSetName="CustomDockerImage")]
        [Parameter(Mandatory=$true, ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(Mandatory=$true,ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${Name},
        
        [Parameter(Mandatory=$true, ParameterSetName="Consumption", HelpMessage='The name of the storage account.')]
        [Parameter(Mandatory=$true, ParameterSetName="ByAppServicePlan")]
        [Parameter(Mandatory=$true, ParameterSetName="CustomDockerImage")]
        [Parameter(Mandatory=$true, ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(Mandatory=$true, ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${StorageAccountName},

        [Parameter(ParameterSetName="Consumption", HelpMessage='Name of the existing App Insights project to be added to the function app.')]
        [Parameter(ParameterSetName="ByAppServicePlan")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        [Alias("AppInsightsName")]
        ${ApplicationInsightsName},

        [Parameter(ParameterSetName="Consumption", HelpMessage='Instrumentation key of App Insights to be added.')]
        [Parameter(ParameterSetName="ByAppServicePlan")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        [Alias("AppInsightsKey")]
        ${ApplicationInsightsKey},

        [Parameter(Mandatory=$true, ParameterSetName="Consumption", HelpMessage='The location for the consumption plan.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${Location},

        [Parameter(Mandatory=$true, ParameterSetName="ByAppServicePlan", HelpMessage='The name of the service plan.')]
        [Parameter(Mandatory=$true, ParameterSetName="CustomDockerImage")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${PlanName},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='The OS to host the function app.')]
        [Parameter(ParameterSetName="Consumption")]
        [ArgumentCompleter([Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.WorkerType])]
        [ValidateSet("Linux", "Windows")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        # OS type (Linux or Windows)
        ${OSType},
        
        [Parameter(Mandatory=$true, ParameterSetName="ByAppServicePlan", HelpMessage='The function runtime.')]
        [Parameter(Mandatory=$true, ParameterSetName="Consumption")]
        [Parameter(Mandatory=$true, ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        # Runtime types are defined in HelperFunctions.ps1
        ${Runtime},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='The function runtime.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        # RuntimeVersion types are defined in HelperFunctions.ps1
        ${RuntimeVersion},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='The Functions version.')]
        [Parameter(ParameterSetName="Consumption")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        # FunctionsVersion types are defined in HelperFunctions.ps1
        ${FunctionsVersion},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='Disable creating application insights resource during the function app creation. No logs will be available.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [System.Management.Automation.SwitchParameter]
        [Alias("DisableAppInsights")]
        ${DisableApplicationInsights},
        
        [Parameter(Mandatory=$true, ParameterSetName="CustomDockerImage", HelpMessage='Container image name, e.g., publisher/image-name:tag.')]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        [Alias("DockerImageName")]
        ${Image},

        [Parameter(ParameterSetName="CustomDockerImage", HelpMessage='The container registry username and password. Required for private registries.')]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [ValidateNotNullOrEmpty()]
        [PSCredential]
        [Alias("DockerRegistryCredential")]
        ${RegistryCredential},

        [Parameter(HelpMessage='Returns true when the command succeeds.')]
        [System.Management.Automation.SwitchParameter]
        ${PassThru},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='Starts the operation and returns immediately, before the operation is completed. In order to determine if the operation has successfully been completed, use some other mechanism.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${NoWait},
        
        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='Runs the cmdlet as a background job.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Runtime')]
        [System.Management.Automation.SwitchParameter]
        ${AsJob},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='Resource tags.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Runtime.Info(PossibleTypes=([Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.IResourceTags]))]
        [System.Collections.Hashtable]
        [ValidateNotNull()]
        ${Tag},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage='Function app settings.')]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ValidateNotNullOrEmpty()]
        [Hashtable]
        ${AppSetting},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage="Specifies the type of identity used for the function app.
            The acceptable values for this parameter are:
            - SystemAssigned
            - UserAssigned
            ")]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ArgumentCompleter([Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.FunctionAppManagedServiceIdentityCreateType])]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Category('Body')]
        [Microsoft.Azure.PowerShell.Cmdlets.Functions.Support.ManagedServiceIdentityType]
        ${IdentityType},

        [Parameter(ParameterSetName="ByAppServicePlan", HelpMessage="Specifies the list of user identities associated with the function app.
            The user identity references will be ARM resource ids in the form:
            '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedIdentity/identities/{identityName}'")]
        [Parameter(ParameterSetName="Consumption")]
        [Parameter(ParameterSetName="CustomDockerImage")]
        [Parameter(ParameterSetName="EnvironmentForContainerApp")]
        [Parameter(ParameterSetName="FlexConsumption")]
        [ValidateNotNull()]
        [System.String[]]
        ${IdentityID},

        [Parameter(Mandatory=$true,ParameterSetName="FlexConsumption", HelpMessage='Location to create Flex Consumption function app.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${FlexConsumptionLocation},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Name of deployment storage account to be used for function app artifacts.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${DeploymentStorageName},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Deployment storage container name.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${DeploymentStorageContainerName},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Deployment storage authentication type. Allowed values: StorageAccountConnectionString, SystemAssignedIdentity, UserAssignedIdentity')]
        [ValidateSet("StorageAccountConnectionString", "SystemAssignedIdentity", "UserAssignedIdentity")]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${DeploymentStorageAuthType},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Deployment storage authentication value used for the chosen auth type (eg: connection string, or user-assigned identity resource id).')]
        [System.String]
        [ValidateNotNullOrEmpty()]
        ${DeploymentStorageAuthValue},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage=
'Array of hashtables describing the AlwaysReady configuration. Each hashtable must include:
- name: The function name or route name.
- instanceCount: The number of pre-warmed instances for that function.

Example:
@(@{ name = "http"; instanceCount = 2 }).')]
        [ValidateNotNullOrEmpty()]
        [Hashtable[]]
        ${AlwaysReady},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Maximum instance count for Flex Consumption.')]
        [ValidateRange(40, 1000)]
        [int]
        ${MaximumInstanceCount},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Per-instance memory in MB for Flex Consumption instances.')]
        [ValidateSet(512, 2048, 4096)]
        [int]
        ${InstanceMemoryMB},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='The maximum number of concurrent HTTP trigger invocations per instance.')]
        [ValidateRange(1, 1000)]
        [int]
        ${HttpPerInstanceConcurrency},

        [Parameter(ParameterSetName="FlexConsumption", HelpMessage='Enable zone redundancy for high availability. Applies to Flex Consumption SKU only.')]
        [System.Management.Automation.SwitchParameter]
        ${EnableZoneRedundancy},

        [Parameter(Mandatory=$true, ParameterSetName="EnvironmentForContainerApp", HelpMessage='Name of the container app environment.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${Environment},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The workload profile name to run the container app on.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${WorkloadProfileName},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The CPU in cores of the container app. e.g., 0.75.')]
        [ValidateNotNullOrEmpty()]
        [Double]
        ${ResourceCpu},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The memory size of the container app. e.g., 1.0Gi.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${ResourceMemory},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The maximum number of replicas when creating a function app on container app.')]
        [ValidateScript({$_ -gt 0})]
        [Int]
        ${ScaleMaxReplica},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The minimum number of replicas when create function app on container app.')]
        [ValidateScript({$_ -gt 0})]
        [Int]
        ${ScaleMinReplica},

        [Parameter(Mandatory=$false, ParameterSetName="EnvironmentForContainerApp", HelpMessage='The container registry server hostname, e.g. myregistry.azurecr.io.')]
        [ValidateNotNullOrEmpty()]
        [System.String]
        ${RegistryServer},
        
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
            "StorageAccountName",
            "ApplicationInsightsName",
            "ApplicationInsightsKey",
            "Location",
            "PlanName",
            "OSType",
            "Runtime",
            "DisableApplicationInsights",
            "Image",
            "RegistryCredential",
            "FunctionsVersion",
            "RuntimeVersion",
            "AppSetting",
            "IdentityType",
            "IdentityID",
            "Tag",
            "Environment",
            "RegistryServer",
            "WorkloadProfileName",
            "ResourceCpu",
            "ResourceMemory",
            "ScaleMaxReplica",
            "ScaleMinReplica",
            "FlexConsumptionLocation",
            "DeploymentStorageName",
            "DeploymentStorageContainerName",
            "DeploymentStorageAuthType",
            "DeploymentStorageAuthValue",
            "AlwaysReady",
            "MaximumInstanceCount",
            "InstanceMemoryMB",
            "HttpPerInstanceConcurrency",
            "EnableZoneRedundancy"
        )
        foreach ($paramName in $paramsToRemove)
        {
            if ($PSBoundParameters.ContainsKey($paramName))
            {
                $PSBoundParameters.Remove($paramName)  | Out-Null
            }
        }

        $functionAppIsCustomDockerImage = $PsCmdlet.ParameterSetName -eq "CustomDockerImage"
        $environmentForContainerApp = $PsCmdlet.ParameterSetName -eq "EnvironmentForContainerApp"
        $consumptionPlan = $PsCmdlet.ParameterSetName -eq "Consumption"
        $functionAppIsFlexConsumption = $PsCmdlet.ParameterSetName -eq "FlexConsumption"

        $flexConsumptionStorageContainerCreated = $false
        $flexConsumptionPlanCreated = $false
        $appInsightCreated = $false
        $functionAppCreatedSuccessfully = $false

        $appSettings = New-Object -TypeName System.Collections.Generic.List[System.Object]
        $siteConfig = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.SiteConfig
        $functionAppDef = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20231201.Site

        $OSIsLinux = ($OSType -eq "Linux") -or $functionAppIsFlexConsumption

        $params = GetParameterKeyValues -PSBoundParametersDictionary $PSBoundParameters `
                                        -ParameterList @("SubscriptionId", "HttpPipelineAppend", "HttpPipelinePrepend")

        ValidateFunctionAppNameAvailability -Name $Name @params

        $runtimeJsonDefinition = $null

        if (-not ($functionAppIsCustomDockerImage -or $environmentForContainerApp -or $functionAppIsFlexConsumption))
        {
            if (-not $FunctionsVersion)
            {
                $FunctionsVersion = $DefaultFunctionsVersion
                Write-Warning "FunctionsVersion not specified. Setting default value to '$FunctionsVersion'. $SetDefaultValueParameterWarningMessage"
            }

            ValidateFunctionsVersion -FunctionsVersion $FunctionsVersion

            if (-not $OSType)
            {
                $OSType = GetDefaultOSType -Runtime $Runtime
                Write-Warning "OSType not specified. Setting default value to '$OSType'. $SetDefaultValueParameterWarningMessage"
            }

            $runtimeJsonDefinition = GetStackDefinitionForRuntime -FunctionsVersion $FunctionsVersion -Runtime $Runtime -RuntimeVersion $RuntimeVersion -OSType $OSType

            if (-not $runtimeJsonDefinition)
            {
                $errorId = "FailedToGetRuntimeDefinition"
                $message += "Failed to get runtime definition for '$Runtime' version '$RuntimeVersion' in Functions version '$FunctionsVersion' on '$OSType'."
                $exception = [System.InvalidOperationException]::New($message)
                ThrowTerminatingError -ErrorId $errorId `
                                      -ErrorMessage $message `
                                      -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                      -Exception $exception

            }

            # Add app settings
            if ($runtimeJsonDefinition.AppSettingsDictionary.Count -gt 0)
            {
                foreach ($keyName in $runtimeJsonDefinition.AppSettingsDictionary.Keys)
                {
                    $value = $runtimeJsonDefinition.AppSettingsDictionary[$keyName]
                    $appSettings.Add((NewAppSetting -Name $keyName -Value $value))
                }
            }

            # Add site config properties
            if ($runtimeJsonDefinition.SiteConfigPropertiesDictionary.Count -gt 0)
            {
                foreach ($PropertyName in $runtimeJsonDefinition.SiteConfigPropertiesDictionary.Keys)
                {
                    $value = $runtimeJsonDefinition.SiteConfigPropertiesDictionary[$PropertyName]
                    $siteConfig.$PropertyName = $value
                }
            }
        }

        # Set function app managed identity
        if ($IdentityType)
        {
            $functionAppDef.IdentityType = $IdentityType

            if ($IdentityType -eq "UserAssigned")
            {
                # Set UserAssigned managed identiy
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

        $servicePlan = $null
        $dockerRegistryServerUrl = $null
        
        if ($consumptionPlan)
        {
            ValidateConsumptionPlanLocation -Location $Location -OSIsLinux:$OSIsLinux @params
            $functionAppDef.Location = $Location
        }
        elseif ($environmentForContainerApp)
        {
            $OSIsLinux = $true

            if (-not $Image)
            {
                Write-Warning "Image not specified. Setting default value to '$DefaultCentauriImage'."
                $Image = $DefaultCentauriImage
            }
            if ($RegistryServer)
            {
                $dockerRegistryServerUrl = $RegistryServer
            }

            if ($Environment -and $RegistryCredential)
            {
                # Error out if the user has specified both Environment and RegistryCredential and not provided RegistryServer.
                if (-not $RegistryServer)
                {
                    $errorMessage = "RegistryServer is required when Environment and RegistryCredential is specified."
                    $exception = [System.InvalidOperationException]::New($errorMessage)
                    ThrowTerminatingError -ErrorId "RegistryServerRequired" `
                                          -ErrorMessage $errorMessage `
                                          -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                          -Exception $exception
                }
            }
        }
        elseif ($PlanName)
        {
            # Host function app in Elastic Premium or app service plan
            $servicePlan = GetServicePlan $PlanName @params

            if ($null -ne $servicePlan.Location)
            {
                $Location = $servicePlan.Location
            }

            if ($null -ne $servicePlan.Reserved)
            {
                $OSIsLinux = $servicePlan.Reserved
            }

            $functionAppDef.ServerFarmId = $servicePlan.Id
            $functionAppDef.Location = $Location
        }

        if ($OSIsLinux)
        {
            # These are the scenarios we currently support when creating a Docker container:
            # 1) In Consumption, we only support images created by Functions with a predefine runtime name and version, e.g., Python 3.7
            # 2) For App Service and Premium plans, a customer can specify a customer container image

            # Linux function app
            $functionAppDef.Kind = 'functionapp,linux'
            $functionAppDef.Reserved = $true

            # Bring your own container is only supported on App Service, Premium plans and Container App
            if ($Image)
            {
                $functionAppDef.Kind = 'functionapp,linux,container'

                $appSettings.Add((NewAppSetting -Name 'DOCKER_CUSTOM_IMAGE_NAME' -Value $Image.Trim().ToLower()))
                $appSettings.Add((NewAppSetting -Name 'FUNCTION_APP_EDIT_MODE' -Value 'readOnly'))
                $appSettings.Add((NewAppSetting -Name 'WEBSITES_ENABLE_APP_SERVICE_STORAGE' -Value 'false'))

                $siteConfig.LinuxFxVersion = FormatFxVersion -Image $Image

                # Parse the docker registry url only for the custom image parameter set (otherwise it will be a breaking change for existing customers).
                # For the container app environment, the registry url must me explicitly provided.
                if (-not $dockerRegistryServerUrl -and -not $environmentForContainerApp)
                {
                    $dockerRegistryServerUrl = ParseDockerImage -DockerImageName $Image
                }

                if ($dockerRegistryServerUrl)
                {
                    $appSettings.Add((NewAppSetting -Name 'DOCKER_REGISTRY_SERVER_URL' -Value $dockerRegistryServerUrl))

                    if ($RegistryCredential)
                    {
                        $appSettings.Add((NewAppSetting -Name 'DOCKER_REGISTRY_SERVER_USERNAME' -Value $RegistryCredential.GetNetworkCredential().UserName))
                        $appSettings.Add((NewAppSetting -Name 'DOCKER_REGISTRY_SERVER_PASSWORD' -Value $RegistryCredential.GetNetworkCredential().Password))
                    }
                }
            }
            else
            {
                if (-not $functionAppIsFlexConsumption)
                {
                    $appSettings.Add((NewAppSetting -Name 'WEBSITES_ENABLE_APP_SERVICE_STORAGE' -Value 'true'))
                }
            }
        }
        else
        {
            # Windows function app
            $functionAppDef.Kind = 'functionapp'
        }

        if ($environmentForContainerApp)
        {
            $functionAppDef.Kind = 'functionapp,linux,container,azurecontainerapps'
            $functionAppDef.Reserved = $null
            $functionAppDef.HttpsOnly = $null
            $functionAppDef.ScmSiteAlsoStopped = $null

            ValidateCpuAndMemory -ResourceCpu $ResourceCpu -ResourceMemory $ResourceMemory
            if ($ResourceCpu -and $ResourceMemory)
            {
                $functionAppDef.ResourceConfigCpu = $ResourceCpu
                $functionAppDef.ResourceConfigMemory = $ResourceMemory
            }

            if ($WorkloadProfileName)
            {
                $functionAppDef.WorkloadProfileName = $WorkloadProfileName
            }

            $siteConfig.netFrameworkVersion = $null
            $siteConfig.JavaVersion = $null
            $siteConfig.Use32BitWorkerProcess = $null
            $siteConfig.PowerShellVersion = $null
            $siteConfig.Http20Enabled = $null
            $siteConfig.LocalMySqlEnabled = $null

            if ($ScaleMinReplica)
            {
                $siteConfig.MinimumElasticInstanceCount = $ScaleMinReplica
            }

            if ($ScaleMaxReplica)
            {
                $siteConfig.FunctionAppScaleLimit = $ScaleMaxReplica
            }
            
            $managedEnvironment = GetManagedEnvironment -Environment $Environment -ResourceGroupName $ResourceGroupName
            $functionAppDef.Location = $managedEnvironment.Location
            $functionAppDef.ManagedEnvironmentId = $managedEnvironment.Id
        }

        try
        {
            if ($functionAppIsFlexConsumption)
            {
                # Reset properties not applicable for Flex Consumption
                $siteConfig.NetFrameworkVersion = $null
                $functionAppDef.Reserved = $null
                $functionAppDef.IsXenon = $null
                $appSettings.Clear()

                # Validate Flex Consumption location
                Validate-FlexConsumptionLocation -Location $FlexConsumptionLocation -ZoneRedundancy:$EnableZoneRedundancy
                $FlexConsumptionLocation = Format-FlexConsumptionLocation -Location $FlexConsumptionLocation

                # Validate runtime and runtime version
                if (-not ($FlexConsumptionSupportedRuntimes -contains $Runtime))
                {
                    $errorId = "InvalidRuntimeForFlexConsumption"
                    $message += "The specified Runtime '$Runtime' is not valid for Flex Consumption. "
                    $message += "Supported runtimes are: $($FlexConsumptionSupportedRuntimes -join ', '). Learn more about supported runtimes and versions for Flex Consumption: aka.ms/FunctionsStackUpgrade."
                    $exception = [System.InvalidOperationException]::New($message)
                    ThrowTerminatingError -ErrorId $errorId `
                                          -ErrorMessage $message `
                                          -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                          -Exception $exception
                }

                $runtimeInfo = $null
                $hasDefaultVersion = $false

                if ([string]::IsNullOrEmpty($RuntimeVersion))
                {
                    $runtimeInfo = Get-FlexFunctionAppRuntime -Location $FlexConsumptionLocation -Runtime $Runtime -DefaultOrLatest:$true
                    $hasDefaultVersion = $true

                    $RuntimeVersion = $runtimeInfo.Version
                    Write-Warning "RuntimeVersion not specified. Setting default value to '$RuntimeVersion'. $SetDefaultValueParameterWarningMessage"
                }
                else
                {
                    # Get runtime info for specified version. If not available, Get-FlexFunctionAppRuntime will error out.
                    $runtimeInfo =  Get-FlexFunctionAppRuntime -Location $FlexConsumptionLocation -Runtime $Runtime -Version $RuntimeVersion
                }

                # Validate EndOfLifeDate
                if ($runtimeInfo.EndOfLifeDate -and (-not $hasDefaultVersion))
                {
                    $defaultRuntimeInfo = Get-FlexFunctionAppRuntime -Location $FlexConsumptionLocation -Runtime $Runtime -DefaultOrLatest:$true

                    Validate-EndOfLifeDate -EndOfLifeDate $runtimeInfo.EndOfLifeDate `
                                           -Runtime $Runtime `
                                           -RuntimeVersion $RuntimeVersion `
                                           -DefaultRuntimeVersion $defaultRuntimeInfo.Version
                }

                # Validate and set AlwaysReady configuration
                if ($AlwaysReady -and $AlwaysReady.Count -gt 0)
                {
                    $ALWAYSREADY_NAME = 'name'
                    $ALWAYSREADY_INSTANCECOUNT = 'instanceCount'

                    foreach ($entry in $AlwaysReady)
                    {
                        # Ensure required keys exist
                        if (-not ($entry.ContainsKey($ALWAYSREADY_NAME) -and $entry.ContainsKey($ALWAYSREADY_INSTANCECOUNT)))
                        {
                            $errorMessage = "Each hashtable in AlwaysReady must contain '$ALWAYSREADY_NAME' and '$ALWAYSREADY_INSTANCECOUNT' keys."
                            $exception = [System.InvalidOperationException]::New($errorMessage)
                            ThrowTerminatingError -ErrorId "InvalidAlwaysReadyConfiguration" `
                                                  -ErrorMessage $errorMessage `
                                                  -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                                  -Exception $exception
                        }

                        # Validate that Name is a non-empty string
                        if ([string]::IsNullOrWhiteSpace($entry[$ALWAYSREADY_NAME]))
                        {
                            $errorMessage = "Name in AlwaysReady must be a non-empty string."
                            $exception = [System.InvalidOperationException]::New($errorMessage)
                            ThrowTerminatingError -ErrorId "InvalidAlwaysReadyName" `
                                                    -ErrorMessage $errorMessage `
                                                    -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                                    -Exception $exception
                        }

                        # Validate InstanceCount is a non-negative integer (single-parse + combined check)
                        [int]$parsedInstanceCount = 0
                        $rawInstanceCount = $entry[$ALWAYSREADY_INSTANCECOUNT]

                        if (-not ([int]::TryParse($rawInstanceCount, [ref]$parsedInstanceCount) -and $parsedInstanceCount -ge 0))
                        {
                            $errorMessage = "InstanceCount in AlwaysReady must be a non-negative integer."
                            $exception    = [System.InvalidOperationException]::new($errorMessage)
                            ThrowTerminatingError -ErrorId "InvalidAlwaysReadyInstanceCount" `
                                                  -ErrorMessage $errorMessage `
                                                  -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                                  -Exception $exception
                        }
                    }
                    $functionAppDef.ScaleAndConcurrencyAlwaysReady = $AlwaysReady
                }

                # Set scaling information
                $maximumInstanceCountValue = Validate-MaximumInstanceCount -SkuMaximumInstanceCount $runtimeInfo.Sku.maximumInstanceCount -MaximumInstanceCount $MaximumInstanceCount 
                $functionAppDef.ScaleAndConcurrencyMaximumInstanceCount = $maximumInstanceCountValue

                $instanceMemoryMBValue = Validate-InstanceMemoryMB -SkuInstanceMemoryMB $runtimeInfo.Sku.instanceMemoryMB -InstanceMemoryMB $InstanceMemoryMB
                $functionAppDef.ScaleAndConcurrencyInstanceMemoryMB = $instanceMemoryMBValue

                if ($HttpPerInstanceConcurrency -gt 0)
                {
                    $functionAppDef.HttpPerInstanceConcurrency = $HttpPerInstanceConcurrency
                }

                # Create Flex Consumption App Service Plan
                $planName = New-PlanName -ResourceGroupName $ResourceGroupName
                if ($WhatIfPreference.IsPresent)
                {
                    Write-Verbose "WhatIf: Creating Flex Consumption App Service Plan '$planName' in resource group '$ResourceGroupName' at location '$FlexConsumptionLocation'..."
                    $planInfo = New-Object PSObject -Property @{
                        Id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/$ResourceGroupName/providers/Microsoft.Web/serverfarms/$planName"
                    }
                }
                else
                {
                    $planInfo = New-FlexConsumptionAppPlan -Name $PlanName `
                                                           -ResourceGroupName $ResourceGroupName `
                                                           -Location $FlexConsumptionLocation `
                                                           -EnableZoneRedundancy:$EnableZoneRedundancy `
                                                           @params
                    $flexConsumptionPlanCreated = $true
                }

                $functionAppDef.ServerFarmId = $planInfo.Id
                $functionAppDef.Location = $FlexConsumptionLocation

                # Validate Deployment Storage
                if (-not $DeploymentStorageName) {
                    $DeploymentStorageName = $StorageAccountName
                }

                if (-not $DeploymentStorageContainerName)
                {
                    $useTestData = ($env:FunctionsTestMode -and $env:FunctionsUseFlexStackTestData)
                    # Generate a unique container name
                    $tempName = $Name -replace '[^a-zA-Z0-9]', ''
                    $normalizedName = $tempName.Substring(0, [Math]::Min(32, $tempName.Length))
                    $normalizedName = $normalizedName.ToLower()

                    if ($useTestData)
                    {
                        $randomSuffix = 0
                    }
                    else
                    {
                        $randomSuffix = Get-Random -Minimum 0 -Maximum 9999999
                    }

                    $DeploymentStorageContainerName = "app-package-$normalizedName-{0:D7}" -f $randomSuffix

                    if ($useTestData)
                    {
                        Write-Verbose "Setting DeploymentStorageContainerName to: '$DeploymentStorageContainerName'." -Verbose
                    }
                }

                $StorageAccountInfo = Get-StorageAccountInfo -Name $DeploymentStorageName @params

                # If container does not exist, create it
                $container = Az.Functions.internal\Get-AzBlobContainer -ContainerName $DeploymentStorageContainerName `
                                                                       -AccountName $DeploymentStorageName `
                                                                       -ResourceGroupName $ResourceGroupName `
                                                                       -ErrorAction SilentlyContinue `
                                                                       @params
                if (-not $container)
                {
                    if ($WhatIfPreference.IsPresent)
                    {
                        Write-Verbose "WhatIf: Creating container '$DeploymentStorageContainerName' in storage account '$DeploymentStorageName'..."
                        $container = New-Object -TypeName Microsoft.Azure.PowerShell.Cmdlets.Functions.Models.Api20190401.BlobContainer
                    }
                    else
                    {
                        # Create blob container
                        $maxNumberOfTries = 3
                        $tries = 1
                        $myError = $null
                        while ($true)
                        {
                            try
                            {
                                $container = Az.Functions.internal\New-AzBlobContainer -ContainerName $DeploymentStorageContainerName `
                                                                                       -AccountName $DeploymentStorageName `
                                                                                       -ResourceGroupName $ResourceGroupName `
                                                                                       -ContainerPropertyPublicAccess None `
                                                                                       -ErrorAction Stop `
                                                                                       @params
                                if ($container)
                                {
                                    $flexConsumptionStorageContainerCreated = $true
                                    break
                                }
                            }
                            catch
                            {
                                # Ignore the failure and continue
                                $myError = $_
                            }

                            if ($tries -ge $maxNumberOfTries)
                            {
                                break
                            }

                            # Wait for 2^(tries-1) seconds between retries. In this case, it would be 1, 2, and 4 seconds, respectively.
                            $waitInSeconds = [Math]::Pow(2, $tries - 1)
                            Start-Sleep -Seconds $waitInSeconds

                            $tries++
                        }

                        if (-not $container)
                        {
                            $errorMessage = "Failed to create blob container '$DeploymentStorageContainerName' in storage account '$DeploymentStorageName'."
                            if ($myError.Exception.Message)
                            {
                                $errorMessage += " Error details: $($myError.Exception.Message)"
                            }

                            $exception = [System.InvalidOperationException]::New($errorMessage)
                            ThrowTerminatingError -ErrorId "FailedToCreateBlobContainer" `
                                                  -ErrorMessage $errorMessage `
                                                  -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                                  -Exception $exception
                        }
                    }
                }

                # Set storage type and value
                $blobContainerUrl = "$($StorageAccountInfo.PrimaryEndpointBlob)$DeploymentStorageContainerName"
                $functionAppDef.StorageType = "blobContainer"
                $functionAppDef.StorageValue = $blobContainerUrl

                # Validate DeploymentStorageAuthType
                if (-not $DeploymentStorageAuthType)
                {
                    $DeploymentStorageAuthType = 'StorageAccountConnectionString'
                }

                $functionAppDef.AuthenticationType = $DeploymentStorageAuthType

                # Set deployment storage authentication
                if ($DeploymentStorageAuthType -eq "SystemAssignedIdentity")
                {
                    if ($DeploymentStorageAuthValue)
                    {
                        $errorMessage = "-DeploymentStorageAuthValue is only valid when -DeploymentStorageAuthType is UserAssignedIdentity or StorageAccountConnectionString."
                        $exception = [System.InvalidOperationException]::New($errorMessage)
                        ThrowTerminatingError -ErrorId $errorId `
                                            -ErrorMessage $errorMessage `
                                            -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                            -Exception $exception
                    }
                }
                elseif ($DeploymentStorageAuthType -eq "StorageAccountConnectionString")
                {
                    if (-not $DeploymentStorageAuthValue)
                    {
                        # Get connection string for deployment storage
                        $DeploymentStorageAuthValue = GetConnectionString -StorageAccountName $DeploymentStorageName @params
                    }

                    $DEPLOYMENT_STORAGE_CONNECTION_STRING = 'DEPLOYMENT_STORAGE_CONNECTION_STRING'

                    $functionAppDef.AuthenticationStorageAccountConnectionStringName = $DEPLOYMENT_STORAGE_CONNECTION_STRING
                    $appSettings.Add((NewAppSetting -Name $DEPLOYMENT_STORAGE_CONNECTION_STRING -Value $DeploymentStorageAuthValue))
                }
                elseif ($DeploymentStorageAuthType -eq "UserAssignedIdentity")
                {
                    if (-not $DeploymentStorageAuthValue)
                    {
                        $errorMessage = "IdentityID is required for UserAssigned identity"
                        $exception = [System.InvalidOperationException]::New($errorMessage)
                        ThrowTerminatingError -ErrorId "IdentityIDIsRequiredForUserAssignedIdentity" `
                                                -ErrorMessage $errorMessage `
                                                -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                                -Exception $exception
                    }

                    $identity = Resolve-UserAssignedIdentity -IdentityResourceId $DeploymentStorageAuthValue @params
                    $functionAppDef.AuthenticationUserAssignedIdentityResourceId = $identity.Id
                }

                # Set runtime information
                $functionAppDef.RuntimeName = $runtimeInfo.Sku.functionAppConfigProperties.runtime.name
                $functionAppDef.RuntimeVersion = $runtimeInfo.Sku.functionAppConfigProperties.runtime.version
            }

            # Validate storage account and get connection string
            $connectionString = GetConnectionString -StorageAccountName $StorageAccountName @params
            $appSettings.Add((NewAppSetting -Name 'AzureWebJobsStorage' -Value $connectionString))

            if (-not ($functionAppIsCustomDockerImage -or $environmentForContainerApp -or $functionAppIsFlexConsumption))
            {
                $appSettings.Add((NewAppSetting -Name 'FUNCTIONS_EXTENSION_VERSION' -Value "~$FunctionsVersion"))
            }

            # If plan is not consumption, elastic premium or a container app environment, set always on
            $planIsElasticPremium = $servicePlan.SkuTier -eq 'ElasticPremium'
            if ((-not $consumptionPlan) -and (-not $planIsElasticPremium) -and (-not $Environment) -and (-not $functionAppIsFlexConsumption))
            {
                $siteConfig.AlwaysOn = $true
            }

            # If plan is Elastic Premium or Consumption (Windows or Linux), we need these app settings
            if ($planIsElasticPremium -or $consumptionPlan)
            {
                $appSettings.Add((NewAppSetting -Name 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING' -Value $connectionString))

                $shareName = GetShareName -FunctionAppName $Name
                $appSettings.Add((NewAppSetting -Name 'WEBSITE_CONTENTSHARE' -Value $shareName))
            }

            # Set up Dashboard if no ApplicationInsights
            if ($DisableApplicationInsights -and (-not $functionAppIsFlexConsumption))
            {
                $appSettings.Add((NewAppSetting -Name 'AzureWebJobsDashboard' -Value $connectionString))
            }

            # Set up Application Insights
            if (-not $DisableApplicationInsights)
            {
                if ($ApplicationInsightsKey)
                {
                    $appSettings.Add((NewAppSetting -Name 'APPINSIGHTS_INSTRUMENTATIONKEY' -Value $ApplicationInsightsKey))
                }
                elseif ($ApplicationInsightsName)
                {
                    $appInsightsProject = GetApplicationInsightsProject -Name $ApplicationInsightsName @params
                    if (-not $appInsightsProject)
                    {
                        $errorMessage = "Failed to get application insights project name '$ApplicationInsightsName'. Please make sure the project exist."
                        $exception = [System.InvalidOperationException]::New($errorMessage)
                        ThrowTerminatingError -ErrorId "ApplicationInsightsProjectNotFound" `
                                            -ErrorMessage $errorMessage `
                                            -ErrorCategory ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                                            -Exception $exception
                    }

                    $appSettings.Add((NewAppSetting -Name 'APPLICATIONINSIGHTS_CONNECTION_STRING' -Value $appInsightsProject.ConnectionString))
                }
                else
                {
                    if ($WhatIfPreference.IsPresent)
                    {
                        Write-Verbose "WhatIf: Creating Application Insights '$Name' in resource group '$ResourceGroupName' at location '$($functionAppDef.Location)'..."
                        # Create a mock object for WhatIf to avoid null reference issues
                        $newAppInsightsProject = New-Object PSObject -Property @{
                            ConnectionString = "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://placeholder.applicationinsights.azure.com/"
                            Name = $Name
                        }
                        $appSettings.Add((NewAppSetting -Name 'APPLICATIONINSIGHTS_CONNECTION_STRING' -Value $newAppInsightsProject.ConnectionString))
                    }
                    else
                    {
                        # Create the Application Insights project
                        $newAppInsightsProject = CreateApplicationInsightsProject -ResourceGroupName $resourceGroupName `
                                                                                  -ResourceName $Name `
                                                                                  -Location $functionAppDef.Location `
                                                                                  @params
                        if ($newAppInsightsProject)
                        {
                            $appSettings.Add((NewAppSetting -Name 'APPLICATIONINSIGHTS_CONNECTION_STRING' -Value $newAppInsightsProject.ConnectionString))
                            $appInsightCreated = $true
                        }
                        else
                        {
                            $warningMessage = "Unable to create the Application Insights for the function app. Creation of Application Insights will help you monitor and diagnose your function apps in the Azure Portal. `r`n"
                            $warningMessage += "Use the 'New-AzApplicationInsights' cmdlet or the Azure Portal to create a new Application Insights project. After that, use the 'Update-AzFunctionApp' cmdlet to update Application Insights for your function app."
                            Write-Warning $warningMessage
                        }
                    }
                }
            }

            if ($Tag.Count -gt 0)
            {
                $resourceTag = NewResourceTag -Tag $Tag
                $functionAppDef.Tag = $resourceTag
            }

            # Add user app settings
            if ($AppSetting.Count -gt 0)
            {
                foreach ($keyName in $AppSetting.Keys)
                {
                    $appSettings.Add((NewAppSetting -Name $keyName -Value $AppSetting[$keyName]))
                }
            }

            # Set app settings and site configuration
            $siteConfig.AppSetting = $appSettings
            $functionAppDef.Config = $siteConfig
            $PSBoundParameters.Add("SiteEnvelope", $functionAppDef)  | Out-Null

            if ($PsCmdlet.ShouldProcess($Name, "Creating function app"))
            {
                # Save the ErrorActionPreference
                $currentErrorActionPreference = $ErrorActionPreference
                $ErrorActionPreference = 'Stop'

                $exceptionThrown = $false

                try
                {
                    Az.Functions.internal\New-AzFunctionApp @PSBoundParameters
                    $functionAppCreatedSuccessfully = $true
                }
                catch
                {
                    $exceptionThrown = $true

                    $errorMessage = GetErrorMessage -Response $_

                    if ($errorMessage)
                    {
                        $exception = [System.InvalidOperationException]::New($errorMessage)
                        ThrowTerminatingError -ErrorId "FailedToCreateFunctionApp" `
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

                if (-not $exceptionThrown)
                {
                    if ($consumptionPlan -and $OSIsLinux)
                    {
                        $message = "Your Linux function app '$Name', that uses a consumption plan has been successfully created but is not active until content is published using Azure Portal or the Functions Core Tools."
                        Write-Verbose $message -Verbose
                    }
                }
            }
        }
        finally
        {
            # Cleanup created resources in case of failure
            if (-not $functionAppCreatedSuccessfully)
            {
                if ($flexConsumptionPlanCreated)
                {
                    Az.Functions\Remove-AzFunctionAppPlan -ResourceGroupName $ResourceGroupName -Name $planName @params -Force
                }
                if ($flexConsumptionStorageContainerCreated)
                {
                    Az.Functions.internal\Remove-AzBlobContainer -ResourceGroupName $ResourceGroupName -AccountName $DeploymentStorageName -ContainerName $DeploymentStorageContainerName @params
                }

                if ($appInsightCreated -and ($null -ne $newAppInsightsProject))
                {
                    $ApplicationInsightsName = $newAppInsightsProject.Name
                    Az.Functions.internal\Remove-AzAppInsights -ResourceGroupName $ResourceGroupName -ResourceName $ApplicationInsightsName @params
                }
            }
        }
    }
}

# SIG # Begin signature block
# MIIoVQYJKoZIhvcNAQcCoIIoRjCCKEICAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCBbrg+xpx1VwgaG
# j15vRd3gncB02/BaNiINdcTm4gifAaCCDYUwggYDMIID66ADAgECAhMzAAAEhJji
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
# HAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIHEC
# OJR8v4B746BgTULnOQl2xWUtW8pCoOu9CtDhyWzfMEIGCisGAQQBgjcCAQwxNDAy
# oBSAEgBNAGkAYwByAG8AcwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20wDQYJKoZIhvcNAQEBBQAEggEAN3v9svn4XYpu2Efs+TZV5ycjo+5jNJ1IjtsT
# z7ic2w/LhR2E//bPGT7170smnx4TtmwKnTpgYbtKWWh/wqCMa2l1d6ymK5+Slo01
# +mRPRj20vw/OTEgOUPbWNbNyWsZRkd/yARguWEYON6ERsnZxJ6+XaSTl1VMe9PZ5
# NUOqZyyixAmcStGvX0fI0OurQv82MIJkIWMWpJfOXrNh0gO70W6tSxYeijjRQEOu
# 5C9oHMXrutuBcZByS42MQoFlg3iZwJNYiCxw4c3Kfxk7qwiR2ngVxVUQcC9z6sDS
# 3n85brTrzgm90i78T2Xmw7mPxaB70hj7e/+vr/1hP9+o4DRT8KGCF7AwghesBgor
# BgEEAYI3AwMBMYIXnDCCF5gGCSqGSIb3DQEHAqCCF4kwgheFAgEDMQ8wDQYJYIZI
# AWUDBAIBBQAwggFaBgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYBBAGE
# WQoDATAxMA0GCWCGSAFlAwQCAQUABCAJNlGKYLMTXABho78wCguNOsA7oXuB9QvA
# /u1IZQ8jEwIGaR33q1UyGBMyMDI1MTEyMDA2MzMwMy42NTFaMASAAgH0oIHZpIHW
# MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
# UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
# EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsT
# Hm5TaGllbGQgVFNTIEVTTjoyQTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCEf4wggcoMIIFEKADAgECAhMzAAACEKvN
# 5BYY7zmwAAEAAAIQMA0GCSqGSIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
# IFBDQSAyMDEwMB4XDTI1MDgxNDE4NDgxMloXDTI2MTExMzE4NDgxMlowgdMxCzAJ
# BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
# MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
# c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEnMCUGA1UECxMeblNoaWVs
# ZCBUU1MgRVNOOjJBMUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
# ZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
# jcc4q057ZwIgpKu4pTXWLejvYEduRf+1mIpbiJEMFWWmU2xpip+zK7xFxKGB1Ccl
# UXBU0/ZQZ6LG8H0gI7yvosrsPEI1DPB/XccGCvswKbAKckngOuGTEPGk7K/vEZa9
# h0Xt02b7m2n9MdIjkLrFl0pDriKyz0QHGpdh93X6+NApfE1TL24Vo0xkeoFGpL3r
# X9gXhIOF59EMnTd2o45FW/oxMgY9q0y0jGO0HrCLTCZr50e7TZRSNYAy2lyKbvKI
# 2MKlN1wLzJvZbbc//L3s1q3J6KhS0KC2VNEImYdFgVkJej4zZqHfScTbx9hjFgFp
# VkJl4xH5VJ8tyJdXE9+vU0k9AaT2QP1Zm3WQmXedSoLjjI7LWznuHwnoGIXLiJMQ
# zPqKqRIFL3wzcrDrZeWgtAdBPbipglZ5CQns6Baj5Mb6a/EZC9G3faJYK5QVHeE6
# eLoSEwp1dz5WurLXNPsp0VWplpl/FJb8jrRT/jOoHu85qRcdYpgByU9W7IWPdrth
# myfqeAw0omVWN5JxcogYbLo2pANJHlsMdWnxIpN5YwHbGEPCuosBHPk2Xd9+E/pZ
# PQUR6v+D85eEN5A/ZM/xiPpxa8dJZ87BpTvui7/2uflUMJf2Yc9ZLPgEdhQQo0Lw
# MDSTDT48y3sV7Pdo+g5q+MqnJztN/6qt1cgUTe9u+ykCAwEAAaOCAUkwggFFMB0G
# A1UdDgQWBBSe42+FrpdF2avbUhlk86BLSH5kejAfBgNVHSMEGDAWgBSfpxVdAF5i
# XYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
# c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENB
# JTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRw
# Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRp
# bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1Ud
# JQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsF
# AAOCAgEAvs4rO3oo8czOrxPqnnSEkUVq718QzlrIiy7/EW7JmQXsJoFxHWUF0Ux0
# PDyKFDRXPJVv29F7kpJkBJJmcQg5HQV7blUXIMWQ1qX0KdtFQXI/MRL77Z+pK5x1
# jX+tbRkA7a5Ft7vWuRoAEi02HpFH5m/Akh/dfsbx8wOpecJbYvuHuy4aG0/tGzOW
# FCxMMNhGAIJ4qdV87JnY/uMBmiodlm+Gz357XWW5tg3HrtNZXuQ0tWUv26ud4nGK
# Jo/oLZHP75p4Rpt7dMdYKUF9AuVFBwxYZYpvgk12tfK+/yOwq84/fjXVCdM83Qna
# wtbenbk/lnbc9KsZom+GnvA4itAMUpSXFWrcRkqdUQLN+JrG6fPBoV8+D8U2Q2F4
# XkiCR6EU9JzYKwTuvL6t3nFuxnkLdNjbTg2/yv2j3WaDuCK5lSPgsndIiH6Bku2U
# i3A0aUo6D9z9v+XEuBs9ioVJaOjf/z+Urqg7ESnxG0/T1dKci7vLQ2XNgWFYO+/O
# lDjtGoma1ijX4m14N9qgrXTuWEGwgC7hhBgp3id/LAOf9BSTWA5lBrilsEoexXBr
# On/1wM3rjG0hIsxvF5/YOK78mVRGY6Y7zYJ+uXt4OTOFBwadPv8MklreQZLPnQPt
# iwop4rlLUYaPCiD4YUqRNbLp8Sgyo9g0iAcZYznTuc+8Q8ZIrgwwggdxMIIFWaAD
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
# Hm5TaGllbGQgVFNTIEVTTjoyQTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUAOsyf2b6riPKn
# nXlIgIL2f53PUsKggYMwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
# aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
# cnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
# MDANBgkqhkiG9w0BAQsFAAIFAOzJHuYwIhgPMjAyNTExMjAwNTAwMjJaGA8yMDI1
# MTEyMTA1MDAyMlowdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA7Mke5gIBADAKAgEA
# AgIPSwIB/zAHAgEAAgITIjAKAgUA7MpwZgIBADA2BgorBgEEAYRZCgQCMSgwJjAM
# BgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3DQEB
# CwUAA4IBAQCx6QXS9KtgyBUGrqsHlZpRnvGeuJoaQWU/kE83pGvouFxYT7xta6yd
# W0fzgRnKJXHf9NuGQGnv9Q1+78xbpjh7zSPwiE83SWOxhLWr7GIuu5mxZykdZRvp
# 61f8+/bbvyg0AbeQV36B7QQ+91ymr4XfsuVCgJzOpieu6LAhCVhcvgGChOSC6zgc
# PT0NKJFQhPjwXNzuQrImitTMLMh+pNhJxSGkpD4iuVLuw5auPoT0nTh+oSjIBLux
# LlDOYI8ICuFlejj8u0n3eE09WJ48cUGgR5Yh4Y9rYwwuDhr6Ers9jnbVmBwWk2I1
# J76baDEb69qFhzm0lPWLap0Ofp2xNaMQMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UE
# BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
# BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
# IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAIQq83kFhjvObAAAQAAAhAwDQYJYIZI
# AWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG
# 9w0BCQQxIgQg+0Wzh0yRCAMT0OkNddHYqX8Pvoy63BWLBxCP56imsB8wgfoGCyqG
# SIb3DQEJEAIvMYHqMIHnMIHkMIG9BCDD1SHufsjzY59S1iHUQY9hnsKSrJPg5a9M
# c4YnGmPHxjCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMz
# AAACEKvN5BYY7zmwAAEAAAIQMCIEIPK3taidMd3fbjQ95Yd4N/epQ6bHHvRyLj8P
# N6MX9Zb7MA0GCSqGSIb3DQEBCwUABIICADQ+q7cK8ypeVw96Kuz2hvzyFb+QZYuo
# JMMdPzY2JjlxfUAXdQTK5lQJMsy03aMELSv6VdwBao0OQniGnvajw6snqUyS615Q
# XoHvIaMRtm678qu5MeOa6QhHIpFUyzHiRaAvwkO79D81x+XoNbbQSQdC85zUYgbV
# nwz1lg6ESlwteYYR5WgdPlsdisKn306RooxoGltXE03lKziydQiBwHfzaqb3L+53
# ZdV63FQcIiLYoTZfnSMJ3ZU6ew+BfrNjiHutkWU7Dt4CZnBKODaeqgkP31KJKLU6
# 2eOhepKnpXPY77g1J3LHyLSeCeHtrVwl7e0B8pD/G/jgM2D+Iw13ad+roAjqltDf
# RCWtmyaMVfiZz5Vhhnu2StYW8Eo2XdE5D/sGwono7atAr8GCj2+vF2gMdGjb+7Kr
# 4fsZ1Ry/EvmqsuMx2HdZteRJPhsX4ZoSGcuIydnpN1Cjsq3CgH9VlHb7axctATwB
# p6kb9dik2dcgU/Ca5tBkQKLzXndv4R2RaHZAAM3gFFYgvdP3onsaIJFwb7XgKeTW
# TEjcnA28V9igkvzff73i/JUIt1beNoG9zQu3qbkVOmOFH+btiFSe1og85Aqyss0R
# qUlLqrlJdpQ8Tf8pD72d8mmaIPAPQSHnXcsC1DjTNaTiiBy23GF6SdBUHbPl1uuo
# dR4rj+pi8KVK
# SIG # End signature block
