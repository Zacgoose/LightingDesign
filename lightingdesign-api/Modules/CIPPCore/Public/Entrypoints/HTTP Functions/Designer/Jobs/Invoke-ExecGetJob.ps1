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
    $Row = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter

    if ($Row) {
        $JobData = if ($Row.JobData -and (Test-Json -Json $Row.JobData -ErrorAction SilentlyContinue)) {
            $Row.JobData | ConvertFrom-Json
        } else { $Row.JobData }

        $ReturnedJob = [PSCustomObject]@{
            jobId            = $Row.RowKey
            jobNumber        = $Row.JobNumber
            customerName     = if ($Row.CustomerId) { @{ value = $Row.CustomerId; label = $Row.CustomerName } } else { $null }
            status           = $Row.Status
            description      = $Row.Description
            address          = $Row.Address
            city             = $Row.City
            state            = $Row.State
            postalCode       = $Row.PostalCode
            contactName      = $Row.ContactName
            contactPhone     = $Row.ContactPhone
            contactEmail     = $Row.ContactEmail
            estimatedValue   = $Row.EstimatedValue
            notes            = $Row.Notes
            relatedTrades    = if ($Row.RelatedTrades) { $Row.RelatedTrades | ConvertFrom-Json } else { @() }
            builders         = if ($Row.Builders) { $Row.Builders | ConvertFrom-Json } else { @() }
            assignedDesigner = if ($Row.AssignedDesigner) { $Row.AssignedDesigner | ConvertFrom-Json } else { $null }
            pricingMatrix    = if ($Row.PricingMatrix) { $Row.PricingMatrix | ConvertFrom-Json } else { $null }
            createdDate      = $Row.Timestamp
            user             = $Row.Username
            jobData          = $JobData
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
