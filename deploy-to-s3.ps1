# AWS S3 Deployment Script for Command Center Frontend (PowerShell)
# Usage: .\deploy-to-s3.ps1 -BucketName "command-center-frontend" -Region "us-east-1"

param(
    [string]$BucketName = "command-center-frontend",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Starting deployment to S3..." -ForegroundColor Green
Write-Host "Bucket: $BucketName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
Set-Location frontend

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed. dist/ folder not found." -ForegroundColor Red
    exit 1
}

# Check if bucket exists
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bucket exists: $BucketName" -ForegroundColor Green
} else {
    Write-Host "📦 Creating bucket: $BucketName" -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" --region $Region
    
    # Enable static website hosting
    Write-Host "🌐 Enabling static website hosting..." -ForegroundColor Yellow
    $websiteConfig = @{
        IndexDocument = @{Suffix = "index.html"}
        ErrorDocument = @{Key = "index.html"}
    } | ConvertTo-Json
    
    aws s3api put-bucket-website --bucket $BucketName --website-configuration $websiteConfig
}

# Upload files
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$BucketName" --delete --region $Region

# Set bucket policy for public read
Write-Host "🔓 Setting bucket policy..." -ForegroundColor Yellow
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$BucketName/*"
        }
    )
} | ConvertTo-Json

$policy | Out-File -FilePath "$env:TEMP\bucket-policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $BucketName --policy "file://$env:TEMP\bucket-policy.json"

# Get website URL
$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update backend CORS to allow: $websiteUrl"
Write-Host "2. Update frontend .env.production with backend API URL"
Write-Host "3. Test the application"
