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

    # Helper function to safely add property only if it has a value
    function Add-PropertyIfNotNull {
        param(
            [hashtable]$Entity,
            [string]$PropertyName,
            $NewValue,
            $ExistingValue
        )

        if ($null -ne $NewValue -and $NewValue -ne '') {
            $Entity[$PropertyName] = $NewValue
        } elseif ($null -ne $ExistingValue -and $ExistingValue -ne '') {
            $Entity[$PropertyName] = $ExistingValue
        }
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
    $null = Test-CIPPAccess -Request $Request -StoreId $ExistingJob.StoreId

    # Extract new store ID if changing
    $NewStoreId = Get-AutoCompleteValue -InputObject $Request.Body.storeId

    # If changing store, validate access to the new store
    if ($NewStoreId -and $NewStoreId -ne $ExistingJob.StoreId) {
        $null = Test-CIPPAccess -Request $Request -StoreId $NewStoreId
    }

    # Extract values from autocomplete fields
    $CustomerId = Get-AutoCompleteValue -InputObject $Request.Body.customerId
    $Status = Get-AutoCompleteValue -InputObject $Request.Body.status
    $AssignedDesigner = Get-AutoCompleteValue -InputObject $Request.Body.assignedDesigner
    $RelatedTrades = Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedTrades
    $Builders = Get-AutoCompleteArrayValues -InputArray $Request.Body.builders

    # Start with required properties
    $Entity = @{
        PartitionKey = $ExistingJob.PartitionKey
        RowKey       = $ExistingJob.RowKey
    }

    # Add properties only if they have values
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'JobName' -NewValue $Request.Body.jobName -ExistingValue $ExistingJob.JobName
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'CustomerId' -NewValue $CustomerId -ExistingValue $ExistingJob.CustomerId
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'StoreId' -NewValue $NewStoreId -ExistingValue $ExistingJob.StoreId
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'Status' -NewValue $Status -ExistingValue $ExistingJob.Status
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'Description' -NewValue $Request.Body.description -ExistingValue $ExistingJob.Description
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'Address' -NewValue $Request.Body.address -ExistingValue $ExistingJob.Address
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'City' -NewValue $Request.Body.city -ExistingValue $ExistingJob.City
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'State' -NewValue $Request.Body.state -ExistingValue $ExistingJob.State
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'PostalCode' -NewValue $Request.Body.postalCode -ExistingValue $ExistingJob.PostalCode
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'ContactName' -NewValue $Request.Body.contactName -ExistingValue $ExistingJob.ContactName
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'ContactPhone' -NewValue $Request.Body.contactPhone -ExistingValue $ExistingJob.ContactPhone
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'ContactEmail' -NewValue $Request.Body.contactEmail -ExistingValue $ExistingJob.ContactEmail
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'EstimatedValue' -NewValue $Request.Body.estimatedValue -ExistingValue $ExistingJob.EstimatedValue
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'Notes' -NewValue $Request.Body.notes -ExistingValue $ExistingJob.Notes
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'AssignedDesigner' -NewValue $AssignedDesigner -ExistingValue $ExistingJob.AssignedDesigner
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'Username' -NewValue $null -ExistingValue $ExistingJob.Username
    Add-PropertyIfNotNull -Entity $Entity -PropertyName 'JobData' -NewValue $null -ExistingValue $ExistingJob.JobData

    # Handle array properties (convert to JSON only if they have values)
    if ($RelatedTrades -and $RelatedTrades.Count -gt 0) {
        $Entity['RelatedTrades'] = ($RelatedTrades | ConvertTo-Json -Compress)
    } elseif ($ExistingJob.RelatedTrades) {
        $Entity['RelatedTrades'] = $ExistingJob.RelatedTrades
    }

    if ($Builders -and $Builders.Count -gt 0) {
        $Entity['Builders'] = ($Builders | ConvertTo-Json -Compress)
    } elseif ($ExistingJob.Builders) {
        $Entity['Builders'] = $ExistingJob.Builders
    }

    # Handle pricing matrix - only include if it has actual values
    if ($Request.Body.pricingMatrix) {
        $hasValues = $false
        foreach ($key in $Request.Body.pricingMatrix.Keys) {
            if ($null -ne $Request.Body.pricingMatrix[$key] -and $Request.Body.pricingMatrix[$key] -ne '') {
                $hasValues = $true
                break
            }
        }

        if ($hasValues) {
            $Entity['PricingMatrix'] = ($Request.Body.pricingMatrix | ConvertTo-Json -Compress)
        } elseif ($ExistingJob.PricingMatrix) {
            $Entity['PricingMatrix'] = $ExistingJob.PricingMatrix
        }
    } elseif ($ExistingJob.PricingMatrix) {
        $Entity['PricingMatrix'] = $ExistingJob.PricingMatrix
    }

    Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

    Write-LogMessage -API 'EditJob' -message "Job updated successfully: JobId: $JobId, JobName: $($Entity.JobName)" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job updated successfully'; JobId = $JobId }
    }
}
