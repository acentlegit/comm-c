#!/bin/bash

# AWS S3 Deployment Script for Command Center Frontend
# Usage: ./deploy-to-s3.sh [bucket-name]

BUCKET_NAME=${1:-"command-center-frontend"}
REGION=${2:-"us-east-1"}

echo "🚀 Starting deployment to S3..."
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Navigate to frontend directory
cd frontend || exit

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed. dist/ folder not found."
    exit 1
fi

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "✅ Bucket exists: $BUCKET_NAME"
else
    echo "📦 Creating bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    
    # Enable static website hosting
    echo "🌐 Enabling static website hosting..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html
fi

# Upload files
echo "📤 Uploading files to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --region "$REGION" \
    --cache-control "max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js"

# Upload HTML files with no cache
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --region "$REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --exclude "*" \
    --include "*.html"

# Set bucket policy for public read
echo "🔓 Setting bucket policy..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json

# Get website URL
WEBSITE_URL=$(aws s3api get-bucket-website --bucket "$BUCKET_NAME" --query 'WebsiteConfiguration.IndexDocument' --output text 2>/dev/null)
if [ -z "$WEBSITE_URL" ]; then
    WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Website URL: $WEBSITE_URL"
echo ""
echo "Next steps:"
echo "1. Update backend CORS to allow: $WEBSITE_URL"
echo "2. Update frontend .env.production with backend API URL"
echo "3. Test the application"
