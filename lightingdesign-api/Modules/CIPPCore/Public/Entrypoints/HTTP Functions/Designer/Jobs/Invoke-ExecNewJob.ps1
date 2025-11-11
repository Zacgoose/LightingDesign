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

        # Handle null or empty
        if ($null -eq $InputObject) {
            return $null
        }

        # Handle empty arrays
        if ($InputObject -is [Array] -and $InputObject.Count -eq 0) {
            return $null
        }

        # Handle array with objects (single-select autocomplete)
        if ($InputObject -is [Array] -and $InputObject.Count -gt 0) {
            # Get first item if it has a .value property
            if ($InputObject[0].value) {
                return $InputObject[0].value
            }
            return $InputObject[0]
        }

        # Handle single object with .value property
        if ($InputObject.value) {
            return $InputObject.value
        }

        # Return the object itself
        return $InputObject
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

        $Table = Get-CIPPTable -TableName 'Jobs'

        # Extract simple text fields (convert empty strings to null)
        $JobNumber        = ConvertTo-NullIfEmpty -Value $Request.Body.jobNumber
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

        # Extract autocomplete fields using helper (handles arrays and objects)
        $CustomerName     = Get-AutoCompleteValue -InputObject $Request.Body.customerName
        $Status           = Get-AutoCompleteValue -InputObject $Request.Body.status
        $AssignedDesigner = Get-AutoCompleteValue -InputObject $Request.Body.assignedDesigner

        # Multi-select autocomplete fields (arrays of objects) - convert empty arrays to null
        $RelatedTrades    = if ($Request.Body.relatedTrades -and $Request.Body.relatedTrades.Count -gt 0) {
            $Request.Body.relatedTrades
        } else {
            $null
        }

        $Builders         = if ($Request.Body.builders -and $Request.Body.builders.Count -gt 0) {
            $Request.Body.builders
        } else {
            $null
        }

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
                } else {
                    $cleanedMatrix[$key] = $null
                }
            }

            # Only set PricingMatrix if it has at least one non-null value
            if ($hasValues) {
                $PricingMatrix = $cleanedMatrix
            }
        }

        $NewJobId = [guid]::NewGuid().ToString()

        $Entity = @{
            PartitionKey     = 'Job'
            RowKey           = $NewJobId
            JobNumber        = $JobNumber
            CustomerId       = $CustomerName
            Status           = $Status
            Description      = $Description
            Address          = $Address
            City             = $City
            State            = $State
            PostalCode       = $PostalCode
            ContactName      = $ContactName
            ContactPhone     = $ContactPhone
            ContactEmail     = $ContactEmail
            EstimatedValue   = $EstimatedValue
            Notes            = $Notes
            RelatedTrades    = if ($RelatedTrades) { ($RelatedTrades | ConvertTo-Json -Compress -Depth 5) } else { $null }
            Builders         = if ($Builders) { ($Builders | ConvertTo-Json -Compress -Depth 5) } else { $null }
            AssignedDesigner = $AssignedDesigner
            PricingMatrix    = if ($PricingMatrix) { ($PricingMatrix | ConvertTo-Json -Compress -Depth 5) } else { $null }
        }

        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

        Write-LogMessage -API 'NewJob' -message "Job created successfully: JobId: $NewJobId, JobNumber: $JobNumber" -Sev 'Info' -headers $Request.Headers

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
