function Add-CIPPAzDataTableEntity {
    [CmdletBinding(DefaultParameterSetName = 'OperationType')]
    param(
        $Context,
        $Entity,
        [switch]$CreateTableIfNotExists,

        [Parameter(ParameterSetName = 'Force')]
        [switch]$Force,

        [Parameter(ParameterSetName = 'OperationType')]
        [ValidateSet('Add', 'UpsertMerge', 'UpsertReplace')]
        [string]$OperationType = 'Add'
    )

    $Parameters = @{
        Context                = $Context
        CreateTableIfNotExists = $CreateTableIfNotExists
    }
    if ($PSCmdlet.ParameterSetName -eq 'Force') {
        $Parameters.Force = $Force
    } else {
        $Parameters.OperationType = $OperationType
    }

    $MaxRowSize = 500000 - 100
    $MaxSize = 30kb

    foreach ($SingleEnt in @($Entity)) {
        # Track RowKeys we're about to create for cleanup later
        $newRowKeysCreated = [System.Collections.Generic.List[string]]::new()
        $originalPartitionKey = if ($SingleEnt -is [hashtable]) { $SingleEnt.PartitionKey } else { $SingleEnt.PartitionKey }
        $originalRowKey = if ($SingleEnt -is [hashtable]) { $SingleEnt.RowKey } else { $SingleEnt.RowKey }

        try {
            if ($null -eq $SingleEnt.PartitionKey -or $null -eq $SingleEnt.RowKey) {
                throw 'PartitionKey or RowKey is null'
            }

            Add-AzDataTableEntity @Parameters -Entity $SingleEnt -ErrorAction Stop
            $newRowKeysCreated.Add($originalRowKey)

        } catch [System.Exception] {
            if ($_.Exception.ErrorCode -in @('PropertyValueTooLarge', 'EntityTooLarge', 'RequestBodyTooLarge')) {
                try {
                    Write-Host 'Entity is too large. Splitting entity into multiple parts.'

                    $largePropertyNames = [System.Collections.Generic.List[string]]::new()
                    $entitySize = 0

                    if ($SingleEnt -is [System.Management.Automation.PSCustomObject]) {
                        $SingleEnt = $SingleEnt | ConvertTo-Json -Depth 100 -Compress | ConvertFrom-Json -AsHashtable
                    }

                    foreach ($key in $SingleEnt.Keys) {
                        $propertySize = [System.Text.Encoding]::UTF8.GetByteCount($SingleEnt[$key].ToString())
                        $entitySize += $propertySize
                        if ($propertySize -gt $MaxSize) {
                            $largePropertyNames.Add($key)
                        }
                    }

                    if (($largePropertyNames | Measure-Object).Count -gt 0) {
                        $splitInfoList = [System.Collections.Generic.List[object]]::new()
                        foreach ($largePropertyName in $largePropertyNames) {
                            $dataString = $SingleEnt[$largePropertyName]
                            $splitCount = [math]::Ceiling($dataString.Length / $MaxSize)
                            $splitData = [System.Collections.Generic.List[object]]::new()
                            for ($i = 0; $i -lt $splitCount; $i++) {
                                $start = $i * $MaxSize
                                $splitData.Add($dataString.Substring($start, [Math]::Min($MaxSize, $dataString.Length - $start))) > $null
                            }
                            $splitDataCount = $splitData.Count
                            $splitPropertyNames = [System.Collections.Generic.List[object]]::new()
                            for ($i = 0; $i -lt $splitDataCount; $i++) {
                                $splitPropertyNames.Add("${largePropertyName}_Part$i")
                            }

                            $splitInfo = @{
                                OriginalHeader = $largePropertyName
                                SplitHeaders   = $splitPropertyNames
                            }
                            $splitInfoList.Add($splitInfo)
                            $SingleEnt.Remove($largePropertyName)

                            for ($i = 0; $i -lt $splitDataCount; $i++) {
                                $SingleEnt[$splitPropertyNames[$i]] = $splitData[$i]
                            }
                        }
                        $SingleEnt['SplitOverProps'] = ($splitInfoList | ConvertTo-Json -Compress).ToString()
                    }

                    $entitySize = [System.Text.Encoding]::UTF8.GetByteCount($($SingleEnt | ConvertTo-Json -Compress))
                    if ($entitySize -gt $MaxRowSize) {
                        $rows = [System.Collections.Generic.List[object]]::new()
                        $entityIndex = 0

                        while ($entitySize -gt $MaxRowSize) {
                            Write-Information "Entity size is $entitySize. Splitting entity into multiple parts."
                            $newEntity = @{}
                            $newEntity['PartitionKey'] = $originalPartitionKey
                            $newEntity['RowKey'] = if ($entityIndex -eq 0) { $originalRowKey } else { "$($originalRowKey)-part$entityIndex" }
                            $newEntity['OriginalEntityId'] = $originalRowKey
                            $newEntity['PartIndex'] = $entityIndex
                            $entityIndex++

                            $propertiesToRemove = [System.Collections.Generic.List[object]]::new()
                            foreach ($key in $SingleEnt.Keys) {
                                if ($key -in @('RowKey', 'PartitionKey')) { continue }
                                $newEntitySize = [System.Text.Encoding]::UTF8.GetByteCount($($newEntity | ConvertTo-Json -Compress))
                                if ($newEntitySize -lt $MaxRowSize) {
                                    $propertySize = [System.Text.Encoding]::UTF8.GetByteCount($SingleEnt[$key].ToString())
                                    if ($propertySize -gt $MaxRowSize) {
                                        $dataString = $SingleEnt[$key]
                                        $splitCount = [math]::Ceiling($dataString.Length / $MaxSize)
                                        $splitData = [System.Collections.Generic.List[object]]::new()
                                        for ($i = 0; $i -lt $splitCount; $i++) {
                                            $start = $i * $MaxSize
                                            $splitData.Add($dataString.Substring($start, [Math]::Min($MaxSize, $dataString.Length - $start))) > $null
                                        }

                                        $splitPropertyNames = [System.Collections.Generic.List[object]]::new()
                                        for ($i = 0; $i -lt $splitData.Count; $i++) {
                                            $splitPropertyNames.Add("${key}_Part$i")
                                        }

                                        for ($i = 0; $i -lt $splitData.Count; $i++) {
                                            $newEntity[$splitPropertyNames[$i]] = $splitData[$i]
                                        }
                                    } else {
                                        $newEntity[$key] = $SingleEnt[$key]
                                    }
                                    $propertiesToRemove.Add($key)
                                }
                            }

                            foreach ($prop in $propertiesToRemove) {
                                $SingleEnt.Remove($prop)
                            }

                            $rows.Add($newEntity)
                            $entitySize = [System.Text.Encoding]::UTF8.GetByteCount($($SingleEnt | ConvertTo-Json -Compress))
                        }

                        if ($SingleEnt.Count -gt 0) {
                            $SingleEnt['RowKey'] = "$($originalRowKey)-part$entityIndex"
                            $SingleEnt['OriginalEntityId'] = $originalRowKey
                            $SingleEnt['PartIndex'] = $entityIndex
                            $SingleEnt['PartitionKey'] = $originalPartitionKey
                            $rows.Add($SingleEnt)
                        }

                        foreach ($row in $rows) {
                            Write-Information "current entity is $($row.RowKey) with $($row.PartitionKey). Our size is $([System.Text.Encoding]::UTF8.GetByteCount($($row | ConvertTo-Json -Compress)))"
                            $NewRow = ([PSCustomObject]$row) | Select-Object * -ExcludeProperty Timestamp
                            Add-AzDataTableEntity @Parameters -Entity $NewRow
                            $newRowKeysCreated.Add($row.RowKey)
                        }

                    } else {
                        $NewEnt = ([PSCustomObject]$SingleEnt) | Select-Object * -ExcludeProperty Timestamp
                        Add-AzDataTableEntity @Parameters -Entity $NewEnt
                        $newRowKeysCreated.Add($originalRowKey)
                    }

                } catch {
                    $ErrorMessage = Get-NormalizedError -Message $_.Exception.Message
                    Write-Warning 'AzBobbyTables Error'
                    Write-Information ($SingleEnt | ConvertTo-Json)
                    throw "Error processing entity: $ErrorMessage Linenumber: $($_.InvocationInfo.ScriptLineNumber)"
                }
            } else {
                Write-Information "THE ERROR IS $($_.Exception.message). The size of the entity is $entitySize."
                throw $_
            }
        }

        # CLEANUP: After successful save, delete orphaned rows
        if (($PSCmdlet.ParameterSetName -eq 'Force' -or $OperationType -in @('UpsertMerge', 'UpsertReplace')) -and ($newRowKeysCreated.Count -gt 0)) {
            Write-Information "Cleaning up orphaned rows for PartitionKey: $originalPartitionKey"

            $Filter = "PartitionKey eq '$originalPartitionKey'"
            try {
                $ExistingEntities = Get-AzDataTableEntity -Context $Context -Filter $Filter

                if ($ExistingEntities) {
                    $deleteCount = 0
                    foreach ($existing in $ExistingEntities) {
                        # Check if this row is one we just created
                        $isNewRow = $newRowKeysCreated -contains $existing.RowKey

                        if (-not $isNewRow) {
                            try {
                                $EntityToDelete = @{
                                    PartitionKey = $existing.PartitionKey
                                    RowKey       = $existing.RowKey
                                }
                                Remove-AzDataTableEntity -Context $Context -Entity $EntityToDelete -Force
                                Write-Information "Deleted orphaned entity: RowKey=$($existing.RowKey)"
                                $deleteCount++
                            } catch {
                                Write-Warning "Failed to delete orphaned entity: RowKey=$($existing.RowKey). Error: $_"
                            }
                        }
                    }
                    if ($deleteCount -gt 0) {
                        Write-Information "Cleaned up $deleteCount orphaned row(s)"
                    }
                }
            } catch {
                Write-Warning "Failed to clean up orphaned rows: $_"
            }
        }
    }
}
