function Invoke-ExecNewCustomer {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Customers.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Customers'

    $CustomerName      = $Request.Body.customerName
    $Address           = $Request.Body.address
    $City              = $Request.Body.city
    $Email             = $Request.Body.email
    $Notes             = $Request.Body.notes
    $Phone             = $Request.Body.phone
    $PostalCode        = $Request.Body.postalCode
    $State             = $Request.Body.state
    $Status            = $Request.Body.status
    $CustomerType      = $Request.Body.customerType
    $RelatedBuilders   = $Request.Body.relatedBuilders
    $TradeAssociations = $Request.Body.tradeAssociations

    $Entity = @{
        PartitionKey      = 'Customer'
        RowKey            = [guid]::NewGuid().ToString()
        CustomerName      = $CustomerName
        Address           = $Address
        City              = $City
        Email             = $Email
        Notes             = $Notes
        Phone             = $Phone
        PostalCode        = $PostalCode
        State             = $State
        Status            = $Status
        CustomerType      = $CustomerType
        RelatedBuilders   = if ($RelatedBuilders) { ($RelatedBuilders | ConvertTo-Json -Compress) } else { $null }
        TradeAssociations = if ($TradeAssociations) { ($TradeAssociations | ConvertTo-Json -Compress) } else { $null }
    }

    Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = $Entity
    }
}
