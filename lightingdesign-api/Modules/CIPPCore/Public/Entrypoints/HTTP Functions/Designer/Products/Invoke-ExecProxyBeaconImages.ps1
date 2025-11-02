using namespace System.Net

Function Invoke-ExecProxyBeaconImages {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Products.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        # Get the list of image URLs from the request query parameters
        # URLs should be passed as comma-separated or as multiple url parameters
        $ImageUrls = @()
        
        if ($Request.Query.urls) {
            # If urls parameter exists, split by comma
            $ImageUrls = $Request.Query.urls -split ','
        } elseif ($Request.Query.url) {
            # Support single url parameter
            $ImageUrls = @($Request.Query.url)
        } elseif ($Request.Body.urls) {
            # Also support body if sent via POST
            $ImageUrls = $Request.Body.urls
        }
        
        if ($ImageUrls.Count -eq 0) {
            throw "No image URLs provided. Please provide URLs in the query string (e.g., ?urls=url1,url2 or ?url=url1&url=url2)"
        }

        # Ensure it's an array
        if ($ImageUrls -isnot [array]) {
            $ImageUrls = @($ImageUrls)
        }

        $Results = [System.Collections.Generic.List[object]]::new()

        foreach ($Url in $ImageUrls) {
            # Trim whitespace
            $Url = $Url.Trim()
            
            if ([string]::IsNullOrWhiteSpace($Url)) {
                continue
            }

            try {
                # Fetch the image from the external URL
                $ImageResponse = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing
                
                # Get the content type from the response
                $ContentType = $ImageResponse.Headers['Content-Type']
                if (-not $ContentType) {
                    $ContentType = 'image/jpeg'  # Default to JPEG if not specified
                }

                # Convert the image bytes to base64
                $Base64Image = [Convert]::ToBase64String($ImageResponse.Content)
                
                # Create a data URL
                $DataUrl = "data:$ContentType;base64,$Base64Image"

                # Add the result
                $Results.Add([PSCustomObject]@{
                    url = $Url
                    dataUrl = $DataUrl
                    success = $true
                    contentType = $ContentType
                    size = $ImageResponse.Content.Length
                })
            } catch {
                # If fetching an individual image fails, add an error result
                $Results.Add([PSCustomObject]@{
                    url = $Url
                    dataUrl = $null
                    success = $false
                    error = $_.Exception.Message
                })
            }
        }

        $StatusCode = [HttpStatusCode]::OK
        $Body = [PSCustomObject]@{
            success = $true
            count = $Results.Count
            images = $Results
        }

    } catch {
        $ErrorMessage = $_.Exception.Message
        $StatusCode = [HttpStatusCode]::BadRequest
        $Body = [PSCustomObject]@{
            success = $false
            message = "Failed to proxy images"
            error = $ErrorMessage
        }
    }
    
    return ([HttpResponseContext]@{
        StatusCode = $StatusCode
        Body       = $Body
    })
}
