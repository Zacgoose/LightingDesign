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

    $Entity = [PSCustomObject]@{
        PartitionKey  = 'Customer'
        RowKey        = [guid]::NewGuid().ToString()
        CustomerName  = $CustomerName
        Address       = $Address
        City          = $City
        Email         = $Email
        Notes         = $Notes
        Phone         = $Phone
        PostalCode    = $PostalCode
        State         = $State
        Status        = $Status
    }

    Add-AzDataTableEntity @Table -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = $Entity
    }
}
