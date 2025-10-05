using namespace System.Net

Function Invoke-ExecGetBeaconProducts {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        Lighting.Designer.Products.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Base API configuration
        $BaseUrl = 'https://nhbtv0.a.searchspring.io/api/search/search.json'
        $SiteId = 'nhbtv0'
        $Domain = 'https://www.beaconlighting.com.au'
        $ResultsPerPage = 100
        $ResultsFormat = 'native'

        # Initialize variables for pagination
        $AllProducts = [System.Collections.Generic.List[object]]::new()
        $CurrentPage = 1
        $TotalPages = 1
        $TotalResults = 0

        Write-Host "Starting product fetch from Searchspring API..."

        # Pagination loop
        do {
            # Build the API URL for current page
            $ApiUrl = "$BaseUrl`?siteId=$SiteId&domain=$Domain&resultsPerPage=$ResultsPerPage&page=$CurrentPage&resultsFormat=$ResultsFormat"

            Write-Host "Fetching page $CurrentPage of $TotalPages..."

            # Make the API call
            $Response = Invoke-RestMethod -Uri $ApiUrl -Method Get -ContentType 'application/json'

            # On first page, determine total pages
            if ($CurrentPage -eq 1) {
                $TotalResults = $Response.pagination.totalResults
                $TotalPages = $Response.pagination.totalPages

                Write-Host "Total products to fetch: $TotalResults across $TotalPages pages"
            }

            # Add products from current page to collection
            if ($Response.results) {
                foreach ($Product in $Response.results) {
                    $AllProducts.Add($Product)
                }
            }

            Write-Host "Fetched $($Response.results.Count) products from page $CurrentPage. Total so far: $($AllProducts.Count)"

            # Move to next page
            $CurrentPage++

        } while ($CurrentPage -le $TotalPages)

        # Structure the final response
        $Body = @($AllProducts)

        $StatusCode = [HttpStatusCode]::OK

        Write-Host "Successfully fetched $($AllProducts.Count) products"

    } catch {
        $ErrorMessage = $_.Exception.Message
        $StatusCode = [HttpStatusCode]::BadRequest

        Write-Warning "Error in ExecGetBeaconProducts: $ErrorMessage"
        Write-Information $_.InvocationInfo.PositionMessage

        $Body = [PSCustomObject]@{
            Success = $false
            Message = "Failed to fetch products"
            Error   = $ErrorMessage
            Results = @()
        }
    }

    # Return the HTTP response
    return ([HttpResponseContext]@{
            StatusCode = $StatusCode
            Body       = $Body
        })
}
