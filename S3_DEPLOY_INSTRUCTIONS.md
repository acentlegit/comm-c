# S3 Deployment Instructions - Command Center

## ✅ Build Complete!

The frontend has been successfully built. Files are ready in `frontend/dist/` folder.

## Files to Upload to S3

Upload **ALL contents** of the `frontend/dist/` folder to your S3 bucket root:

```
frontend/dist/
├── index.html                    ← Upload this
├── assets/
│   ├── index-BcAhUPJH.css        ← Upload this folder
│   ├── index-9sbXK1sO.js
│   ├── socket-CyTcV1HU.js
│   └── vendor-Cg2AyGV-.js
```

## Quick Deploy Steps

### Option 1: Using AWS Console (Easiest)

1. **Go to AWS S3 Console**
2. **Create a new bucket** (or use existing):
   - Bucket name: `command-center-app` (or your choice)
   - Region: `us-east-1` (or your preference)
   - **Uncheck** "Block all public access"
   - Click "Create bucket"

3. **Enable Static Website Hosting**:
   - Go to bucket → Properties tab
   - Scroll to "Static website hosting"
   - Click "Edit"
   - Enable: ✅ Static website hosting
   - Index document: `index.html`
   - Error document: `index.html`
   - Click "Save changes"

4. **Set Bucket Policy** (for public access):
   - Go to bucket → Permissions tab
   - Scroll to "Bucket policy"
   - Click "Edit" and paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```
   - Replace `YOUR-BUCKET-NAME` with your actual bucket name
   - Click "Save changes"

5. **Upload Files**:
   - Go to bucket → Objects tab
   - Click "Upload"
   - Click "Add files"
   - Select **ALL files** from `frontend/dist/` folder:
     - `index.html`
     - `assets/` folder (select the entire folder)
   - Click "Upload"

6. **Get Your Website URL**:
   - Go to bucket → Properties tab
   - Scroll to "Static website hosting"
   - Copy the "Bucket website endpoint" URL
   - Example: `http://command-center-app.s3-website-us-east-1.amazonaws.com`

### Option 2: Using AWS CLI

```powershell
# Set your bucket name
$BUCKET_NAME = "command-center-app"
$REGION = "us-east-1"

# Create bucket (if doesn't exist)
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload files
aws s3 sync frontend/dist/ s3://$BUCKET_NAME --delete

# Set bucket policy
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$BUCKET_NAME/*"
        }
    )
} | ConvertTo-Json

$policy | Out-File -FilePath "$env:TEMP\policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "file://$env:TEMP\policy.json"

# Get website URL
Write-Host "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
```

### Option 3: Using PowerShell Script

```powershell
.\deploy-to-s3.ps1 -BucketName "command-center-app" -Region "us-east-1"
```

## Default Login Credentials

The login form is pre-filled with:
- **Email:** `chandra@acentle.com`
- **Password:** `123456`

## Important Notes

⚠️ **Without Backend:**
- The UI will load and display correctly
- Navigation between pages will work
- **API calls will fail** (you'll see errors in browser console)
- To see full functionality, you need to deploy the backend separately

✅ **What Will Work:**
- Login/Register UI
- Page navigation
- UI components and styling
- Routing
- All visual elements

❌ **What Won't Work (without backend):**
- Actual login/registration
- Ticket creation/viewing
- Real-time updates
- Data fetching

## Next Steps

1. **Deploy Backend** (for full functionality):
   - Deploy to AWS EC2, Lambda, or Elastic Beanstalk
   - Update `frontend/.env.production` with backend URL
   - Rebuild and redeploy frontend

2. **Or Use Mock Data** (for demo):
   - Can add mock data service for demonstration
   - Contact for mock data implementation

## Your S3 Website URL

After deployment, your application will be available at:
```
http://YOUR-BUCKET-NAME.s3-website-REGION.amazonaws.com
```

Example:
```
http://command-center-app.s3-website-us-east-1.amazonaws.com
```

## Troubleshooting

- **403 Forbidden:** Check bucket policy is set correctly
- **404 Not Found:** Ensure `index.html` is in bucket root
- **Blank Page:** Check browser console for errors
- **CORS Errors:** Normal without backend - expected behavior
