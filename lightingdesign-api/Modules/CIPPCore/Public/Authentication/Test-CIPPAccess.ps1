function Get-CIPPUserStores {
    param(
        $CustomRoles,
        $BaseRole
    )

    # Base roles (admin, superadmin, lightingdesigner) have access to all stores
    if (@('admin', 'superadmin', 'lightingdesigner') -contains $BaseRole.Name) {
        return @('AllStores')
    }

    # No custom roles = all stores
    if (($CustomRoles | Measure-Object).Count -eq 0) {
        return @('AllStores')
    }

    $Stores = Get-Stores -IncludeErrors
    $PermissionsFound = $false
    $PermissionSet = foreach ($CustomRole in $CustomRoles) {
        try {
            Get-CIPPRolePermissions -Role $CustomRole
            $PermissionsFound = $true
        } catch {
            Write-Information $_.Exception.Message
            continue
        }
    }

    if (!$PermissionsFound) {
        return @('AllStores')
    }

    # Build list of allowed stores from all roles
    $LimitedStoreList = foreach ($Permission in $PermissionSet) {
        if ((($Permission.AllowedStores | Measure-Object).Count -eq 0 -or $Permission.AllowedStores -contains 'AllStores') -and (($Permission.BlockedStores | Measure-Object).Count -eq 0)) {
            @('AllStores')
        } else {
            # Expand store groups to individual store IDs
            $ExpandedAllowedStores = foreach ($AllowedItem in $Permission.AllowedStores) {
                if ($AllowedItem -is [PSCustomObject] -and $AllowedItem.type -eq 'Group') {
                    try {
                        $GroupMembers = Expand-CIPPStoreGroups -StoreFilter @($AllowedItem)
                        $GroupMembers | ForEach-Object { $_.storeId }
                    } catch {
                        Write-Warning "Failed to expand store group '$($AllowedItem.label)': $($_.Exception.Message)"
                        @()
                    }
                } else {
                    $AllowedItem
                }
            }

            $ExpandedBlockedStores = foreach ($BlockedItem in $Permission.BlockedStores) {
                if ($BlockedItem -is [PSCustomObject] -and $BlockedItem.type -eq 'Group') {
                    try {
                        $GroupMembers = Expand-CIPPStoreGroups -StoreFilter @($BlockedItem)
                        $GroupMembers | ForEach-Object { $_.storeId }
                    } catch {
                        Write-Warning "Failed to expand blocked store group '$($BlockedItem.label)': $($_.Exception.Message)"
                        @()
                    }
                } else {
                    $BlockedItem
                }
            }

            if ($ExpandedAllowedStores -contains 'AllStores') {
                $ExpandedAllowedStores = $Stores.storeId
            }
            $ExpandedAllowedStores | Where-Object { $ExpandedBlockedStores -notcontains $_ }
        }
    }

    return $LimitedStoreList
}

