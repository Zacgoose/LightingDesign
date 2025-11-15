function Invoke-ExecDeleteJob {
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

    $Filter = "RowKey eq '{0}'" -f $JobId
    $ExistingJob = Get-CIPPAzDataTableEntity @Table -Filter $Filter

    if (-not $ExistingJob) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
        }
    }

    # Get user's allowed stores
    $AllowedStores = Test-CIPPAccess -Request $Request -StoreList

    # Check if user has access to this job's store
    if ($AllowedStores -notcontains 'AllStores' -and $AllowedStores -notcontains $ExistingJob.StoreId) {
        Write-LogMessage -API 'DeleteJob' -message "Access denied: User attempted to delete job $JobId from unauthorized store $($ExistingJob.StoreId)" -Sev 'Warn' -headers $Request.Headers
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::Forbidden
            Body       = @{ error = 'Access to this job is not allowed' }
        }
    }

    # Delete the job
    $Entity = @{
        PartitionKey = $ExistingJob.PartitionKey
        RowKey       = $ExistingJob.RowKey
    }
    Remove-AzDataTableEntity @Table -Entity $Entity -Force
    # Delete all associated designs
    $DesignTable = Get-CIPPTable -TableName 'Designs'
    $DesignFilter = "PartitionKey eq '$JobId'"
    $ExistingDesigns = Get-AzDataTableEntity @DesignTable -Filter $DesignFilter
    if ($ExistingDesigns) {
        foreach ($Design in $ExistingDesigns) {
            $DesignEntity = @{
                PartitionKey = $Design.PartitionKey
                RowKey       = $Design.RowKey
            }
            Remove-AzDataTableEntity @DesignTable -Entity $DesignEntity -Force
        }
    }

    Write-LogMessage -API 'DeleteJob' -message "Job deleted successfully: JobId: $JobId, JobName: $($ExistingJob.JobName)" -Sev 'Info' -headers $Request.Headers

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job deleted successfully' }
    }
}
