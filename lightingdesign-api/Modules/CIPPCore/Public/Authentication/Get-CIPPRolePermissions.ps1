function Get-CIPPRolePermissions {
    <#
    .SYNOPSIS
        Get the permissions associated with a role.
    .PARAMETER RoleName
        The role to get the permissions for.
    .EXAMPLE
        Get-CIPPRolePermissions -RoleName 'mycustomrole'
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$RoleName
    )

    $Table = Get-CippTable -tablename 'CustomRoles'
    $Filter = "RowKey eq '$RoleName'"
    $Role = Get-CIPPAzDataTableEntity @Table -Filter $Filter
    if ($Role) {
        $Permissions = $Role.Permissions | ConvertFrom-Json
        $AllowedStores = if ($Role.AllowedStores) { $Role.AllowedStores | ConvertFrom-Json } else { @() }
        $BlockedStores = if ($Role.BlockedStores) { $Role.BlockedStores | ConvertFrom-Json } else { @() }
        $BlockedEndpoints = if ($Role.BlockedEndpoints) { $Role.BlockedEndpoints | ConvertFrom-Json } else { @() }
        [PSCustomObject]@{
            Role             = $Role.RowKey
            Permissions      = $Permissions.PSObject.Properties.Value
            AllowedStores    = @($AllowedStores)
            BlockedStores    = @($BlockedStores)
            BlockedEndpoints = @($BlockedEndpoints)
        }
    } else {
        throw "Role $RoleName not found."
    }
}
