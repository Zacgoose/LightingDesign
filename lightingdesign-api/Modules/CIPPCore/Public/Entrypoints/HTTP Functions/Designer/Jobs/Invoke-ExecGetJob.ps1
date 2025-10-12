function Invoke-ExecGetJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'Jobs'
    
    $JobId = $Request.Query.jobId
    
    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId parameter is required' }
        }
    }

    # Lookup a single job by RowKey
    $Filter = "RowKey eq '{0}'" -f $JobId
    $Row = Get-AzDataTableEntity @Table -Filter $Filter
    
    if ($Row) {
        $JobData = if ($Row.JobData -and (Test-Json -Json $Row.JobData -ErrorAction SilentlyContinue)) {
            $Row.JobData | ConvertFrom-Json
        } else { $Row.JobData }
        
        $ReturnedJob = [PSCustomObject]@{
            jobId          = $Row.RowKey
            jobNumber      = $Row.JobNumber
            customerName   = if ($Row.CustomerId) { @{ value = $Row.CustomerId; label = $Row.CustomerName } } else { $null }
            status         = if ($Row.Status) { @{ value = $Row.Status; label = (Get-Culture).TextInfo.ToTitleCase($Row.Status -replace '_', ' ') } } else { $null }
            description    = $Row.Description
            address        = $Row.Address
            city           = $Row.City
            state          = $Row.State
            postalCode     = $Row.PostalCode
            contactName    = $Row.ContactName
            contactPhone   = $Row.ContactPhone
            contactEmail   = $Row.ContactEmail
            estimatedValue = $Row.EstimatedValue
            notes          = $Row.Notes
            createdDate    = $Row.Timestamp
            user           = $Row.Username
            jobData        = $JobData
        }
    } else {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = $ReturnedJob
    }
}
