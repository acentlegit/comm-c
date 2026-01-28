# AWS S3 Deployment Guide

## Files to Upload to S3 Bucket

### Frontend Files (Static Website Hosting)

After building the frontend, upload the **entire `dist/` folder** contents to your S3 bucket:

```
frontend/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other asset files]
└── [any other static files]
```

**Note:** Only the frontend can be deployed to S3 as it's a static site. The backend needs to be deployed separately (see Backend Deployment section).

## Deployment Steps

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` folder with all production-ready files.

### 2. Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Bucket name: `command-center-frontend` (or your preferred name)
4. Region: Choose your preferred region
5. Uncheck "Block all public access" (or configure bucket policy for public read)
6. Enable "Static website hosting"
7. Index document: `index.html`
8. Error document: `index.html` (for React Router)

### 3. Configure Bucket Policy

Add this bucket policy to allow public read access:

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

### 4. Upload Files to S3

**Option A: Using AWS Console**
1. Go to your S3 bucket
2. Click "Upload"
3. Select all files from `frontend/dist/` folder
4. Click "Upload"

**Option B: Using AWS CLI**
```bash
aws s3 sync frontend/dist/ s3://YOUR-BUCKET-NAME --delete
```

### 5. Enable Static Website Hosting

1. Go to bucket Properties
2. Scroll to "Static website hosting"
3. Enable it
4. Set Index document: `index.html`
5. Set Error document: `index.html`
6. Copy the bucket website endpoint URL

## Backend Deployment

The backend **cannot** be deployed to S3 (S3 is for static files only). Options:

### Option 1: AWS EC2
- Deploy Node.js backend on EC2 instance
- Update frontend API base URL to point to EC2

### Option 2: AWS Lambda + API Gateway
- Convert backend to serverless functions
- Use API Gateway for HTTP endpoints

### Option 3: AWS Elastic Beanstalk
- Deploy Node.js application easily
- Handles scaling and load balancing

### Option 4: AWS ECS/Fargate
- Containerize backend with Docker
- Deploy to ECS or Fargate

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-api-url.com/api
VITE_SOCKET_URL=https://your-backend-api-url.com
```

### Backend Environment Variables

On your backend server, set:

```env
PORT=4000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_URL=https://your-s3-bucket-url.s3-website-region.amazonaws.com
```

## Post-Deployment Checklist

- [ ] Frontend built successfully
- [ ] All files uploaded to S3
- [ ] Static website hosting enabled
- [ ] Bucket policy configured
- [ ] Backend deployed and running
- [ ] Frontend API URL points to backend
- [ ] CORS configured on backend for S3 URL
- [ ] MongoDB connection working
- [ ] Test login functionality
- [ ] Test ticket creation
- [ ] Test all user roles

## Default Login Credentials

For the external ticket tracker site:
- Email: `chandra@acentle.com`
- Password: `123456`

These credentials are pre-filled in the login page for convenience.