function Test-CIPPAccess {
    param(
        $Request,
        [switch]$StoreList,
        [string]$StoreId
    )
    if ($Request.Params.CIPPEndpoint -eq 'ExecSAMSetup') { return $true }

    # Get function help
    $FunctionName = 'Invoke-{0}' -f $Request.Params.CIPPEndpoint

    if ($FunctionName -ne 'Invoke-me') {
        try {
            $Help = Get-Help $FunctionName -ErrorAction Stop
        } catch {
            Write-Warning "Function '$FunctionName' not found"
        }
    }

    # Check help for role
    $APIRole = $Help.Role

    # Get default roles from config
    $CIPPCoreModuleRoot = Get-Module -Name CIPPCore | Select-Object -ExpandProperty ModuleBase
    $CIPPRoot = (Get-Item $CIPPCoreModuleRoot).Parent.Parent
    $BaseRoles = Get-Content -Path $CIPPRoot\Config\cipp-roles.json | ConvertFrom-Json
    $DefaultRoles = @('superadmin', 'admin', 'editor', 'readonly', 'anonymous', 'authenticated', 'lightingdesigner')

    if ($APIRole -eq 'Public') {
        return $true
    }

    if ($Request.Headers.'x-ms-client-principal-idp' -eq 'aad' -and $Request.Headers.'x-ms-client-principal-name' -match '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
        $Type = 'APIClient'
        # Direct API Access
        $ForwardedFor = $Request.Headers.'x-forwarded-for' -split ',' | Select-Object -First 1
        $IPRegex = '^(?<IP>(?:\d{1,3}(?:\.\d{1,3}){3}|\[[0-9a-fA-F:]+\]|[0-9a-fA-F:]+))(?::\d+)?$'
        $IPAddress = $ForwardedFor -replace $IPRegex, '$1' -replace '[\[\]]', ''

        $Client = Get-CippApiClient -AppId $Request.Headers.'x-ms-client-principal-name'
        if ($Client) {
            Write-Information "API Access: AppName=$($Client.AppName), AppId=$($Request.Headers.'x-ms-client-principal-name'), IP=$IPAddress"
            $IPMatched = $false
            if ($Client.IPRange -notcontains 'Any') {
                foreach ($Range in $Client.IPRange) {
                    if ($IPaddress -eq $Range -or (Test-IpInRange -IPAddress $IPAddress -Range $Range)) {
                        $IPMatched = $true
                        break
                    }
                }
            } else {
                $IPMatched = $true
            }

            if ($IPMatched) {
                if ($Client.Role) {
                    $CustomRoles = $Client.Role | ForEach-Object {
                        if ($DefaultRoles -notcontains $_) {
                            $_
                        }
                    }
                    $BaseRole = $null
                    foreach ($Role in $BaseRoles.PSObject.Properties) {
                        foreach ($ClientRole in $Client.Role) {
                            if ($Role.Name -eq $ClientRole) {
                                $BaseRole = $Role
                                break
                            }
                        }
                    }
                } else {
                    $CustomRoles = @('cipp-api')
                }
            } else {
                throw 'Access to this CIPP API endpoint is not allowed, the API Client does not have the required permission'
            }
        } else {
            $CustomRoles = @('cipp-api')
            Write-Information "API Access: AppId=$($Request.Headers.'x-ms-client-principal-name'), IP=$IPAddress"
        }
        if ($Request.Params.CIPPEndpoint -eq 'me') {
            $Permissions = Get-CippAllowedPermissions -UserRoles $CustomRoles
            return ([HttpResponseContext]@{
                    StatusCode = [HttpStatusCode]::OK
                    Body       = (
                        @{
                            'clientPrincipal' = @{
                                appId   = $Request.Headers.'x-ms-client-principal-name'
                                appRole = $CustomRoles
                            }
                            'permissions'     = $Permissions
                        } | ConvertTo-Json -Depth 5)
                })
        }

    } else {
        $Type = 'User'
        $User = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($Request.Headers.'x-ms-client-principal')) | ConvertFrom-Json

        # Check for roles granted via group membership
        if (($User.userRoles | Measure-Object).Count -eq 2 -and $User.userRoles -contains 'authenticated' -and $User.userRoles -contains 'anonymous') {
            $User = Test-CIPPAccessUserRole -User $User
        }

        # Return user permissions
        if ($Request.Params.CIPPEndpoint -eq 'me') {

            if (!$User.userRoles) {
                return ([HttpResponseContext]@{
                        StatusCode = [HttpStatusCode]::OK
                        Body       = (
                            @{
                                'clientPrincipal' = $null
                                'permissions'     = @()
                            } | ConvertTo-Json -Depth 5)
                    })
            }

            $Permissions = Get-CippAllowedPermissions -UserRoles $User.userRoles
            return ([HttpResponseContext]@{
                    StatusCode = [HttpStatusCode]::OK
                    Body       = (
                        @{
                            'clientPrincipal' = $User
                            'permissions'     = $Permissions
                        } | ConvertTo-Json -Depth 5)
                })
        }

        $CustomRoles = $User.userRoles | ForEach-Object {
            if ($DefaultRoles -notcontains $_) {
                $_
            }
        }

        $BaseRole = $null

        if ($User.userRoles -contains 'superadmin') {
            $User.userRoles = @('superadmin')
        } elseif ($User.userRoles -contains 'lightingdesigner') {
            $User.userRoles = @('lightingdesigner')
        } elseif ($User.userRoles -contains 'admin') {
            $User.userRoles = @('admin')
        }
        foreach ($Role in $BaseRoles.PSObject.Properties) {
            foreach ($UserRole in $User.userRoles) {
                if ($Role.Name -eq $UserRole) {
                    $BaseRole = $Role
                    break
                }
            }
        }
    }

    # If StoreId parameter provided, validate store access early
    if ($StoreId) {
        $AllowedStores = Get-CIPPUserStores -CustomRoles $CustomRoles -BaseRole $BaseRole

        if ($AllowedStores -notcontains 'AllStores' -and $AllowedStores -notcontains $StoreId) {
            $EndpointName = $Request.Params.CIPPEndpoint
            Write-LogMessage -API $EndpointName -message "Access denied: User attempted to access resource from unauthorized store $StoreId" -Sev 'Warn' -headers $Request.Headers
            throw "Access to this store is not allowed"
        }

        return $true
    }

    # Check base role permissions before continuing to custom roles
    if ($null -ne $BaseRole) {
        Write-Information "Base Role: $($BaseRole.Name)"
        $BaseRoleAllowed = $false
        foreach ($Include in $BaseRole.Value.include) {
            if ($APIRole -like $Include) {
                $BaseRoleAllowed = $true
                break
            }
        }
        foreach ($Exclude in $BaseRole.Value.exclude) {
            if ($APIRole -like $Exclude) {
                $BaseRoleAllowed = $false
                break
            }
        }
        if (!$BaseRoleAllowed) {
            throw "Access to this CIPP API endpoint is not allowed, the '$($BaseRole.Name)' base role does not have the required permission: $APIRole"
        }
    }

    # Check custom role permissions for limitations on api calls or stores
    if ($null -eq $BaseRole.Name -and $Type -eq 'User' -and ($CustomRoles | Measure-Object).Count -eq 0) {
        Write-Information $BaseRole.Name
        throw 'Access to this CIPP API endpoint is not allowed, the user does not have the required permission'
    } elseif (($CustomRoles | Measure-Object).Count -gt 0) {
        if (@('admin', 'superadmin', 'lightingdesigner') -contains $BaseRole.Name) {
            if ($StoreList.IsPresent) {
                return @('AllStores')
            }
            return $true
        } else {
            $Stores = Get-Stores -IncludeErrors
            $PermissionsFound = $false
            $PermissionSet = foreach ($CustomRole in $CustomRoles) {
                try {
                    Get-CIPPRolePermissions -Role $CustomRole
                    $PermissionsFound = $true
                } catch {
                    Write-Information $_.Exception.Message
                    continue
                }
            }

            if ($PermissionsFound) {
                # Handle -StoreList request
                if ($StoreList.IsPresent) {
                    return Get-CIPPUserStores -CustomRoles $CustomRoles -BaseRole $BaseRole
                }

                $StoreAllowed = $false
                $APIAllowed = $false
                foreach ($Role in $PermissionSet) {
                    foreach ($Perm in $Role.Permissions) {
                        if ($Perm -match $APIRole) {
                            if ($Role.BlockedEndpoints -contains $Request.Params.CIPPEndpoint) {
                                throw "Access to this CIPP API endpoint is not allowed, the custom role '$($Role.Role)' has blocked this endpoint: $($Request.Params.CIPPEndpoint)"
                            }
                            $APIAllowed = $true
                            break
                        }
                    }

                    if ($APIAllowed) {
                        $StoreFilter = $Request.Query.storeFilter ?? $Request.Body.storeFilter ?? $Request.Body.storeFilter.value ?? $Request.Query.storeId ?? $Request.Body.storeId ?? $Request.Body.storeId.value
                        # Check store level access
                        if (($Role.BlockedStores | Measure-Object).Count -eq 0 -and $Role.AllowedStores -contains 'AllStores') {
                            $StoreAllowed = $true
                        } elseif ($StoreFilter -eq 'AllStores') {
                            $StoreAllowed = $false
                        } else {
                            $Store = ($Stores | Where-Object { $StoreFilter -eq $_.storeId -or $StoreFilter -eq $_.storeCode }).storeId

                            # Expand allowed store groups to individual store IDs
                            $ExpandedAllowedStores = foreach ($AllowedItem in $Role.AllowedStores) {
                                if ($AllowedItem -is [PSCustomObject] -and $AllowedItem.type -eq 'Group') {
                                    try {
                                        $GroupMembers = Expand-CIPPStoreGroups -StoreFilter @($AllowedItem)
                                        $GroupMembers | ForEach-Object { $_.storeId }
                                    } catch {
                                        Write-Warning "Failed to expand allowed store group '$($AllowedItem.label)': $($_.Exception.Message)"
                                        @()
                                    }
                                } else {
                                    $AllowedItem
                                }
                            }

                            # Expand blocked store groups to individual store IDs
                            $ExpandedBlockedStores = foreach ($BlockedItem in $Role.BlockedStores) {
                                if ($BlockedItem -is [PSCustomObject] -and $BlockedItem.type -eq 'Group') {
                                    try {
                                        $GroupMembers = Expand-CIPPStoreGroups -StoreFilter @($BlockedItem)
                                        $GroupMembers | ForEach-Object { $_.storeId }
                                    } catch {
                                        Write-Warning "Failed to expand blocked store group '$($BlockedItem.label)': $($_.Exception.Message)"
                                        @()
                                    }
                                } else {
                                    $BlockedItem
                                }
                            }

                            if ($ExpandedAllowedStores -contains 'AllStores') {
                                $AllowedStores = $Stores.storeId
                            } else {
                                $AllowedStores = $ExpandedAllowedStores
                            }

                            if ($Store) {
                                $StoreAllowed = $AllowedStores -contains $Store -and $ExpandedBlockedStores -notcontains $Store
                                if (!$StoreAllowed) { continue }
                                break
                            } else {
                                $StoreAllowed = $true
                                break
                            }
                        }
                    }
                }

                if (!$APIAllowed) {
                    throw "Access to this CIPP API endpoint is not allowed, you do not have the required permission: $APIRole"
                }
                if (!$StoreAllowed -and $Help.Functionality -notmatch 'AnyStore') {
                    throw 'Access to this store is not allowed'
                } else {
                    return $true
                }
            } else {
                # No permissions found for any roles
                if ($StoreList.IsPresent) {
                    return @('AllStores')
                }
                return $true
            }
        }
    }

    if ($StoreList.IsPresent) {
        return @('AllStores')
    }
    return $true
}
