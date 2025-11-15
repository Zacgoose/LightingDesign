function Invoke-ExecEditJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.ReadWrite
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
            return $null
        }

        return @($InputArray | ForEach-Object {
            if ($_.value) {
                $_.value
            } else {
                $_
            }
        })
    }

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
    $ExistingJob = Get-CIPPAzDataTableEntity @Table -Filter $Filter

    if (-not $ExistingJob) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    # Validate access to the existing job's store
    Test-CIPPAccess -Request $Request -StoreId $ExistingJob.StoreId

    # Extract new store ID if changing
    $NewStoreId = Get-AutoCompleteValue -InputObject $Request.Body.storeId

    # If changing store, validate access to the new store
    if ($NewStoreId -and $NewStoreId -ne $ExistingJob.StoreId) {
        Test-CIPPAccess -Request $Request -StoreId $NewStoreId
    }

    # Extract values from autocomplete fields
    $CustomerId = Get-AutoCompleteValue -InputObject $Request.Body.customerId
    $Status = Get-AutoCompleteValue -InputObject $Request.Body.status
    $AssignedDesigner = Get-AutoCompleteValue -InputObject $Request.Body.assignedDesigner
    $RelatedTrades = Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedTrades
    $Builders = Get-AutoCompleteArrayValues -InputArray $Request.Body.builders

    # Update job fields
    $Entity = @{
        PartitionKey     = $ExistingJob.PartitionKey
        RowKey           = $ExistingJob.RowKey
        JobName          = if ($Request.Body.jobName) { $Request.Body.jobName } else { $ExistingJob.JobName }
        CustomerId       = if ($CustomerId) { $CustomerId } else { $ExistingJob.CustomerId }
        StoreId          = if ($NewStoreId) { $NewStoreId } else { $ExistingJob.StoreId }
        Status           = if ($Status) { $Status } else { $ExistingJob.Status }
        Description      = if ($Request.Body.description) { $Request.Body.description } else { $ExistingJob.Description }
        Address          = if ($Request.Body.address) { $Request.Body.address } else { $ExistingJob.Address }
        City             = if ($Request.Body.city) { $Request.Body.city } else { $ExistingJob.City }
        State            = if ($Request.Body.state) { $Request.Body.state } else { $ExistingJob.State }
        PostalCode       = if ($Request.Body.postalCode) { $Request.Body.postalCode } else { $ExistingJob.PostalCode }
        ContactName      = if ($Request.Body.contactName) { $Request.Body.contactName } else { $ExistingJob.ContactName }
        ContactPhone     = if ($Request.Body.contactPhone) { $Request.Body.contactPhone } else { $ExistingJob.ContactPhone }
        ContactEmail     = if ($Request.Body.contactEmail) { $Request.Body.contactEmail } else { $ExistingJob.ContactEmail }
        EstimatedValue   = if ($Request.Body.estimatedValue) { $Request.Body.estimatedValue } else { $ExistingJob.EstimatedValue }
        Notes            = if ($Request.Body.notes) { $Request.Body.notes } else { $ExistingJob.Notes }
        RelatedTrades    = if ($RelatedTrades) { ($RelatedTrades | ConvertTo-Json -Compress) } else { $ExistingJob.RelatedTrades }
        Builders         = if ($Builders) { ($Builders | ConvertTo-Json -Compress) } else { $ExistingJob.Builders }
        AssignedDesigner = if ($AssignedDesigner) { $AssignedDesigner } else { $ExistingJob.AssignedDesigner }
        PricingMatrix    = if ($Request.Body.pricingMatrix) { ($Request.Body.pricingMatrix | ConvertTo-Json -Compress) } else { $ExistingJob.PricingMatrix }
        Username         = $ExistingJob.Username
        JobData          = $ExistingJob.JobData
    }

    Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

    Write-LogMessage -API 'EditJob' -message "Job updated successfully: JobId: $JobId, JobName: $($Entity.JobName)" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job updated successfully'; JobId = $JobId }
    }
}
