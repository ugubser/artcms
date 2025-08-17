# Production Data Sync Guide

This guide explains how to sync production data (Firestore + Storage) to your local development emulator.

## Prerequisites

### Required
- Firebase CLI: `npm install -g firebase-tools`
- Firebase authentication: `firebase login`
- Project access permissions for the production project

### Optional (for Storage sync)
- Google Cloud SDK: [Install Guide](https://cloud.google.com/sdk/docs/install)
- gcloud authentication: `gcloud auth login`

## Quick Start

### Option 1: Automated Sync (Recommended)
```bash
./scripts/sync-all-production-data.sh
```

This will:
1. Export Firestore data from production
2. Download Storage files (if gsutil available)
3. Start emulator automatically
4. Upload storage files to running emulator
5. Keep emulator running with all production data

### Option 2: Manual Process (Step by Step)

**Step 1: Sync Firestore Data**
```bash
./scripts/sync-production-gcloud.sh
```

**Step 2: Download Storage Files**
```bash
./scripts/sync-storage-data.sh
```

**Step 3: Start Emulator**
```bash
npm run emulator
```

**Step 4: Upload Storage Files to Emulator**
```bash
# In a new terminal window
./scripts/upload-storage-to-emulator.sh
```

## How It Works

### Firestore Data
1. Uses `gcloud firestore export` to export production data to Cloud Storage
2. Downloads exported data locally
3. Imports data into emulator using `firebase emulators:start --import`
4. Data is saved to `./emulator_data/` for future use

### Storage Data
1. **Download Phase**: Uses `gsutil rsync` to download all files from production Storage to `./storage/`
2. **Upload Phase**: Uses Firebase Admin SDK to upload files to running emulator
3. **Benefits**: 
   - Files persist across emulator restarts
   - Proper authentication handling
   - Protected from emulator export/import cycles

## File Structure After Sync

```
./emulator_data/                # Emulator data (Firestore + Auth)
├── firestore_export/          # Firestore collections & documents
├── auth_export/               # Authentication data
└── firebase-export-metadata.json

./storage/                     # Downloaded storage files (persistent)
├── portfolio/                 # Portfolio images
├── about/                     # About page assets
└── branding/                  # Brand assets
```

## Usage Scenarios

### 1. Initial Setup
```bash
# First time - sync everything
./scripts/sync-all-production-data.sh

# Start developing
npm run emulator
```

### 2. Refresh Data
```bash
# Get latest production data
./scripts/sync-all-production-data.sh
```

### 3. Development Workflow
```bash
# Regular development (uses cached data)
npm run emulator

# Upload storage files (if not done automatically)
./scripts/upload-storage-to-emulator.sh

# Refresh when needed
./scripts/sync-all-production-data.sh
```

### 4. Manual Storage Upload (if needed)
```bash
# If emulator is already running and you have downloaded files
./scripts/upload-storage-to-emulator.sh
```

## Troubleshooting

### Firestore Export Fails
- **Check permissions**: Ensure you have Firestore Export/Import permissions
- **Project access**: Verify you can access the production project
- **Firebase login**: Run `firebase login` if authentication expired

### Storage Sync Fails
- **Install gsutil**: Download Google Cloud SDK
- **Authentication**: Run `gcloud auth login`
- **Project access**: Run `gcloud config set project YOUR_PROJECT_ID`
- **Bucket permissions**: Ensure you have Storage Object Viewer permissions

### Storage Upload Fails
- **Emulator not running**: Make sure `npm run emulator` is running first
- **Files not downloaded**: Run `./scripts/sync-storage-data.sh` first
- **Permission errors**: Storage upload uses Firebase Admin SDK and bypasses rules
- **File path issues**: Ensure files are in `./storage/` directory

### Common Issues

**"Permission denied" errors:**
```bash
# Re-authenticate
firebase login
gcloud auth login
```

**"Project not found":**
```bash
# Check your .firebaserc
cat .firebaserc

# Verify project access
firebase projects:list
```

**Storage bucket not found:**
```bash
# List available buckets
gsutil ls

# Check project setting
gcloud config get-value project
```

**Upload script can't find files:**
```bash
# Check if files were downloaded
ls -la ./storage/

# Re-download if needed
./scripts/sync-storage-data.sh
```

**Emulator not accessible:**
```bash
# Check if emulator is running
curl http://localhost:9199
curl http://localhost:8080

# Restart emulator if needed
npm run emulator
```

## Security Notes

- ✅ **Safe**: All operations are read-only on production
- ✅ **Isolated**: Emulator data is completely separate from production  
- ✅ **Local**: Files are stored locally, no ongoing connection to production
- ✅ **Admin SDK**: Storage uploads use Firebase Admin SDK with elevated privileges (appropriate for development)
- ⚠️ **Sensitive data**: Be careful with downloaded production data
- ⚠️ **Local files**: Add `storage/` to `.gitignore` to avoid committing production files

## Performance Tips

### Large Datasets
- **Selective export**: Consider exporting specific collections only
- **Incremental sync**: Re-run scripts only when you need fresh data
- **Storage optimization**: Exclude large files you don't need for development

### Custom Firestore Export
```bash
# Export specific collections only
firebase firestore:export ./custom-export --collection-ids=portfolio,settings
```

### Storage Filtering
```bash
# Sync only specific folders
gsutil -m rsync -r gs://bucket-name/portfolio ./storage/portfolio

# Then upload to emulator
./scripts/upload-storage-to-emulator.sh
```

## Script Customization

### Modify Export Location
Edit `scripts/sync-production-gcloud.sh`:
```bash
FINAL_DIR="./custom-export-location"
```

### Change Storage Directory
Edit `scripts/sync-storage-data.sh`:
```bash
LOCAL_STORAGE_DIR="./custom-storage-location"
```

**Note**: If you change the storage directory, also update `scripts/upload-to-emulator.js`:
```javascript
const downloadDir = './custom-storage-location';
```

### Add Pre/Post Processing
Add custom logic to `scripts/sync-all-production-data.sh` for:
- Data transformation
- Cleanup tasks
- Notifications
- Backup management

## Automation

### Scheduled Sync
Add to crontab for daily sync:
```bash
# Daily at 2 AM
0 2 * * * cd /path/to/project && ./scripts/sync-all-production-data.sh
```

### CI/CD Integration
Include in development environment setup:
```yaml
- name: Sync Production Data
  run: ./scripts/sync-all-production-data.sh
```

## Best Practices

1. **Regular updates**: Sync data weekly or when production changes significantly
2. **Team coordination**: Share `./emulator_data/` folder with team (if data isn't sensitive)
3. **Version control**: Add `./emulator_data/` to `.gitignore` (already configured)
4. **Backup important data**: Keep backups before major production data changes
5. **Test with fresh data**: Occasionally test with completely fresh production data