function Invoke-ListUserSettings {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.User.Read
    #>
    param($Request, $TriggerMetadata)
    $Headers = $Request.Headers

    $Username = ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($Headers.'x-ms-client-principal')) | ConvertFrom-Json).userDetails

    try {
        $Table = Get-CippTable -tablename 'UserSettings'
        $UserSettings = Get-CIPPAzDataTableEntity @Table -Filter "PartitionKey eq 'UserSettings' and RowKey eq 'allUsers'"
        if (!$UserSettings) { $UserSettings = Get-CIPPAzDataTableEntity @Table -Filter "PartitionKey eq 'UserSettings' and RowKey eq '$Username'" }

        try {
            $UserSettings = $UserSettings.JSON | ConvertFrom-Json -Depth 10 -ErrorAction SilentlyContinue
        } catch {
            Write-Warning "Failed to convert UserSettings JSON: $($_.Exception.Message)"
            $UserSettings = [pscustomobject]@{
                direction      = 'ltr'
                paletteMode    = 'light'
                currentTheme   = @{ value = 'light'; label = 'light' }
                pinNav         = $true
                showDevtools   = $false
            }
        }

        $StatusCode = [HttpStatusCode]::OK
        $Results = $UserSettings
    } catch {
        $Results = "Function Error: $($_.Exception.Message)"
        $StatusCode = [HttpStatusCode]::BadRequest
    }
    return ([HttpResponseContext]@{
            StatusCode = $StatusCode
            Body       = $Results
        })

}
