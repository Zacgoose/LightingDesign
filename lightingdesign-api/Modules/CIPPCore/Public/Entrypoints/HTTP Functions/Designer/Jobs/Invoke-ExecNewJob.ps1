function Invoke-ExecNewJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Jobs'

    $JobData = $Request.Body.JobData
    $JobName = $Request.Body.JobName
    $Status  = $Request.Body.Status
    $User    = $Request.Body.User
    $Severity = $Request.Body.Severity
    $AppId   = $Request.Body.AppId
    $IP      = $Request.Body.IP

    $Entity = [PSCustomObject]@{
        PartitionKey = 'Job'
        RowKey       = [guid]::NewGuid().ToString()
        JobName      = $JobName
        Status       = $Status
        Username     = $User
        Severity     = $Severity
        JobData      = $JobData
        AppId        = $AppId
        IP           = $IP
    }

    Add-AzDataTableEntity @Table -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = $Entity
    }
}
