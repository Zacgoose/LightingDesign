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

        if (-not $mergedResults.ContainsKey($partitionKey)) {
            $mergedResults[$partitionKey] = @{}
        }

        if (-not $hasOriginalId) {
            # It's a standalone root row
            $rootEntities["$partitionKey|$rowKey"] = $true
            $mergedResults[$partitionKey][$rowKey] = @{
                Entity = $entity
                Parts  = [System.Collections.Generic.List[object]]::new()
            }
            continue
        }

        # It's a part of something else
        $entityId = $entity.OriginalEntityId

        # Check if this entity's target has a "real" base
        if ($rootEntities.ContainsKey("$partitionKey|$entityId")) {
            # Root row exists → skip merging this part
            continue
        }

        # Merge it as a part
        if (-not $mergedResults[$partitionKey].ContainsKey($entityId)) {
            $mergedResults[$partitionKey][$entityId] = @{
                Parts = [System.Collections.Generic.List[object]]::new()
            }
        }
        $mergedResults[$partitionKey][$entityId]['Parts'].Add($entity)
    }

    $finalResults = [System.Collections.Generic.List[object]]::new()
    foreach ($partitionKey in $mergedResults.Keys) {
        foreach ($entityId in $mergedResults[$partitionKey].Keys) {
            $entityData = $mergedResults[$partitionKey][$entityId]
            if (($entityData.Parts | Measure-Object).Count -gt 0) {
                Write-Information "Reassembling entity from $($entityData.Parts.Count) row parts"
                $fullEntity = [PSCustomObject]@{}
                $parts = $entityData.Parts | Sort-Object PartIndex
                foreach ($part in $parts) {
                    Write-Information "  Processing row part $($part.PartIndex)"
                    foreach ($key in $part.PSObject.Properties.Name) {
                        if ($key -notin @('OriginalEntityId', 'PartIndex', 'PartitionKey', 'RowKey', 'Timestamp')) {
                            if ($fullEntity.PSObject.Properties[$key]) {
                                $oldLength = $fullEntity.$key.Length
                                $newLength = $part.$key.Length
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value ($fullEntity.$key + $part.$key) -Force
                                Write-Information "    Concatenating $key : $oldLength + $newLength = $($fullEntity.$key.Length)"
                            } else {
                                Write-Information "    Adding $key : length = $($part.$key.Length)"
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value $part.$key
                            }
                        }
                    }
                }
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'PartitionKey' -Value $parts[0].PartitionKey -Force
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'RowKey' -Value $entityId -Force
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'Timestamp' -Value $parts[0].Timestamp -Force
                $finalResults.Add($fullEntity)
            } else {
                $FinalResults.Add($entityData.Entity)
            }
        }
    }

    foreach ($entity in $finalResults) {
        if ($entity.SplitOverProps) {
            $splitInfoList = $entity.SplitOverProps | ConvertFrom-Json
            foreach ($splitInfo in $splitInfoList) {
                Write-Information "Reassembling property: $($splitInfo.OriginalHeader) from $($splitInfo.SplitHeaders.Count) parts"
                $parts = @()
                foreach ($header in $splitInfo.SplitHeaders) {
                    $partValue = $entity.$header
                    if ($null -eq $partValue) {
                        Write-Warning "Missing part: $header for property $($splitInfo.OriginalHeader)"
                        $parts += ''
                    } else {
                        Write-Information "  $header : length = $($partValue.Length)"
                        $parts += $partValue
                    }
                }
                $mergedData = [string]::Join('', $parts)
                Write-Information "Reassembled $($splitInfo.OriginalHeader): total length = $($mergedData.Length)"
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
