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
    $Row = Get-CIPPAzDataTableEntity @Table -Filter $Filter

    if (-not $Row) {
        Write-LogMessage -API 'GetJob' -message "Job not found: JobId: $JobId" -Sev 'Warning' -headers $Request.Headers
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    # Validate store access
    Test-CIPPAccess -Request $Request -StoreId $Row.StoreId

    Write-LogMessage -API 'GetJob' -message "Retrieved job: JobId: $JobId, JobNumber: $($Row.JobNumber)" -Sev 'Info' -headers $Request.Headers

    # Parse JSON fields
    $RelatedTrades = if ($Row.RelatedTrades) {
        try { $Row.RelatedTrades | ConvertFrom-Json } catch { @() }
    } else { @() }

    $Builders = if ($Row.Builders) {
        try { $Row.Builders | ConvertFrom-Json } catch { @() }
    } else { @() }

    $PricingMatrix = if ($Row.PricingMatrix) {
        try { $Row.PricingMatrix | ConvertFrom-Json } catch { $null }
    } else { $null }

    $JobData = if ($Row.JobData -and (Test-Json -Json $Row.JobData -ErrorAction SilentlyContinue)) {
        $Row.JobData | ConvertFrom-Json
    } else { $Row.JobData }

    # Return simple values - let frontend handle autocomplete formatting
    $ReturnedJob = [PSCustomObject]@{
        jobId            = $Row.RowKey
        jobNumber        = $Row.JobNumber
        customerId       = $Row.CustomerId
        storeId          = $Row.StoreId
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
        relatedTrades    = $RelatedTrades
        builders         = $Builders
        assignedDesigner = $Row.AssignedDesigner
        pricingMatrix    = $PricingMatrix
        createdDate      = $Row.Timestamp
        user             = $Row.Username
        jobData          = $JobData
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = $ReturnedJob
    }
}
