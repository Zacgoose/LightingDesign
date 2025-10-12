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

    # Get existing job to verify it exists
    $Filter = "RowKey eq '{0}'" -f $JobId
    $ExistingJob = Get-CIPPAzDataTableEntity -Context $Table.Context -Filter $Filter
    
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

    # Also delete associated design if it exists
    $DesignTable = Get-CIPPTable -TableName 'Designs'
    $DesignFilter = "JobId eq '{0}'" -f $JobId
    $ExistingDesign = Get-CIPPAzDataTableEntity -Context $DesignTable.Context -Filter $DesignFilter
    
    if ($ExistingDesign) {
        $DesignEntity = @{
            PartitionKey = $ExistingDesign.PartitionKey
            RowKey       = $ExistingDesign.RowKey
        }
        Remove-AzDataTableEntity @DesignTable -Entity $DesignEntity -Force
    }

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ Results = 'Job deleted successfully' }
    }
}
