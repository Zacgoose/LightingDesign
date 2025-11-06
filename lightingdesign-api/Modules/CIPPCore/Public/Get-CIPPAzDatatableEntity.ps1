function Get-CIPPAzDataTableEntity {
    [CmdletBinding()]
    param(
        $Context,
        $Filter,
        $Property,
        $First,
        $Skip,
        $Sort,
        $Count
    )

    $Results = Get-AzDataTableEntity @PSBoundParameters
    $mergedResults = @{}
    $rootEntities = @{} # Keyed by "$PartitionKey|$RowKey"

    foreach ($entity in $Results) {
        $partitionKey = $entity.PartitionKey
        $rowKey = $entity.RowKey
        $hasOriginalId = $entity.PSObject.Properties.Match('OriginalEntityId') -and $entity.OriginalEntityId
        
        # Check if this is the base entity (RowKey matches OriginalEntityId) or a standalone entity
        $isBaseEntity = (-not $hasOriginalId) -or ($hasOriginalId -and $rowKey -eq $entity.OriginalEntityId)

        if (-not $mergedResults.ContainsKey($partitionKey)) {
            $mergedResults[$partitionKey] = @{}
        }

        if ($isBaseEntity) {
            # It's a standalone root row or the base part of a split entity
            $entityIdKey = if ($hasOriginalId) { $entity.OriginalEntityId } else { $rowKey }
            $rootEntities["$partitionKey|$entityIdKey"] = $true
            
            if (-not $mergedResults[$partitionKey].ContainsKey($entityIdKey)) {
                $mergedResults[$partitionKey][$entityIdKey] = @{
                    Entity = $entity
                    Parts  = [System.Collections.Generic.List[object]]::new()
                }
            } else {
                # Base entity found after parts - set it as the Entity
                $mergedResults[$partitionKey][$entityIdKey]['Entity'] = $entity
            }
            continue
        }

        # It's a part of something else
        $entityId = $entity.OriginalEntityId

        # Merge it as a part
        if (-not $mergedResults[$partitionKey].ContainsKey($entityId)) {
            $mergedResults[$partitionKey][$entityId] = @{
                Entity = $null
                Parts = [System.Collections.Generic.List[object]]::new()
            }
        }
        $mergedResults[$partitionKey][$entityId]['Parts'].Add($entity)
    }

    $finalResults = [System.Collections.Generic.List[object]]::new()
    foreach ($partitionKey in $mergedResults.Keys) {
        foreach ($entityId in $mergedResults[$partitionKey].Keys) {
            $entityData = $mergedResults[$partitionKey][$entityId]
            
            # Check if we have parts to merge
            if (($entityData.Parts | Measure-Object).Count -gt 0) {
                # Start with the base entity if it exists, otherwise create empty object
                if ($null -ne $entityData.Entity) {
                    $fullEntity = $entityData.Entity | Select-Object * -ExcludeProperty OriginalEntityId, PartIndex
                } else {
                    $fullEntity = [PSCustomObject]@{}
                }
                
                # Merge additional parts
                $parts = $entityData.Parts | Sort-Object PartIndex
                foreach ($part in $parts) {
                    foreach ($key in $part.PSObject.Properties.Name) {
                        if ($key -notin @('OriginalEntityId', 'PartIndex', 'PartitionKey', 'RowKey', 'Timestamp', 'SplitOverProps')) {
                            if ($fullEntity.PSObject.Properties[$key]) {
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value ($fullEntity.$key + $part.$key) -Force
                            } else {
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value $part.$key
                            }
                        }
                    }
                }
                
                # Ensure we have the correct metadata
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'PartitionKey' -Value $partitionKey -Force
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'RowKey' -Value $entityId -Force
                if ($null -ne $entityData.Entity) {
                    $fullEntity | Add-Member -MemberType NoteProperty -Name 'Timestamp' -Value $entityData.Entity.Timestamp -Force
                } else {
                    $fullEntity | Add-Member -MemberType NoteProperty -Name 'Timestamp' -Value $parts[0].Timestamp -Force
                }
                $finalResults.Add($fullEntity)
            } else {
                # No parts, just return the entity as-is
                $FinalResults.Add($entityData.Entity)
            }
        }
    }

    foreach ($entity in $finalResults) {
        if ($entity.SplitOverProps) {
            $splitInfoList = $entity.SplitOverProps | ConvertFrom-Json
            foreach ($splitInfo in $splitInfoList) {
                $mergedData = [string]::Join('', ($splitInfo.SplitHeaders | ForEach-Object { $entity.$_ }))
                $entity | Add-Member -NotePropertyName $splitInfo.OriginalHeader -NotePropertyValue $mergedData -Force
                $propsToRemove = $splitInfo.SplitHeaders
                foreach ($prop in $propsToRemove) {
                    $entity.PSObject.Properties.Remove($prop)
                }
            }
            $entity.PSObject.Properties.Remove('SplitOverProps')
        }
    }

    return $finalResults
}
