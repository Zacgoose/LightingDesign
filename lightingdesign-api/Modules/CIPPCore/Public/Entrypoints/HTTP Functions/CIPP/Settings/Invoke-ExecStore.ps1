function Invoke-ExecStore {
    <#
    .SYNOPSIS
        Exec endpoint for managing stores
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Stores'
    $Action = $Request.Query.Action ?? $Request.Body.Action

    switch ($Action) {
        'AddEdit' {
            try {
                $StoreId = if ($Request.Body.storeId) { $Request.Body.storeId } else { [guid]::NewGuid().ToString() }
                
                $Store = @{
                    'PartitionKey' = 'Stores'
                    'RowKey'       = $StoreId
                    'storeId'      = $StoreId
                    'storeName'    = $Request.Body.storeName
                    'storeCode'    = $Request.Body.storeCode
                    'location'     = $Request.Body.location ?? ''
                    'status'       = $Request.Body.status ?? 'active'
                    'Excluded'     = $false
                }
                
                Add-CIPPAzDataTableEntity @Table -Entity $Store -Force | Out-Null
                $Body = @{Results = "Store '$($Request.Body.storeName)' saved successfully" }
                Write-LogMessage -headers $Request.Headers -API 'ExecStore' -message "Saved store $($Request.Body.storeName)" -Sev 'Info'
            } catch {
                Write-Warning "Failed to save store $($Request.Body.storeName): $($_.Exception.Message)"
                Write-Warning $_.InvocationInfo.PositionMessage
                $Body = @{Results = "Failed to save store $($Request.Body.storeName)" }
            }
        }
        'Delete' {
            try {
                Write-Information "Deleting store $($Request.Body.storeId)"
                $Store = Get-CIPPAzDataTableEntity @Table -Filter "RowKey eq '$($Request.Body.storeId)'" -Property RowKey, PartitionKey
                Remove-AzDataTableEntity -Force @Table -Entity $Store
                $Body = @{Results = 'Store deleted successfully' }
                Write-LogMessage -headers $Request.Headers -API 'ExecStore' -message "Deleted store $($Request.Body.storeId)" -Sev 'Info'
            } catch {
                Write-Warning "Failed to delete store: $($_.Exception.Message)"
                $Body = @{Results = "Failed to delete store" }
            }
        }
        default {
            $Body = Get-CIPPAzDataTableEntity @Table
            if (!$Body) {
                $Body = @(
                    @{
                        RowKey = 'No stores found'
                    }
                )
            }
        }
    }

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
