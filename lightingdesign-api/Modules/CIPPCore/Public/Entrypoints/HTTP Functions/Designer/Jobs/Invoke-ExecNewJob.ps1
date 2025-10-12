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

    # Support both old and new formats
    $JobNumber      = $Request.Body.jobNumber
    $CustomerId     = $Request.Body.customerId
    $Status         = if ($Request.Body.status) { $Request.Body.status } else { $Request.Body.Status }
    $Description    = $Request.Body.description
    $Address        = $Request.Body.address
    $City           = $Request.Body.city
    $State          = $Request.Body.state
    $PostalCode     = $Request.Body.postalCode
    $ContactName    = $Request.Body.contactName
    $ContactPhone   = $Request.Body.contactPhone
    $ContactEmail   = $Request.Body.contactEmail
    $EstimatedValue = $Request.Body.estimatedValue
    $Notes          = $Request.Body.notes
    
    # Legacy fields
    $JobData        = $Request.Body.JobData
    $JobName        = if ($Request.Body.JobName) { $Request.Body.JobName } else { $JobNumber }
    $User           = if ($Request.Body.User) { $Request.Body.User } else { 'System' }
    $Severity       = $Request.Body.Severity
    $AppId          = $Request.Body.AppId
    $IP             = $Request.Body.IP

    $NewJobId = [guid]::NewGuid().ToString()

    $Entity = [PSCustomObject]@{
        PartitionKey   = 'Job'
        RowKey         = $NewJobId
        JobNumber      = $JobNumber
        JobName        = $JobName
        CustomerId     = $CustomerId
        Status         = $Status
        Description    = $Description
        Address        = $Address
        City           = $City
        State          = $State
        PostalCode     = $PostalCode
        ContactName    = $ContactName
        ContactPhone   = $ContactPhone
        ContactEmail   = $ContactEmail
        EstimatedValue = $EstimatedValue
        Notes          = $Notes
        Username       = $User
        Severity       = $Severity
        JobData        = $JobData
        AppId          = $AppId
        IP             = $IP
    }

    Add-AzDataTableEntity @Table -Entity $Entity -Force

    return [HttpResponseContext]@{
        StatusCode = [System.Net.HttpStatusCode]::Created
        Body       = @{ 
            Results = 'Job created successfully'
            JobId = $NewJobId
            RowKey = $NewJobId
        }
    }
}
