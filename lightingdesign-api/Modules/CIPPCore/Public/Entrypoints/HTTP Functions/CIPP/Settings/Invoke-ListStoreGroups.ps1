function Invoke-ListStoreGroups {
    <#
    .SYNOPSIS
        Entrypoint for listing store groups
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $groupFilter = $Request.Query.groupId ?? $Request.Body.groupId
    $StoreGroups = (Get-StoreGroups -GroupId $groupFilter) ?? @()
    $Body = $StoreGroups

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
