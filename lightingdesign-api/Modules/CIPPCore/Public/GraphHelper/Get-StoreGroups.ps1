function Get-StoreGroups {
    <#
    .FUNCTIONALITY
    Internal
    .SYNOPSIS
        Get store groups from the database
    .PARAMETER GroupId
        Optional group ID to filter by
    #>
    param(
        [string]$GroupId
    )

    $Table = Get-CippTable -tablename 'StoreGroups'
    
    if ($GroupId) {
        $Filter = "PartitionKey eq 'StoreGroups' and RowKey eq '$GroupId'"
        $Group = Get-CIPPAzDataTableEntity @Table -Filter $Filter
        
        if ($Group) {
            $GroupMembers = if ($Group.members) { $Group.members | ConvertFrom-Json } else { @() }
            return [PSCustomObject]@{
                RowKey           = $Group.RowKey
                groupId          = $Group.RowKey
                groupName        = $Group.groupName
                groupDescription = $Group.groupDescription
                members          = $GroupMembers
            }
        }
        return $null
    } else {
        $Filter = "PartitionKey eq 'StoreGroups'"
        $Groups = Get-CIPPAzDataTableEntity @Table -Filter $Filter
        
        return $Groups | ForEach-Object {
            $GroupMembers = if ($_.members) { $_.members | ConvertFrom-Json } else { @() }
            [PSCustomObject]@{
                RowKey           = $_.RowKey
                groupId          = $_.RowKey
                groupName        = $_.groupName
                groupDescription = $_.groupDescription
                members          = $GroupMembers
            }
        }
    }
}
