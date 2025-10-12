function Invoke-ExecEditCustomer {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Customers.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Customers'
    
    $CustomerId = $Request.Body.customerId
    
    if (-not $CustomerId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'customerId is required' }
        }
    }

    # Get existing customer
    $Filter = "RowKey eq '{0}'" -f $CustomerId
    $ExistingCustomer = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter
    
    if (-not $ExistingCustomer) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Customer not found' }
        }
    }

    # Update customer fields
    $Entity = @{
        PartitionKey      = $ExistingCustomer.PartitionKey
        RowKey            = $ExistingCustomer.RowKey
        CustomerName      = if ($Request.Body.customerName) { $Request.Body.customerName } else { $ExistingCustomer.CustomerName }
        Email             = if ($Request.Body.email) { $Request.Body.email } else { $ExistingCustomer.Email }
        Phone             = if ($Request.Body.phone) { $Request.Body.phone } else { $ExistingCustomer.Phone }
        Address           = if ($Request.Body.address) { $Request.Body.address } else { $ExistingCustomer.Address }
        City              = if ($Request.Body.city) { $Request.Body.city } else { $ExistingCustomer.City }
        State             = if ($Request.Body.state) { $Request.Body.state } else { $ExistingCustomer.State }
        PostalCode        = if ($Request.Body.postalCode) { $Request.Body.postalCode } else { $ExistingCustomer.PostalCode }
        Status            = if ($Request.Body.status) { $Request.Body.status } else { $ExistingCustomer.Status }
        Notes             = if ($Request.Body.notes) { $Request.Body.notes } else { $ExistingCustomer.Notes }
        CustomerType      = if ($Request.Body.customerType) { $Request.Body.customerType } else { $ExistingCustomer.CustomerType }
        RelatedBuilders   = if ($Request.Body.relatedBuilders) { ($Request.Body.relatedBuilders | ConvertTo-Json -Compress) } else { $ExistingCustomer.RelatedBuilders }
        TradeAssociations = if ($Request.Body.tradeAssociations) { ($Request.Body.tradeAssociations | ConvertTo-Json -Compress) } else { $ExistingCustomer.TradeAssociations }
    }

    Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Customer updated successfully'; CustomerId = $CustomerId }
    }
}
