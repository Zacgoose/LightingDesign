
function Invoke-ExecStoreBeaconProducts {
    <#
    .SYNOPSIS
        Fetches all products from the Searchspring API and stores them in the Products Azure Table.
    .DESCRIPTION
        Retrieves all products from the Beacon Lighting Searchspring API, clears the Products table, and stores each product as a separate entity using Add-CIPPAzDataTableEntity.
        This function is reusable and does not require parameters.
    #>
    [CmdletBinding()]
    param()

    # Fetch all products from Searchspring API
    $BaseUrl = 'https://nhbtv0.a.searchspring.io/api/search/search.json'
    $SiteId = 'nhbtv0'
    $Domain = 'https://www.beaconlighting.com.au'
    $ResultsPerPage = 100
    $ResultsFormat = 'native'
    $AllProducts = [System.Collections.Generic.List[object]]::new()
    $CurrentPage = 1
    $TotalPages = 1

    do {
        $ApiUrl = "$BaseUrl`?siteId=$SiteId&domain=$Domain&resultsPerPage=$ResultsPerPage&page=$CurrentPage&resultsFormat=$ResultsFormat"
        $Response = Invoke-RestMethod -Uri $ApiUrl -Method Get -ContentType 'application/json'
        if ($CurrentPage -eq 1) {
            $TotalPages = $Response.pagination.totalPages
        }
        if ($Response.results) {
            foreach ($Product in $Response.results) {
                $AllProducts.Add($Product)
            }
        }
        $CurrentPage++
    } while ($CurrentPage -le $TotalPages)

    $Table = Get-CIPPTable -TableName 'Products'

    # Remove all existing products from Products table
    Clear-AzDataTable @Table

    # Store each product as a separate entity in Products table
    foreach ($Product in $AllProducts) {
        $ProductJson = $Product | ConvertTo-Json -Depth 10 -Compress
        $entity = @{
            PartitionKey = 'Products'
            RowKey       = [guid]::NewGuid().ToString()
            ProductJson  = [string]$ProductJson
        }
        Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $entity -Force -CreateTableIfNotExists
    }

    Write-Host ("Stored {0} products in Products table." -f $AllProducts.Count)
}
