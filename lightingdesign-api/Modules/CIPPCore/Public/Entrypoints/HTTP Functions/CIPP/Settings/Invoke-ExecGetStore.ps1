function Invoke-ExecGetStore {
    <#
    .SYNOPSIS
        Get a single store by ID
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $StoreId = $Request.Query.storeId ?? $Request.Body.storeId
    
    if (!$StoreId) {
        return ([HttpResponseContext]@{
                StatusCode = [HttpStatusCode]::BadRequest
                Body       = @{ error = 'storeId parameter is required' }
            })
    }

    $Table = Get-CippTable -tablename 'Stores'
    $Filter = "RowKey eq '$StoreId'"
    
    try {
        $Store = Get-CIPPAzDataTableEntity @Table -Filter $Filter
        
        if ($Store) {
            $Body = $Store
        } else {
            $Body = @{ error = 'Store not found' }
        }
    } catch {
        Write-Warning "Failed to get store: $($_.Exception.Message)"
        $Body = @{ error = "Failed to get store: $($_.Exception.Message)" }
    }

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
