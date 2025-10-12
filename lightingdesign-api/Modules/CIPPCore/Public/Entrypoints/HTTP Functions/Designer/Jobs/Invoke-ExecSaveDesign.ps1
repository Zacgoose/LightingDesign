function Invoke-ExecSaveDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Designs'
    
    $JobId = $Request.Body.jobId
    $DesignData = $Request.Body.designData
    
    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    # Check if design already exists for this job
    $Filter = "JobId eq '{0}'" -f $JobId
    $ExistingDesign = Get-AzDataTableEntity @Table -Filter $Filter

    if ($ExistingDesign) {
        # Update existing design
        $Entity = [PSCustomObject]@{
            PartitionKey = $ExistingDesign.PartitionKey
            RowKey       = $ExistingDesign.RowKey
            JobId        = [string]$JobId
            DesignData   = if ($DesignData) { [string]($DesignData | ConvertTo-Json -Depth 20 -Compress) } else { $null }
            LastModified = (Get-Date).ToString('o')
        }
    } else {
        # Create new design
        $Entity = [PSCustomObject]@{
            PartitionKey = 'Design'
            RowKey       = [guid]::NewGuid().ToString()
            JobId        = [string]$JobId
            DesignData   = if ($DesignData) { [string]($DesignData | ConvertTo-Json -Depth 20 -Compress) } else { $null }
            LastModified = (Get-Date).ToString('o')
        }
    }

    Add-AzDataTableEntity @Table -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::OK
        Body       = @{ 
            Results = 'Design saved successfully'
            DesignId = $Entity.RowKey
            JobId = $JobId
        }
    }
}
