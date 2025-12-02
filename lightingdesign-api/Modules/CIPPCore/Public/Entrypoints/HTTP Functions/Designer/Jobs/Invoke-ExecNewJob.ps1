function Invoke-ExecNewJob {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Jobs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    # Helper function to extract value from autocomplete objects/arrays
    function Get-AutoCompleteValue {
        param($InputObject)

        if ($null -eq $InputObject) {
            return $null
        }

        if ($InputObject -is [Array] -and $InputObject.Count -eq 0) {
            return $null
        }

        if ($InputObject -is [Array] -and $InputObject.Count -gt 0) {
            if ($InputObject[0].value) {
                return $InputObject[0].value
            }
            return $InputObject[0]
        }

        if ($InputObject.value) {
            return $InputObject.value
        }

        return $InputObject
    }

    # Helper function to extract array of values from autocomplete multi-select
    function Get-AutoCompleteArrayValues {
        param($InputArray)

        if ($null -eq $InputArray -or $InputArray.Count -eq 0) {
            return @()
        }

        return @($InputArray | ForEach-Object {
            if ($_.value) {
                $_.value
            } else {
                $_
            }
        })
    }

    # Helper function to convert empty strings to null
    function ConvertTo-NullIfEmpty {
        param($Value)

        if ([string]::IsNullOrWhiteSpace($Value)) {
            return $null
        }
        return $Value
    }

    try {
        # Validate request body exists
        if (-not $Request.Body) {
            throw "Request body is null or empty"
        }

        # Extract storeId early for validation
        $StoreId = Get-AutoCompleteValue -InputObject $Request.Body.storeId

        # Validate that storeId is provided
        if ([string]::IsNullOrWhiteSpace($StoreId)) {
            throw "Store ID is required"
        }

        # Validate user has access to this store
        $null = Test-CIPPAccess -Request $Request -StoreId $StoreId

        $Table = Get-CIPPTable -TableName 'Jobs'

        # Extract simple text fields (convert empty strings to null)
        $JobName          = ConvertTo-NullIfEmpty -Value $Request.Body.jobName
        $Description      = ConvertTo-NullIfEmpty -Value $Request.Body.description
        $Address          = ConvertTo-NullIfEmpty -Value $Request.Body.address
        $City             = ConvertTo-NullIfEmpty -Value $Request.Body.city
        $State            = ConvertTo-NullIfEmpty -Value $Request.Body.state
        $PostalCode       = ConvertTo-NullIfEmpty -Value $Request.Body.postalCode
        $ContactName      = ConvertTo-NullIfEmpty -Value $Request.Body.contactName
        $ContactPhone     = ConvertTo-NullIfEmpty -Value $Request.Body.contactPhone
        $ContactEmail     = ConvertTo-NullIfEmpty -Value $Request.Body.contactEmail
        $EstimatedValue   = ConvertTo-NullIfEmpty -Value $Request.Body.estimatedValue
        $Notes            = ConvertTo-NullIfEmpty -Value $Request.Body.notes

        # Extract autocomplete fields - store only the VALUE
        $CustomerId       = Get-AutoCompleteValue -InputObject $Request.Body.customerId
        $Status           = Get-AutoCompleteValue -InputObject $Request.Body.status
        $AssignedDesigner = Get-AutoCompleteValue -InputObject $Request.Body.assignedDesigner

        # Validate required fields
        if ([string]::IsNullOrWhiteSpace($JobName)) {
            throw "Job Name is required"
        }

        if ([string]::IsNullOrWhiteSpace($CustomerId)) {
            throw "Customer is required"
        }

        if ([string]::IsNullOrWhiteSpace($Status)) {
            throw "Status is required"
        }

        # Multi-select autocomplete fields - store array of VALUES only
        $RelatedTrades    = Get-AutoCompleteArrayValues -InputArray $Request.Body.relatedTrades
        $Builders         = Get-AutoCompleteArrayValues -InputArray $Request.Body.builders

        # Handle nested pricing matrix - only include if it has any non-empty values
        $PricingMatrix = $null
        if ($Request.Body.pricingMatrix) {
            $hasValues = $false
            $cleanedMatrix = @{}

            foreach ($key in $Request.Body.pricingMatrix.PSObject.Properties.Name) {
                $value = ConvertTo-NullIfEmpty -Value $Request.Body.pricingMatrix.$key
                if ($null -ne $value) {
                    $cleanedMatrix[$key] = $value
                    $hasValues = $true
                }
            }

            if ($hasValues) {
                $PricingMatrix = $cleanedMatrix
            }
        }

        $NewJobId = [guid]::NewGuid().ToString()

        $Entity = @{
            PartitionKey     = 'Job'
            RowKey           = $NewJobId
            JobName          = $JobName
            CustomerId       = $CustomerId
            StoreId          = $StoreId
            Status           = $Status
        }

        # Only add non-null optional properties
        if ($Description) { $Entity['Description'] = $Description }
        if ($Address) { $Entity['Address'] = $Address }
        if ($City) { $Entity['City'] = $City }
        if ($State) { $Entity['State'] = $State }
        if ($PostalCode) { $Entity['PostalCode'] = $PostalCode }
        if ($ContactName) { $Entity['ContactName'] = $ContactName }
        if ($ContactPhone) { $Entity['ContactPhone'] = $ContactPhone }
        if ($ContactEmail) { $Entity['ContactEmail'] = $ContactEmail }
        if ($EstimatedValue) { $Entity['EstimatedValue'] = $EstimatedValue }
        if ($Notes) { $Entity['Notes'] = $Notes }
        if ($AssignedDesigner) { $Entity['AssignedDesigner'] = $AssignedDesigner }

        if ($RelatedTrades -and $RelatedTrades.Count -gt 0) {
            $Entity['RelatedTrades'] = ($RelatedTrades | ConvertTo-Json -Compress -Depth 5)
        }

        if ($Builders -and $Builders.Count -gt 0) {
            $Entity['Builders'] = ($Builders | ConvertTo-Json -Compress -Depth 5)
        }

        if ($PricingMatrix) {
            $Entity['PricingMatrix'] = ($PricingMatrix | ConvertTo-Json -Compress -Depth 5)
        }

        Write-Host "DEBUG: About to add entity. Table is null: $($null -eq $Table). Entity keys: $($Entity.Keys.Count)"

        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

        Write-LogMessage -API 'NewJob' -message "Job created successfully: JobId: $NewJobId, JobName: $JobName" -Sev 'Info' -headers $Request.Headers

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::Created
            Body       = @{
                Results = 'Job created successfully'
                JobId   = $NewJobId
                RowKey  = $NewJobId
            }
        }
    }
    catch {
        Write-Host "ERROR CAUGHT: $($_.Exception.Message)"
        Write-Error "Error creating job: $_"
        Write-LogMessage -API 'NewJob' -message "Failed to create job: $($_.Exception.Message)" -Sev 'Error' -headers $Request.Headers -LogData $_
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                Results = "Error creating job: $($_.Exception.Message)"
                Error   = $_.Exception.Message
            }
        }
    }
}
