function Invoke-ExecEditCustomer {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Customers.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    # Helper function to extract value from autocomplete objects
    function Get-AutoCompleteValue {
        param($InputObject)

        if ($null -eq $InputObject) {
            return $null
        }

        if ($InputObject.value) {
            return $InputObject.value
        }

        return $InputObject
    }

    # Helper function to extract array of values from autocomplete multi-select
    function Get-AutoCompleteArrayValues {
        param($InputArray)

        if ($null -eq $InputArray -or $InputArray.Count -eq 0) {
            return $null
        }

        return @($InputArray | ForEach-Object {
            if ($_.value) {
                $_.value
            } else {
                $_
            }
        })
    }

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

    # Extract values from autocomplete fields
    $Status = Get-AutoCompleteValue -InputObject $Request.Body.status
    $CustomerType = Get-AutoCompleteValue -InputObject $Request.Body.customerType
    $RelatedBuilders = if ($Request.Body.PSObject.Properties.Name -contains 'relatedBuilders') {
        Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedBuilders
    } else { $null }
    $TradeAssociations = if ($Request.Body.PSObject.Properties.Name -contains 'tradeAssociations') {
        Get-AutoCompleteArrayValues -InputArray $Request.Body.tradeAssociations
    } else { $null }

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
        Status            = if ($Request.Body.PSObject.Properties.Name -contains 'status') { $Status } else { $ExistingCustomer.Status }
        Notes             = if ($Request.Body.notes) { $Request.Body.notes } else { $ExistingCustomer.Notes }
        CustomerType      = if ($Request.Body.PSObject.Properties.Name -contains 'customerType') { $CustomerType } else { $ExistingCustomer.CustomerType }
        RelatedBuilders   = if ($null -ne $RelatedBuilders) { 
            if ($RelatedBuilders.Count -gt 0) { ($RelatedBuilders | ConvertTo-Json -Compress) } else { $null }
        } else { $ExistingCustomer.RelatedBuilders }
        TradeAssociations = if ($null -ne $TradeAssociations) { 
            if ($TradeAssociations.Count -gt 0) { ($TradeAssociations | ConvertTo-Json -Compress) } else { $null }
        } else { $ExistingCustomer.TradeAssociations }
    }

    Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

    Write-LogMessage -API 'EditCustomer' -message "Customer updated successfully: CustomerId: $CustomerId, CustomerName: $($Entity.CustomerName)" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Customer updated successfully'; CustomerId = $CustomerId }
    }
}
