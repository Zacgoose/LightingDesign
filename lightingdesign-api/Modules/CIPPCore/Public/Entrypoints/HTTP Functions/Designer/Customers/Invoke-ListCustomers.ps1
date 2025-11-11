function Invoke-ListCustomers {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Customers.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Customers'

    if ($Request.Query.customerentryid) {
        # Lookup a single customer by RowKey
        $Filter = "RowKey eq '{0}'" -f $Request.Query.customerentryid
        $Row = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter
        if ($Row) {
            $ReturnedCustomer = [PSCustomObject]@{
                DateTime     = $Row.Timestamp
                CustomerName = $Row.CustomerName
                Status       = $Row.Status
                User         = $Row.Username
                Details      = $Row.CustomerData
                AppId        = $Row.AppId
                IP           = $Row.IP
                RowKey       = $Row.RowKey
            }
        } else {
            $ReturnedCustomer = $null
        }
    } elseif ($Request.Query.ListCustomers) {
        # List all customers (summary)
        $ReturnedCustomer = Get-CIPPAzDataTableEntity -Context $Table.Context | ForEach-Object {
            [PSCustomObject]@{
                id           = $_.RowKey
                DateTime     = $_.Timestamp
                customerName = $_.CustomerName
                Status       = $_.Status
                Email        = $_.Email
                Phone        = $_.Phone
                User         = $_.Username
                RowKey       = $_.RowKey
            }
        }
    } else {
        # Optionally filter customers by status, user, or date
        $StatusFilter = if ($Request.Query.Status) { ($Request.Query.Status).split(',') } else { $null }
        $UserFilter = $Request.Query.User
        $DateFilter = $Request.Query.DateFilter

        $Rows = Get-CIPPAzDataTableEntity -Context $Table.Context
        if ($StatusFilter) {
            $Rows = $Rows | Where-Object { $_.Status -in $StatusFilter }
        }
        if ($UserFilter) {
            $Rows = $Rows | Where-Object { $_.Username -eq $UserFilter }
        }
        if ($DateFilter) {
            $Rows = $Rows | Where-Object { $_.PartitionKey -eq $DateFilter }
        }

        $ReturnedCustomer = $Rows | ForEach-Object {
            [PSCustomObject]@{
                id           = $_.RowKey
                DateTime     = $_.Timestamp
                customerName = $_.CustomerName
                Status       = $_.Status
                Email        = $_.Email
                Phone        = $_.Phone
                User         = $_.Username
                RowKey       = $_.RowKey
            }
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @($ReturnedCustomer | Sort-Object -Property DateTime -Descending)
    }
}
