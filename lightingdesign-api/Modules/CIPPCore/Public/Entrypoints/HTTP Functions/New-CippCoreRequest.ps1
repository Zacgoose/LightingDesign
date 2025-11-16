function New-CippCoreRequest {
    <#
    .SYNOPSIS
        Main entrypoint for all HTTP triggered functions in CIPP
    .DESCRIPTION
        This function is the main entry point for all HTTP triggered functions in CIPP. It routes requests to the appropriate function based on the CIPPEndpoint parameter in the request.
    .FUNCTIONALITY
        Internal
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param($Request, $TriggerMetadata)

    $FunctionName = 'Invoke-{0}' -f $Request.Params.CIPPEndpoint
    Write-Information "API: $($Request.Params.CIPPEndpoint)"

    $HttpTrigger = @{
        Request         = [pscustomobject]($Request)
        TriggerMetadata = $TriggerMetadata
    }

    if ($PSCmdlet.ShouldProcess("Processing request for $($Request.Params.CIPPEndpoint)")) {
        if ((Get-Command -Name $FunctionName -ErrorAction SilentlyContinue) -or $FunctionName -eq 'Invoke-Me') {
            try {
                $Access = Test-CIPPAccess -Request $Request
                if ($FunctionName -eq 'Invoke-Me') {
                    return $Access
                }
            } catch {
                Write-Information "Access denied for $FunctionName : $($_.Exception.Message)"
                return ([HttpResponseContext]@{
                        StatusCode = [HttpStatusCode]::Forbidden
                        Body       = $_.Exception.Message
                    })
            }

            try {
                Write-Information "Access: $Access"
                Write-LogMessage -headers $Headers -API $Request.Params.CIPPEndpoint -message 'Accessed this API' -Sev 'Debug'
                if ($Access) {
                    $Response = & $FunctionName @HttpTrigger
                    Write-Host "[New-CippCoreRequest] Response type: $($Response.GetType().Name)"
                    Write-Host "[New-CippCoreRequest] Response properties: $($Response.PSObject.Properties.Name -join ', ')"
                    # Filter to only return HttpResponseContext objects
                    $HttpResponse = $Response | Where-Object { $_.PSObject.TypeNames -contains 'HttpResponseContext' -or ($_.StatusCode -and $_.Body) }
                    if ($HttpResponse) {
                        # Return the first valid HttpResponseContext found, ensuring only valid properties are included
                        $FirstResponse = $HttpResponse | Select-Object -First 1
                        Write-Host "[New-CippCoreRequest] FirstResponse properties: $($FirstResponse.PSObject.Properties.Name -join ', ')"
                        $CleanResponse = @{
                            StatusCode = $FirstResponse.StatusCode
                            Body       = $FirstResponse.Body
                        }
                        # Include optional properties if they exist
                        if ($FirstResponse.Headers) { $CleanResponse.Headers = $FirstResponse.Headers }
                        if ($FirstResponse.ContentType) { $CleanResponse.ContentType = $FirstResponse.ContentType }
                        if ($FirstResponse.Cookies) { $CleanResponse.Cookies = $FirstResponse.Cookies }
                        Write-Host "[New-CippCoreRequest] CleanResponse properties: $($CleanResponse.Keys -join ', ')"
                        return ([HttpResponseContext]$CleanResponse)
                    } elseif ($null -ne $Response -and $Response -ne '') {
                        # If response has data but is not an HttpResponseContext, wrap it
                        Write-Host "[New-CippCoreRequest] Wrapping non-HttpResponseContext response"
                        return ([HttpResponseContext]@{
                                StatusCode = [HttpStatusCode]::OK
                                Body       = $Response
                            })
                    }
                    Write-Host "[New-CippCoreRequest] No response data, returning nothing"
                    # If no response data, return nothing (no output binding will be pushed)
                }
            } catch {
                Write-Warning "Exception occurred on HTTP trigger ($FunctionName): $($_.Exception.Message)"
                return ([HttpResponseContext]@{
                        StatusCode = [HttpStatusCode]::InternalServerError
                        Body       = $_.Exception.Message
                    })
            }
        } else {
            return ([HttpResponseContext]@{
                    StatusCode = [HttpStatusCode]::NotFound
                    Body       = 'Endpoint not found'
                })
        }
    } else {
        return ([HttpResponseContext]@{
                StatusCode = [HttpStatusCode]::PreconditionFailed
                Body       = 'Request not processed'
            })
    }
}
