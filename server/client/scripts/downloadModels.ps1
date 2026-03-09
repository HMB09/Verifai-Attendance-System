# PowerShell script to download face-api.js models
# Run from client directory: .\scripts\downloadModels.ps1

$modelsDir = "public\models"
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights"

# Create models directory if it doesn't exist
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "Created directory: $modelsDir"
}

Write-Host "Downloading face-api.js models..."
Write-Host ""

$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = "$modelsDir\$file"
    
    try {
        Write-Host "Downloading: $file..."
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "  ✅ Downloaded: $file" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to download: $file" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Download complete! Models are in: $modelsDir" -ForegroundColor Green
