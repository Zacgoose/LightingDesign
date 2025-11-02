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
        # Get the list of image URLs from the request
        # Check both Query and Body (Azure Functions pattern)
        $urls = $Request.Query.urls ?? $Request.Body.urls
        
        if (-not $urls) {
            throw "No image URLs provided. Please provide 'urls' parameter with array of URLs."
        }

        # Ensure it's an array
        $ImageUrls = @()
        if ($urls -is [array]) {
            $ImageUrls = $urls
        } else {
            $ImageUrls = @($urls)
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
