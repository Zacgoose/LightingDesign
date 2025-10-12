function Invoke-ExecGetCustomer {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Customers.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Customers'
    
    $CustomerId = $Request.Query.customerId
    
    if (-not $CustomerId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'customerId parameter is required' }
        }
    }

    # Lookup a single customer by RowKey
    $Filter = "RowKey eq '{0}'" -f $CustomerId
    $Row = Get-AzDataTableEntity @Table -Filter $Filter
    
    if ($Row) {
        $ReturnedCustomer = [PSCustomObject]@{
            id             = $Row.RowKey
            customerName   = $Row.CustomerName
            email          = $Row.Email
            phone          = $Row.Phone
            address        = $Row.Address
            city           = $Row.City
            state          = $Row.State
            postalCode     = $Row.PostalCode
            status         = if ($Row.Status) { @{ value = $Row.Status; label = (Get-Culture).TextInfo.ToTitleCase($Row.Status) } } else { $null }
            notes          = $Row.Notes
            customerType   = $Row.CustomerType
            relatedBuilders = if ($Row.RelatedBuilders) { $Row.RelatedBuilders | ConvertFrom-Json } else { @() }
            tradeAssociations = if ($Row.TradeAssociations) { $Row.TradeAssociations | ConvertFrom-Json } else { @() }
            createdDate    = $Row.Timestamp
        }
    } else {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Customer not found' }
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = $ReturnedCustomer
    }
}
