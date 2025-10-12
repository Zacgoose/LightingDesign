using namespace System.Net

Function Invoke-ExecListBeaconProducts {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        LightingDesigner.Products.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    try {
        $Table = Get-CIPPTable -TableName 'Products'
        $Entities = Get-CIPPAzDataTableEntity -Context $Table.Context
        $ProductsObject = [System.Collections.Generic.List[object]]::new()
        foreach ($entity in $Entities) {
            if ($entity.ProductJson) {
                $ObjectData = $entity.ProductJson | Convertfrom-Json -Depth 10
                $ProductsObject.Add($ObjectData)
            }
        }
        $StatusCode = [HttpStatusCode]::OK
        $Body = $ProductsObject

    } catch {
        $ErrorMessage = $_.Exception.Message
        $StatusCode = [HttpStatusCode]::BadRequest
        $Body = [PSCustomObject]@{
            Success = $false
            Message = "Failed to list products"
            Error   = $ErrorMessage
            Results = @()
        }
    }
    return ([HttpResponseContext]@{
        StatusCode = $StatusCode
        Body       = $Body
    })
}
