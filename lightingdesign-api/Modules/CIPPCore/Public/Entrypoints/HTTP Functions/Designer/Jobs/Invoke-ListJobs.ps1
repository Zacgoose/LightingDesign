

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
        $Row = Get-AzDataTableEntity @Table -Filter $Filter
        if ($Row) {
            $JobData = if ($Row.JobData -and (Test-Json -Json $Row.JobData -ErrorAction SilentlyContinue)) {
                $Row.JobData | ConvertFrom-Json
            } else { $Row.JobData }
            $ReturnedJob = [PSCustomObject]@{
                DateTime = $Row.Timestamp
                JobName  = $Row.JobName
                Status   = $Row.Status
                User     = $Row.Username
                Severity = $Row.Severity
                JobData  = $JobData
                AppId    = $Row.AppId
                IP       = $Row.IP
                RowKey   = $Row.RowKey
            }
        } else {
            $ReturnedJob = $null
        }
    } elseif ($Request.Query.ListJobs) {
        # List all jobs (summary)
        $ReturnedJob = Get-AzDataTableEntity @Table | ForEach-Object {
            [PSCustomObject]@{
                DateTime = $_.Timestamp
                JobName  = $_.JobName
                Status   = $_.Status
                User     = $_.Username
                Severity = $_.Severity
                RowKey   = $_.RowKey
            }
        }
    } else {
        # Optionally filter jobs by status, date, or user
        $StatusFilter = if ($Request.Query.Status) { ($Request.Query.Status).split(',') } else { $null }
        $UserFilter = $Request.Query.User
        $DateFilter = $Request.Query.DateFilter

        $Rows = Get-AzDataTableEntity @Table
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
                DateTime = $_.Timestamp
                JobName  = $_.JobName
                Status   = $_.Status
                User     = $_.Username
                Severity = $_.Severity
                RowKey   = $_.RowKey
            }
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @($ReturnedJob | Sort-Object -Property DateTime -Descending)
    }
}
