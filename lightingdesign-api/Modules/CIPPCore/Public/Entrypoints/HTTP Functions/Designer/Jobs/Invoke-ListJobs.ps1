function Invoke-ListJobs {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Jobs'

    if ($Request.Query.jobentryid) {
        # Lookup a single job by RowKey
        $Filter = "RowKey eq '{0}'" -f $Request.Query.jobentryid
        $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        if (-not $Row) {
            return [HttpResponseContext]@{
                StatusCode = [System.Net.HttpStatusCode]::NotFound
                Body       = @{ error = 'Job not found' }
            }
        }

        # Validate store access - throws exception if access denied
        Test-CIPPAccess -Request $Request -StoreId $Row.StoreId

        $JobData = if ($Row.JobData -and (Test-Json -Json $Row.JobData -ErrorAction SilentlyContinue)) {
            $Row.JobData | ConvertFrom-Json
        } else { $Row.JobData }

        $ReturnedJob = [PSCustomObject]@{
            DateTime       = $Row.Timestamp
            JobName        = $Row.JobName
            JobNumber      = $Row.JobNumber
            CustomerName   = $Row.CustomerName
            CustomerId     = $Row.CustomerId
            StoreId        = $Row.StoreId
            Status         = $Row.Status
            Description    = $Row.Description
            Address        = $Row.Address
            City           = $Row.City
            State          = $Row.State
            PostalCode     = $Row.PostalCode
            ContactName    = $Row.ContactName
            ContactPhone   = $Row.ContactPhone
            ContactEmail   = $Row.ContactEmail
            EstimatedValue = $Row.EstimatedValue
            Notes          = $Row.Notes
            User           = $Row.Username
            Severity       = $Row.Severity
            JobData        = $JobData
            AppId          = $Row.AppId
            IP             = $Row.IP
            RowKey         = $Row.RowKey
            id             = $Row.RowKey
        }
    } elseif ($Request.Query.ListJobs) {
        # Get list of stores the user has access to
        $AllowedStores = Test-CIPPAccess -Request $Request -StoreList

        # List all jobs (summary)
        $AllJobs = Get-CIPPAzDataTableEntity @Table

        # Filter jobs based on allowed stores
        if ($AllowedStores -notcontains 'AllStores') {
            $AllJobs = $AllJobs | Where-Object { $AllowedStores -contains $_.StoreId }
        }

        $ReturnedJob = $AllJobs | ForEach-Object {
            [PSCustomObject]@{
                DateTime       = $_.Timestamp
                JobName        = $_.JobName
                JobNumber      = $_.JobNumber
                CustomerName   = $_.CustomerName
                StoreId        = $_.StoreId
                Status         = $_.Status
                User           = $_.Username
                Severity       = $_.Severity
                RowKey         = $_.RowKey
                id             = $_.RowKey
                createdDate    = $_.Timestamp
                assignedTo     = $_.Username
                totalValue     = $_.EstimatedValue
            }
        }
    } else {
        # Get list of stores the user has access to
        $AllowedStores = Test-CIPPAccess -Request $Request -StoreList

        # Optionally filter jobs by status, date, or user
        $StatusFilter = if ($Request.Query.Status) { ($Request.Query.Status).split(',') } else { $null }
        $UserFilter = $Request.Query.User
        $DateFilter = $Request.Query.DateFilter

        $Rows = Get-CIPPAzDataTableEntity @Table

        # Filter by allowed stores first
        if ($AllowedStores -notcontains 'AllStores') {
            $Rows = $Rows | Where-Object { $AllowedStores -contains $_.StoreId }
        }

        if ($StatusFilter) {
            $Rows = $Rows | Where-Object { $_.Status -in $StatusFilter }
        }
        if ($UserFilter) {
            $Rows = $Rows | Where-Object { $_.Username -eq $UserFilter }
        }
        if ($DateFilter) {
            $Rows = $Rows | Where-Object { $_.PartitionKey -eq $DateFilter }
        }

        $ReturnedJob = $Rows | ForEach-Object {
            [PSCustomObject]@{
                DateTime       = $_.Timestamp
                JobName        = $_.JobName
                JobNumber      = $_.JobNumber
                CustomerName   = $_.CustomerName
                StoreId        = $_.StoreId
                Status         = $_.Status
                User           = $_.Username
                Severity       = $_.Severity
                RowKey         = $_.RowKey
                id             = $_.RowKey
                createdDate    = $_.Timestamp
                assignedTo     = $_.Username
                totalValue     = $_.EstimatedValue
            }
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @($ReturnedJob | Sort-Object -Property DateTime -Descending)
    }
}
