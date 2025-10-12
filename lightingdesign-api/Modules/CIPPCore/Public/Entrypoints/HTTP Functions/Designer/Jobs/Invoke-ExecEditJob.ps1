function Invoke-ExecEditJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Jobs'
    
    $JobId = $Request.Body.jobId
    
    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    # Get existing job
    $Filter = "RowKey eq '{0}'" -f $JobId
    $ExistingJob = Get-AzDataTableEntity @Table -Filter $Filter
    
    if (-not $ExistingJob) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    # Update job fields
    $Entity = [PSCustomObject]@{
        PartitionKey   = $ExistingJob.PartitionKey
        RowKey         = $ExistingJob.RowKey
        JobNumber      = if ($Request.Body.jobNumber) { $Request.Body.jobNumber } else { $ExistingJob.JobNumber }
        CustomerId     = if ($Request.Body.customerId) { $Request.Body.customerId } else { $ExistingJob.CustomerId }
        Status         = if ($Request.Body.status) { $Request.Body.status } else { $ExistingJob.Status }
        Description    = if ($Request.Body.description) { $Request.Body.description } else { $ExistingJob.Description }
        Address        = if ($Request.Body.address) { $Request.Body.address } else { $ExistingJob.Address }
        City           = if ($Request.Body.city) { $Request.Body.city } else { $ExistingJob.City }
        State          = if ($Request.Body.state) { $Request.Body.state } else { $ExistingJob.State }
        PostalCode     = if ($Request.Body.postalCode) { $Request.Body.postalCode } else { $ExistingJob.PostalCode }
        ContactName    = if ($Request.Body.contactName) { $Request.Body.contactName } else { $ExistingJob.ContactName }
        ContactPhone   = if ($Request.Body.contactPhone) { $Request.Body.contactPhone } else { $ExistingJob.ContactPhone }
        ContactEmail   = if ($Request.Body.contactEmail) { $Request.Body.contactEmail } else { $ExistingJob.ContactEmail }
        EstimatedValue = if ($Request.Body.estimatedValue) { $Request.Body.estimatedValue } else { $ExistingJob.EstimatedValue }
        Notes          = if ($Request.Body.notes) { $Request.Body.notes } else { $ExistingJob.Notes }
        Username       = $ExistingJob.Username
        JobData        = $ExistingJob.JobData
    }

    Add-AzDataTableEntity @Table -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job updated successfully'; JobId = $JobId }
    }
}
