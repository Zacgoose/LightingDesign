function Invoke-ExecStoreGroup {
    <#
    .SYNOPSIS
        Exec endpoint for managing store groups
    .FUNCTIONALITY
        Entrypoint,AnyStore
    .ROLE
        CIPP.Core.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CippTable -tablename 'StoreGroups'
    $Action = $Request.Query.Action ?? $Request.Body.Action

    switch ($Action) {
        'AddEdit' {
            try {
                $GroupId = if ($Request.Body.groupId) { $Request.Body.groupId } else { [guid]::NewGuid().ToString() }
                
                $StoreGroup = @{
                    'PartitionKey'     = 'StoreGroups'
                    'RowKey'           = $GroupId
                    'groupName'        = $Request.Body.groupName
                    'groupDescription' = $Request.Body.groupDescription ?? ''
                    'members'          = "$($Request.Body.members | ConvertTo-Json -Compress)"
                }
                
                Add-CIPPAzDataTableEntity @Table -Entity $StoreGroup -Force | Out-Null
                $Body = @{Results = "Store group '$($Request.Body.groupName)' saved successfully" }
                Write-LogMessage -headers $Request.Headers -API 'ExecStoreGroup' -message "Saved store group $($Request.Body.groupName)" -Sev 'Info'
            } catch {
                Write-Warning "Failed to save store group $($Request.Body.groupName): $($_.Exception.Message)"
                Write-Warning $_.InvocationInfo.PositionMessage
                $Body = @{Results = "Failed to save store group $($Request.Body.groupName)" }
            }
        }
        'Delete' {
            try {
                Write-Information "Deleting store group $($Request.Body.groupId)"
                $Group = Get-CIPPAzDataTableEntity @Table -Filter "RowKey eq '$($Request.Body.groupId)'" -Property RowKey, PartitionKey
                Remove-AzDataTableEntity -Force @Table -Entity $Group
                $Body = @{Results = 'Store group deleted successfully' }
                Write-LogMessage -headers $Request.Headers -API 'ExecStoreGroup' -message "Deleted store group $($Request.Body.groupId)" -Sev 'Info'
            } catch {
                Write-Warning "Failed to delete store group: $($_.Exception.Message)"
                $Body = @{Results = "Failed to delete store group" }
            }
        }
        default {
            $AllGroups = Get-CIPPAzDataTableEntity @Table
            if (!$AllGroups) {
                $Body = @()
            } else {
                $StoreGroups = foreach ($Group in $AllGroups) {
                    if ($Group.members) {
                        try {
                            $Group.members = @($Group.members | ConvertFrom-Json)
                        } catch {
                            $Group.members = @()
                        }
                    } else {
                        $Group | Add-Member -NotePropertyName members -NotePropertyValue @() -Force
                    }
                    $Group
                }
                $Body = @($StoreGroups)
            }
        }
    }

    return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::OK
            Body       = $Body
        })
}
