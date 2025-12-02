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

    # Normalize the store objects to ensure consistent property names and remove Azure Table metadata
    $NormalizedStores = @($Stores | ForEach-Object {
        [PSCustomObject]@{
            storeId   = $_.storeId
            storeName = $_.storeName
            storeCode = $_.storeCode
            location  = if ([string]::IsNullOrEmpty($_.location)) { $null } else { $_.location }
        }
    })

    if ($AllStoreSelector) {
        $NormalizedStores = @([PSCustomObject]@{
                storeId   = 'AllStores'
                storeName = 'All Stores (*)'
                storeCode = 'AllStores'
                location  = $null
            }) + $NormalizedStores
    }

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = @($NormalizedStores) | ConvertTo-Json -Depth 10 -AsArray
        })
}
