function Invoke-ExecNewCustomer {
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
            return @()
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

    # Extract values from autocomplete fields
    $CustomerName      = $Request.Body.customerName
    $Address           = $Request.Body.address
    $City              = $Request.Body.city
    $Email             = $Request.Body.email
    $Notes             = $Request.Body.notes
    $Phone             = $Request.Body.phone
    $PostalCode        = $Request.Body.postalCode
    $State             = $Request.Body.state
    $Status            = Get-AutoCompleteValue -InputObject $Request.Body.status
    $CustomerType      = Get-AutoCompleteValue -InputObject $Request.Body.customerType
    $RelatedBuilders   = Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedBuilders
    $TradeAssociations = Get-AutoCompleteArrayValues -InputArray $Request.Body.tradeAssociations

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
        RelatedBuilders   = if ($RelatedBuilders -and $RelatedBuilders.Count -gt 0) { ($RelatedBuilders | ConvertTo-Json -Compress) } else { $null }
        TradeAssociations = if ($TradeAssociations -and $TradeAssociations.Count -gt 0) { ($TradeAssociations | ConvertTo-Json -Compress) } else { $null }
    }

    Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

    Write-LogMessage -API 'NewCustomer' -message "Customer created successfully: CustomerId: $($Entity.RowKey), CustomerName: $CustomerName" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = "Customer created successfully"
    }
}
