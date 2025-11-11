function Invoke-ExecDeleteJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    # Validate store access first
    Test-CIPPAccess -Request $Request

    $Table = Get-CIPPTable -TableName 'Jobs'

    $JobId = $Request.Body.jobId

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    # Get existing job to verify it exists
    $Filter = "RowKey eq '{0}'" -f $JobId
    $ExistingJob = Get-CIPPAzDataTableEntity @Table -Filter $Filter

    if (-not $ExistingJob) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::NotFound
            Body       = @{ error = 'Job not found' }
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
    
    Write-LogMessage -API 'DeleteJob' -message "Job deleted successfully: JobId: $JobId, JobNumber: $($ExistingJob.JobNumber)" -Sev 'Info' -headers $Request.Headers
    
    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job deleted successfully' }
    }
}
