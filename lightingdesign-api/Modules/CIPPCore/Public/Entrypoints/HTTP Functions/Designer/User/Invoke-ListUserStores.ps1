function Invoke-ListUserStores {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.User.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Get user's allowed stores based on their role and permissions
        $AllowedStores = Test-CIPPAccess -Request $Request -StoreList
        
        if ($AllowedStores -contains 'AllStores') {
            # User has access to all stores, retrieve full list
            $Stores = Get-Stores
        } else {
            # User has limited store access, filter stores
            $AllStores = Get-Stores
            $Stores = $AllStores | Where-Object { $AllowedStores -contains $_.storeId }
        }

        # Format store information for the frontend
        $FormattedStores = $Stores | ForEach-Object {
            [PSCustomObject]@{
                storeId      = $_.storeId
                storeName    = $_.storeName
                storeCode    = $_.storeCode
                location     = $_.location
                city         = $_.city
                state        = $_.state
                region       = $_.region
            }
        }

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @($FormattedStores)
        }
    }
    catch {
        Write-LogMessage -API 'ListUserStores' -message "Failed to get user stores: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{ error = "Failed to get user stores: $($_.Exception.Message)" }
        }
    }
}
