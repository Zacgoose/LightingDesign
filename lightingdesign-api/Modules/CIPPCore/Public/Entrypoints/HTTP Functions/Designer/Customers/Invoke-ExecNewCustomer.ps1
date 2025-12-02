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
        $CustomerName      = if ($null -ne $Request.Body.customerName) { $Request.Body.customerName } else { "" }
        $Address           = if ($null -ne $Request.Body.address) { $Request.Body.address } else { "" }
        $City              = if ($null -ne $Request.Body.city) { $Request.Body.city } else { "" }
        $Email             = if ($null -ne $Request.Body.email) { $Request.Body.email } else { "" }
        $Notes             = if ($null -ne $Request.Body.notes) { $Request.Body.notes } else { "" }
        $Phone             = if ($null -ne $Request.Body.phone) { $Request.Body.phone } else { "" }
        $PostalCode        = if ($null -ne $Request.Body.postalCode) { $Request.Body.postalCode } else { "" }
        $State             = if ($null -ne $Request.Body.state) { $Request.Body.state } else { "" }
        $Status            = if ($null -ne $Request.Body.status) { Get-AutoCompleteValue -InputObject $Request.Body.status } else { "" }
        $CustomerType      = if ($null -ne $Request.Body.customerType) { Get-AutoCompleteValue -InputObject $Request.Body.customerType } else { "" }
        $RelatedBuilders   = if ($null -ne $Request.Body.relatedBuilders) { Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedBuilders } else { @() }
        $TradeAssociations = if ($null -ne $Request.Body.tradeAssociations) { Get-AutoCompleteArrayValues -InputArray $Request.Body.tradeAssociations } else { @() }

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
        RelatedBuilders   = if ($RelatedBuilders -and $RelatedBuilders.Count -gt 0) { ($RelatedBuilders | ConvertTo-Json -Compress) } else { "" }
        TradeAssociations = if ($TradeAssociations -and $TradeAssociations.Count -gt 0) { ($TradeAssociations | ConvertTo-Json -Compress) } else { "" }
    }

    Add-CIPPAzDataTableEntity -Context $Table.Context -Entity $Entity -Force

    Write-LogMessage -API 'NewCustomer' -message "Customer created successfully: CustomerId: $($Entity.RowKey), CustomerName: $CustomerName" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = "Customer created successfully"
    }
}
