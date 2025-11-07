using namespace System.Net

Function Invoke-ExecStoreBeaconProducts {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Products.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Fetch all products from Searchspring API
        $BaseUrl = 'https://nhbtv0.a.searchspring.io/api/search/search.json'
        $SiteId = 'nhbtv0'
        $Domain = 'https://www.beaconlighting.com.au'
        $ResultsPerPage = 100
        $ResultsFormat = 'native'
        $AllProducts = [System.Collections.Generic.List[object]]::new()
        $CurrentPage = 1
        $TotalPages = 1
        $TotalResults = 0
        do {
            $ApiUrl = "$BaseUrl`?siteId=$SiteId&domain=$Domain&resultsPerPage=$ResultsPerPage&page=$CurrentPage&resultsFormat=$ResultsFormat"
            $Response = Invoke-RestMethod -Uri $ApiUrl -Method Get -ContentType 'application/json'
            if ($CurrentPage -eq 1) {
                $TotalResults = $Response.pagination.totalResults
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
        Remove-AzDataTable @Table

        # Store each product as a separate entity in Products table
        foreach ($Product in $AllProducts) {
            $Product = $Product | ConvertTo-Json -Depth 10 -Compress
            $entity = @{
                PartitionKey = 'Products'
                RowKey       = [guid]::NewGuid().ToString()
                ProductJson  = [string]$Product
            }
            Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $entity -Force -CreateTableIfNotExists
        }

        $StatusCode = [HttpStatusCode]::Created
        $Body = [PSCustomObject]@{
            Success = $true
            Message = "All products stored successfully"
            Count   = $AllProducts.Count
        }
    } catch {
        $ErrorMessage = $_.Exception.Message
        $StatusCode = [HttpStatusCode]::BadRequest
        $Body = [PSCustomObject]@{
            Success = $false
            Message = "Failed to store products"
            Error   = $ErrorMessage
        }
    }
    return ([HttpResponseContext]@{
        StatusCode = $StatusCode
        Body       = $Body
    })
}
