# Files to Upload to S3 Bucket

## After Building (`npm run build`)

Upload **ONLY** the contents of `frontend/dist/` folder to your S3 bucket root.

### Typical Structure:

```
s3://your-bucket-name/
├── index.html
├── assets/
│   ├── index-[hash].js          (main JavaScript bundle)
│   ├── index-[hash].css          (main CSS bundle)
│   ├── [hash].svg                (icons/images)
│   └── [other asset files]
└── favicon.ico                   (if exists)
```

### Files Included:

✅ **index.html** - Main HTML file (required)
✅ **assets/** folder - All compiled JavaScript, CSS, and static assets
✅ **favicon.ico** - Site icon (if present)
✅ Any other static files from `dist/` folder

### Files NOT Included (Don't Upload):

❌ `src/` folder - Source files (not needed in production)
❌ `node_modules/` - Dependencies (not needed)
❌ `package.json` - Not needed for static hosting
❌ `.env` files - Environment variables (use S3 environment config)
❌ `tsconfig.json`, `vite.config.ts` - Build configs (not needed)
❌ `README.md`, documentation files - Not needed for runtime

## Build Command

```bash
cd frontend
npm install
npm run build
```

This creates the `dist/` folder with production-ready files.

## Upload Methods

### Method 1: AWS Console
1. Go to S3 bucket
2. Click "Upload"
3. Select all files from `frontend/dist/`
4. Upload

### Method 2: AWS CLI
```bash
aws s3 sync frontend/dist/ s3://your-bucket-name --delete
```

### Method 3: Use Deployment Scripts
- Windows: `.\deploy-to-s3.ps1`
- Linux/Mac: `./deploy-to-s3.sh`

## Important Notes

1. **Upload the CONTENTS of `dist/` folder**, not the `dist` folder itself
2. **Enable Static Website Hosting** in S3 bucket settings
3. **Set Index Document** to `index.html`
4. **Set Error Document** to `index.html` (for React Router)
5. **Configure Bucket Policy** for public read access
6. **Update CORS** on backend to allow your S3 website URL

## Default Login Credentials

For external ticket tracker integration:
- **Email:** chandra@acentle.com
- **Password:** 123456

These are pre-filled in the login form.
