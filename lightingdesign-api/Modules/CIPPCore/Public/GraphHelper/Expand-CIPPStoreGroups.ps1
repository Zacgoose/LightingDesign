function Expand-CIPPStoreGroups {
    <#
    .FUNCTIONALITY
    Internal
    .SYNOPSIS
        Expand store groups to individual stores
    .PARAMETER StoreFilter
        Array of store filters which can contain store IDs or group objects
    #>
    param(
        [Parameter(Mandatory = $true)]
        [array]$StoreFilter
    )

    $Stores = Get-Stores -IncludeAll
    $ExpandedStores = [System.Collections.Generic.List[object]]::new()

    foreach ($Item in $StoreFilter) {
        if ($Item -is [PSCustomObject] -and $Item.type -eq 'Group') {
            # This is a group, expand it
            $Group = Get-StoreGroups -GroupId $Item.value
            
            if ($Group -and $Group.members) {
                foreach ($MemberId in $Group.members) {
                    $Store = $Stores | Where-Object { $_.storeId -eq $MemberId }
                    if ($Store) {
                        $ExpandedStores.Add($Store)
                    }
                }
            }
        } elseif ($Item -eq 'AllStores') {
            # Return all stores
            return $Stores
        } else {
            # This is a store ID
            $Store = $Stores | Where-Object { $_.storeId -eq $Item }
            if ($Store) {
                $ExpandedStores.Add($Store)
            }
        }
    }

    return $ExpandedStores
}
