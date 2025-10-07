function Invoke-ExecAPIPermissionList {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.SuperAdmin.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Roles = Get-CIPPHttpFunctions -ByRoleGroup | ConvertTo-Json -Depth 10

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Roles
        })
}
