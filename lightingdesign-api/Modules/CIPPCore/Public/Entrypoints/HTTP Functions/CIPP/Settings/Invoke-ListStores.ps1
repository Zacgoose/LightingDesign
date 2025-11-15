function Invoke-ListStores {
    <#
    .SYNOPSIS
        Entrypoint for listing stores
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $AllStoreSelector = $Request.Query.AllStoreSelector
    $Stores = Get-Stores -IncludeAll

    if ($AllStoreSelector) {
        $Stores = @([PSCustomObject]@{
                storeId   = 'AllStores'
                storeName = 'All Stores (*)'
                storeCode = 'AllStores'
            }) + $Stores
    }

    $Body = $Stores

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
