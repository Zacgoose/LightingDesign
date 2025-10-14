function Invoke-ExecSaveDesign {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Designs.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $Table = Get-CIPPTable -TableName 'Designs'

    $JobId = $Request.Body.jobId
    $DesignData = $Request.Body.designData

    if (-not $JobId) {
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::BadRequest
            Body       = @{ error = 'jobId is required' }
        }
    }

    try {
        Write-Host "=== SAVE DESIGN DEBUG START ==="
        Write-Host "JobId: $JobId"
        Write-Host "DesignData type: $($DesignData.GetType().FullName)"
        Write-Host "DesignData has layers: $(if ($DesignData.layers) { 'Yes' } else { 'No' })"
        if ($DesignData.layers) {
            Write-Host "Number of layers: $($DesignData.layers.Count)"
            for ($i = 0; $i -lt $DesignData.layers.Count; $i++) {
                $layer = $DesignData.layers[$i]
                Write-Host "  Layer $i - Name: $($layer.name), HasBackground: $(if ($layer.backgroundImage) { 'Yes' } else { 'No' })"
                if ($layer.backgroundImage) {
                    Write-Host "    Background length: $($layer.backgroundImage.Length)"
                    Write-Host "    Background starts with: $($layer.backgroundImage.Substring(0, [Math]::Min(50, $layer.backgroundImage.Length)))"
                }
            }
        }

        # Check if design already exists for this job
        $Filter = "JobId eq '{0}'" -f $JobId
        $ExistingDesign = Get-CIPPAzDataTableEntity @Table -Filter $Filter

        # Convert design data to JSON
        $DesignDataJson = if ($DesignData) {
            $json = [string]($DesignData | ConvertTo-Json -Depth 20 -Compress)
            Write-Host "JSON created - length: $($json.Length) bytes"
            Write-Host "JSON starts with: $($json.Substring(0, [Math]::Min(100, $json.Length)))"
            Write-Host "JSON ends with: $($json.Substring([Math]::Max(0, $json.Length - 100), [Math]::Min(100, $json.Length)))"
            
            # Check if there are any background images in the JSON
            $backgroundImageMatches = [regex]::Matches($json, '"backgroundImage":\s*"([^"]{0,100})')
            Write-Host "Found $($backgroundImageMatches.Count) backgroundImage properties in JSON"
            foreach ($match in $backgroundImageMatches) {
                Write-Host "  Background starts with: $($match.Groups[1].Value)"
            }
            
            $json
        } else {
            $null
        }

        # Create or update design entity
        # Note: Add-CIPPAzDataTableEntity handles large properties automatically by splitting into chunks
        if ($ExistingDesign) {
            # Update existing design
            $Entity = @{
                PartitionKey = $ExistingDesign.PartitionKey
                RowKey       = $ExistingDesign.RowKey
                JobId        = [string]$JobId
                DesignData   = $DesignDataJson
                LastModified = (Get-Date).ToString('o')
            }
        } else {
            # Create new design
            $Entity = @{
                PartitionKey = 'Design'
                RowKey       = [guid]::NewGuid().ToString()
                JobId        = [string]$JobId
                DesignData   = $DesignDataJson
                LastModified = (Get-Date).ToString('o')
            }
        }

        Write-Host "About to call Add-CIPPAzDataTableEntity"
        Write-Host "Entity PartitionKey: $($Entity.PartitionKey)"
        Write-Host "Entity RowKey: $($Entity.RowKey)"
        Write-Host "Entity DesignData length: $($Entity.DesignData.Length) bytes"
        
        Add-CIPPAzDataTableEntity @Table -Entity $Entity -Force

        Write-Host "Add-CIPPAzDataTableEntity completed successfully"
        Write-Host "=== SAVE DESIGN DEBUG END ==="

        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::OK
            Body       = @{
                Results = 'Design saved successfully'
                DesignId = $Entity.RowKey
                JobId = $JobId
            }
        }
    } catch {
        Write-Error "Error saving design: $_"
        return [HttpResponseContext]@{
            StatusCode = [System.Net.HttpStatusCode]::InternalServerError
            Body       = @{
                error = 'Failed to save design'
                message = $_.Exception.Message
                details = $_.Exception.ToString()
            }
        }
    }
}
