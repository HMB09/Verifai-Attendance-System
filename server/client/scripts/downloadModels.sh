#!/bin/bash
# Bash script to download face-api.js models
# Run from client directory: bash scripts/downloadModels.sh

MODELS_DIR="public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

echo "Downloading face-api.js models..."
echo ""

FILES=(
    "tiny_face_detector_model-weights_manifest.json"
    "tiny_face_detector_model-shard1"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
    "face_recognition_model-shard2"
)

for file in "${FILES[@]}"; do
    url="$BASE_URL/$file"
    output="$MODELS_DIR/$file"
    
    echo "Downloading: $file..."
    if curl -L -o "$output" "$url" 2>/dev/null; then
        echo "  ✅ Downloaded: $file"
    else
        echo "  ❌ Failed to download: $file"
    fi
done

echo ""
echo "Download complete! Models are in: $MODELS_DIR"
