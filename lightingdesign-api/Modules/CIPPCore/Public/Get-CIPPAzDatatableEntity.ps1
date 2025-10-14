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

    Write-Host "=== GET ENTITY DEBUG START ==="
    Write-Host "Filter: $Filter"

    $Results = Get-AzDataTableEntity @PSBoundParameters
    
    Write-Host "Retrieved $($Results.Count) raw entities from table"
    
    $mergedResults = @{}
    $rootEntities = @{} # Keyed by "$PartitionKey|$RowKey"

    foreach ($entity in $Results) {
        $partitionKey = $entity.PartitionKey
        $rowKey = $entity.RowKey
        $hasOriginalId = $entity.PSObject.Properties.Match('OriginalEntityId') -and $entity.OriginalEntityId

        Write-Host "Processing entity: PK=$partitionKey, RK=$rowKey, HasOriginalId=$hasOriginalId"
        if ($hasOriginalId) {
            Write-Host "  OriginalEntityId: $($entity.OriginalEntityId), PartIndex: $($entity.PartIndex)"
        }

        if (-not $mergedResults.ContainsKey($partitionKey)) {
            $mergedResults[$partitionKey] = @{}
        }

        if (-not $hasOriginalId) {
            # It's a standalone root row
            Write-Host "  -> Root entity"
            $rootEntities["$partitionKey|$rowKey"] = $true
            $mergedResults[$partitionKey][$rowKey] = @{
                Entity = $entity
                Parts  = [System.Collections.Generic.List[object]]::new()
            }
            continue
        }

        # It's a part of something else
        $entityId = $entity.OriginalEntityId

        Write-Host "  -> Part entity, OriginalEntityId=$entityId"

        # Check if this entity's target has a "real" base
        if ($rootEntities.ContainsKey("$partitionKey|$entityId")) {
            # Root row exists → skip merging this part
            Write-Host "  -> Skipping merge (root exists)"
            continue
        }

        # Merge it as a part
        Write-Host "  -> Adding to merge list"
        if (-not $mergedResults[$partitionKey].ContainsKey($entityId)) {
            $mergedResults[$partitionKey][$entityId] = @{
                Parts = [System.Collections.Generic.List[object]]::new()
            }
        }
        $mergedResults[$partitionKey][$entityId]['Parts'].Add($entity)
    }

    Write-Host "Building final results from merged data"
    $finalResults = [System.Collections.Generic.List[object]]::new()
    foreach ($partitionKey in $mergedResults.Keys) {
        foreach ($entityId in $mergedResults[$partitionKey].Keys) {
            $entityData = $mergedResults[$partitionKey][$entityId]
            $partsCount = ($entityData.Parts | Measure-Object).Count
            
            Write-Host "Processing merged entity: $entityId, Parts: $partsCount"
            
            if ($partsCount -gt 0) {
                $fullEntity = [PSCustomObject]@{}
                $parts = $entityData.Parts | Sort-Object PartIndex
                
                Write-Host "Merging $($parts.Count) parts in order"
                
                foreach ($part in $parts) {
                    foreach ($key in $part.PSObject.Properties.Name) {
                        if ($key -notin @('OriginalEntityId', 'PartIndex', 'PartitionKey', 'RowKey', 'Timestamp')) {
                            if ($fullEntity.PSObject.Properties[$key]) {
                                # Concatenating parts
                                $oldLength = $fullEntity.$key.Length
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value ($fullEntity.$key + $part.$key) -Force
                                Write-Host "  Concatenated '$key': $oldLength + $($part.$key.Length) = $($fullEntity.$key.Length)"
                            } else {
                                $fullEntity | Add-Member -MemberType NoteProperty -Name $key -Value $part.$key
                                Write-Host "  Added property '$key': Length=$($part.$key.Length)"
                            }
                        }
                    }
                }
                Write-Host "Parts merged successfully"
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'PartitionKey' -Value $parts[0].PartitionKey -Force
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'RowKey' -Value $entityId -Force
                $fullEntity | Add-Member -MemberType NoteProperty -Name 'Timestamp' -Value $parts[0].Timestamp -Force
                $finalResults.Add($fullEntity)
            } else {
                $FinalResults.Add($entityData.Entity)
            }
        }
    }

    Write-Host "Processing SplitOverProps for reassembly"
    foreach ($entity in $finalResults) {
        if ($entity.SplitOverProps) {
            Write-Host "Entity has SplitOverProps, reassembling split properties"
            $splitInfoList = $entity.SplitOverProps | ConvertFrom-Json
            Write-Host "Found $($splitInfoList.Count) split properties to reassemble"
            
            foreach ($splitInfo in $splitInfoList) {
                Write-Host "  Reassembling property: $($splitInfo.OriginalHeader)"
                Write-Host "    From parts: $($splitInfo.SplitHeaders -join ', ')"
                
                # Collect parts
                $parts = @()
                foreach ($headerName in $splitInfo.SplitHeaders) {
                    $partValue = $entity.$headerName
                    if ($partValue) {
                        $parts += $partValue
                        Write-Host "    Part '$headerName': Length=$($partValue.Length)"
                    } else {
                        Write-Host "    WARNING: Part '$headerName' is null or missing!"
                    }
                }
                
                $mergedData = [string]::Join('', $parts)
                Write-Host "    Merged length: $($mergedData.Length)"
                if ($splitInfo.OriginalHeader -like "*DesignData*" -or $splitInfo.OriginalHeader -like "*Data*") {
                    Write-Host "    Merged starts with: $($mergedData.Substring(0, [Math]::Min(100, $mergedData.Length)))"
                    Write-Host "    Merged ends with: $($mergedData.Substring([Math]::Max(0, $mergedData.Length - 100), [Math]::Min(100, $mergedData.Length)))"
                }
                
                $entity | Add-Member -NotePropertyName $splitInfo.OriginalHeader -NotePropertyValue $mergedData -Force
                $propsToRemove = $splitInfo.SplitHeaders
                foreach ($prop in $propsToRemove) {
                    $entity.PSObject.Properties.Remove($prop)
                }
                Write-Host "    Removed part properties, kept merged property"
            }
            $entity.PSObject.Properties.Remove('SplitOverProps')
            Write-Host "  SplitOverProps metadata removed"
        }
    }

    Write-Host "=== GET ENTITY DEBUG END: Returning $($finalResults.Count) entities ==="

    return $finalResults
}
