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
        try {
            if ($null -eq $SingleEnt.PartitionKey -or $null -eq $SingleEnt.RowKey) {
                throw 'PartitionKey or RowKey is null'
            }

            Write-Host "=== ADD ENTITY DEBUG: Attempting to add entity ==="
            Write-Host "PartitionKey: $($SingleEnt.PartitionKey), RowKey: $($SingleEnt.RowKey)"
            
            # Log all property sizes
            $totalEntitySize = 0
            if ($SingleEnt -is [System.Collections.Hashtable]) {
                foreach ($key in $SingleEnt.Keys) {
                    if ($SingleEnt[$key] -ne $null) {
                        $propSize = [System.Text.Encoding]::UTF8.GetByteCount($SingleEnt[$key].ToString())
                        $totalEntitySize += $propSize
                        if ($propSize -gt 10000) {  # Log large properties (> 10KB)
                            Write-Host "  Property '$key' size: $propSize bytes"
                            if ($key -like "*DesignData*" -or $key -like "*Data*") {
                                $valueStr = $SingleEnt[$key].ToString()
                                Write-Host "    Starts with: $($valueStr.Substring(0, [Math]::Min(100, $valueStr.Length)))"
                            }
                        }
                    }
                }
            }
            Write-Host "Total entity size before processing: $totalEntitySize bytes"

            Add-AzDataTableEntity @Parameters -Entity $SingleEnt -ErrorAction Stop
            
            Write-Host "=== ADD ENTITY DEBUG: Entity added successfully without splitting ==="

        } catch [System.Exception] {
            if ($_.Exception.ErrorCode -in @('PropertyValueTooLarge', 'EntityTooLarge', 'RequestBodyTooLarge')) {
                try {
                    Write-Host '=== ADD ENTITY DEBUG: Entity is too large. Starting split process ==='
                    Write-Host "Error code: $($_.Exception.ErrorCode)"

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
                        Write-Host "Found $($largePropertyNames.Count) large properties that need splitting:"
                        foreach ($propName in $largePropertyNames) {
                            Write-Host "  - $propName"
                        }
                        
                        $splitInfoList = [System.Collections.Generic.List[object]]::new()
                        foreach ($largePropertyName in $largePropertyNames) {
                            $dataString = $SingleEnt[$largePropertyName]
                            $splitCount = [math]::Ceiling($dataString.Length / $MaxSize)
                            
                            Write-Host "Splitting property '$largePropertyName':"
                            Write-Host "  Original size: $($dataString.Length) bytes"
                            Write-Host "  Split into: $splitCount parts"
                            Write-Host "  Max size per part: $MaxSize bytes"
                            
                            $splitData = [System.Collections.Generic.List[object]]::new()
                            for ($i = 0; $i -lt $splitCount; $i++) {
                                $start = $i * $MaxSize
                                $length = [Math]::Min($MaxSize, $dataString.Length - $start)
                                $chunk = $dataString.Substring($start, $length)
                                $splitData.Add($chunk) > $null
                                
                                Write-Host "  Part $i - Length: $($chunk.Length), Start: $start"
                                if ($largePropertyName -like "*DesignData*" -or $largePropertyName -like "*Data*") {
                                    Write-Host "    Starts with: $($chunk.Substring(0, [Math]::Min(50, $chunk.Length)))"
                                    Write-Host "    Ends with: $($chunk.Substring([Math]::Max(0, $chunk.Length - 50), [Math]::Min(50, $chunk.Length)))"
                                }
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
                            
                            Write-Host "Property '$largePropertyName' replaced with $splitDataCount parts"
                        }
                        $SingleEnt['SplitOverProps'] = ($splitInfoList | ConvertTo-Json -Compress).ToString()
                        Write-Host "SplitOverProps metadata added to entity"
                    }

                    $entitySize = [System.Text.Encoding]::UTF8.GetByteCount($($SingleEnt | ConvertTo-Json -Compress))
                    Write-Host "Entity size after splitting properties: $entitySize bytes (MaxRowSize: $MaxRowSize)"
                    
                    if ($entitySize -gt $MaxRowSize) {
                        Write-Host "=== ADD ENTITY DEBUG: Entity still too large, splitting into multiple rows ==="
                        $rows = [System.Collections.Generic.List[object]]::new()
                        $originalPartitionKey = $SingleEnt.PartitionKey
                        $originalRowKey = $SingleEnt.RowKey
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
                            Write-Host "Adding row part: $($row.RowKey), PartIndex: $($row.PartIndex)"
                            $NewRow = ([PSCustomObject]$row) | Select-Object * -ExcludeProperty Timestamp
                            Add-AzDataTableEntity @Parameters -Entity $NewRow
                            Write-Host "Row part $($row.RowKey) added successfully"
                        }
                        
                        Write-Host "=== ADD ENTITY DEBUG: All row parts added successfully ==="

                    } else {
                        Write-Host "=== ADD ENTITY DEBUG: Entity fits in single row after property splitting ==="
                        $NewEnt = ([PSCustomObject]$SingleEnt) | Select-Object * -ExcludeProperty Timestamp
                        Add-AzDataTableEntity @Parameters -Entity $NewEnt
                        Write-Host "Entity added successfully"
                        
                        if ($NewEnt.PSObject.Properties['OriginalEntityId'] -eq $null -and $NewEnt.PSObject.Properties['PartIndex'] -eq $null) {
                            $partIndex = 1
                            while ($true) {
                                $partRowKey = "$($NewEnt.RowKey)-part$partIndex"
                                try {
                                    Remove-AzDataTableEntity -Context $Context -PartitionKey $NewEnt.PartitionKey -RowKey $partRowKey -ErrorAction Stop
                                    Write-Information "Deleted obsolete part: $partRowKey"
                                    $partIndex++
                                } catch {
                                    break
                                }
                            }
                        }
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
    }
}
