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
    $Row = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter
    
    if (-not $Row) {
        Write-LogMessage -API 'GetCustomer' -message "Customer not found: CustomerId: $CustomerId" -Sev 'Warning' -headers $Request.Headers
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Customer not found' }
        }
    }

    Write-LogMessage -API 'GetCustomer' -message "Retrieved customer: CustomerId: $CustomerId, CustomerName: $($Row.CustomerName)" -Sev 'Info' -headers $Request.Headers
    
    # Parse JSON fields - return simple values, let frontend handle autocomplete formatting
    $RelatedBuilders = if ($Row.RelatedBuilders) {
        try { $Row.RelatedBuilders | ConvertFrom-Json } catch { @() }
    } else { @() }

    $TradeAssociations = if ($Row.TradeAssociations) {
        try { $Row.TradeAssociations | ConvertFrom-Json } catch { @() }
    } else { @() }

    $ReturnedCustomer = [PSCustomObject]@{
        id                = $Row.RowKey
        customerName      = $Row.CustomerName
        email             = $Row.Email
        phone             = $Row.Phone
        address           = $Row.Address
        city              = $Row.City
        state             = $Row.State
        postalCode        = $Row.PostalCode
        status            = $Row.Status
        notes             = $Row.Notes
        customerType      = $Row.CustomerType
        relatedBuilders   = $RelatedBuilders
        tradeAssociations = $TradeAssociations
        createdDate       = $Row.Timestamp
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = $ReturnedCustomer
    }
}
