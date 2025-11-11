function Get-Stores {
    <#
    .FUNCTIONALITY
    Internal
    #>
    param (
        [Parameter( ParameterSetName = 'Skip', Mandatory = $True )]
        [switch]$SkipList,
        [Parameter( ParameterSetName = 'Standard')]
        [switch]$IncludeAll,
        [switch]$IncludeErrors,
        [switch]$TriggerRefresh,
        [switch]$CleanOld,
        [string]$StoreFilter
    )

    $StoresTable = Get-CippTable -tablename 'Stores'
    $ExcludedFilter = "PartitionKey eq 'Stores' and Excluded eq true"

    $SkipListCache = Get-CIPPAzDataTableEntity @StoresTable -Filter $ExcludedFilter
    if ($SkipList) {
        return $SkipListCache
    }

    if ($IncludeAll.IsPresent) {
        $Filter = "PartitionKey eq 'Stores'"
    } elseif ($IncludeErrors.IsPresent) {
        $Filter = "PartitionKey eq 'Stores' and Excluded eq false"
    } else {
        $Filter = "PartitionKey eq 'Stores' and Excluded eq false"
    }

    if ($StoreFilter) {
        if ($StoreFilter -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') {
            $Filter = "{0} and storeId eq '{1}'" -f $Filter, $StoreFilter
            $IncludedStoreFilter = [scriptblock]::Create("`$_.storeId -eq '$StoreFilter'")
        } else {
            $Filter = "{0} and (storeName eq '{1}' or storeCode eq '{1}')" -f $Filter, $StoreFilter
            $IncludedStoreFilter = [scriptblock]::Create("`$_.storeName -eq '$StoreFilter' -or `$_.storeCode -eq '$StoreFilter'")
        }
    } else {
        $IncludedStoreFilter = [scriptblock]::Create('$true')
    }

    $IncludedStoresCache = Get-CIPPAzDataTableEntity @StoresTable -Filter $Filter

    if (($IncludedStoresCache | Measure-Object).Count -eq 0) {
        # Initialize with a default store list if needed
        # For now, return empty array - stores will be managed separately
        $IncludedStoresCache = @()
    }

    return $IncludedStoresCache | Where-Object $IncludedStoreFilter | Sort-Object -Property storeName
}
