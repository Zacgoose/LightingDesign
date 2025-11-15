function Invoke-ExecDeleteCustomer {
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

    # Get existing customer to verify it exists
    $Filter = "RowKey eq '{0}'" -f $CustomerId
    $ExistingCustomer = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter
    
    if (-not $ExistingCustomer) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Customer not found' }
        }
    }

    # Delete the customer
    Remove-AzDataTableEntity -Context $Table.Context -Entity $ExistingCustomer

    Write-LogMessage -API 'DeleteCustomer' -message "Customer deleted successfully: CustomerId: $CustomerId, CustomerName: $($ExistingCustomer.CustomerName)" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Customer deleted successfully'; CustomerId = $CustomerId }
    }
}
