Get-Command wt -ErrorAction Stop | Out-Null
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -ErrorAction SilentlyContinue
$Path = (Get-Item $PSScriptRoot).FullName
Write-Host "LightingDesign Dev Emulators starting in $Path" -ForegroundColor Green

Write-Host 'Starting LightingDesign Dev Emulators'

wt --title LightingDesign`; new-tab --title 'LightingDesign Azurite' -d $Path pwsh -c azurite`; new-tab --title 'LightingDesign FunctionApp' -d $Path\lightingdesign-api pwsh -c func start`; new-tab --title 'LightingDesign Frontend' -d $Path\lightingdesign pwsh -c yarn run dev`; new-tab --title 'LightingDesign SWA' -d $Path\lightingdesign pwsh -c yarn run start-swa
