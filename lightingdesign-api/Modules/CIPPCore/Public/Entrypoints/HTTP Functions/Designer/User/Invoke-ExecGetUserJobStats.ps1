function Invoke-ExecGetUserJobStats {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.User.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Get current user from request headers
        $User = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($Request.Headers.'x-ms-client-principal')) | ConvertFrom-Json
        $UserId = $User.userId
        
        # Get user's allowed stores
        $AllowedStores = Test-CIPPAccess -Request $Request -StoreList
        
        # Get all jobs
        $JobsTable = Get-CIPPTable -TableName 'Jobs'
        $AllJobs = Get-CIPPAzDataTableEntity -Context $JobsTable.Context -Filter "PartitionKey eq 'Job'"
        
        # Filter jobs based on user's store access and assigned designer
        if ($AllowedStores -contains 'AllStores') {
            $UserJobs = $AllJobs | Where-Object { $_.AssignedDesigner -eq $UserId }
        } else {
            $UserJobs = $AllJobs | Where-Object { 
                $_.AssignedDesigner -eq $UserId -and 
                $AllowedStores -contains $_.StoreId 
            }
        }

        # Calculate date ranges
        $Now = Get-Date
        $StartOfWeek = $Now.AddDays(-($Now.DayOfWeek.value__))
        $StartOfMonth = Get-Date -Day 1

        # Calculate statistics
        $TotalJobs = ($UserJobs | Measure-Object).Count
        $PendingJobs = ($UserJobs | Where-Object { $_.Status -eq 'pending' } | Measure-Object).Count
        $InProgressJobs = ($UserJobs | Where-Object { $_.Status -eq 'in_progress' } | Measure-Object).Count
        $CompletedJobs = ($UserJobs | Where-Object { $_.Status -eq 'completed' } | Measure-Object).Count
        $JobsThisWeek = ($UserJobs | Where-Object { $_.Timestamp -ge $StartOfWeek } | Measure-Object).Count
        $JobsThisMonth = ($UserJobs | Where-Object { $_.Timestamp -ge $StartOfMonth } | Measure-Object).Count

        # Get customer statistics
        $CustomersTable = Get-CIPPTable -TableName 'Customers'
        $AllCustomers = Get-CIPPAzDataTableEntity -Context $CustomersTable.Context -Filter "PartitionKey eq 'Customer'"
        
        $ActiveCustomers = ($AllCustomers | Where-Object { $_.Status -eq 'active' } | Measure-Object).Count
        $NewCustomers = ($AllCustomers | Where-Object { 
            $_.Status -eq 'active' -and $_.Timestamp -ge $StartOfMonth 
        } | Measure-Object).Count

        $JobStats = @{
            totalJobs        = $TotalJobs
            pendingJobs      = $PendingJobs
            inProgressJobs   = $InProgressJobs
            completedJobs    = $CompletedJobs
            jobsThisWeek     = $JobsThisWeek
            jobsThisMonth    = $JobsThisMonth
            activeCustomers  = $ActiveCustomers
            newCustomers     = $NewCustomers
            userId           = $UserId
        }

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = $JobStats
        }
    }
    catch {
        Write-LogMessage -API 'GetUserJobStats' -message "Failed to get user job stats: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{ error = "Failed to get user job stats: $($_.Exception.Message)" }
        }
    }
}
