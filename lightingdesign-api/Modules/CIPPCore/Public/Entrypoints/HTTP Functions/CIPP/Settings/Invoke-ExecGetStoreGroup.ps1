function Invoke-ExecGetStoreGroup {
    <#
    .SYNOPSIS
        Get a single store group by ID
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $GroupId = $Request.Query.groupId ?? $Request.Body.groupId
    
    if (!$GroupId) {
        return ([HttpResponseContext]@{
                StatusCode = [HttpStatusCode]::BadRequest
                Body       = @{ error = 'groupId parameter is required' }
            })
    }

    try {
        $Group = Get-StoreGroups -GroupId $GroupId
        
        if ($Group) {
            $Body = $Group
        } else {
            $Body = @{ error = 'Store group not found' }
        }
    } catch {
        Write-Warning "Failed to get store group: $($_.Exception.Message)"
        $Body = @{ error = "Failed to get store group: $($_.Exception.Message)" }
    }

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
