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

### Option 1: Sync Everything (Recommended)
```bash
./scripts/sync-all-production-data.sh
```

This will:
1. Export Firestore data from production
2. Download Storage files (if gsutil available)
3. Start emulator with production data

### Option 2: Individual Components

**Firestore only:**
```bash
./scripts/sync-production-data.sh
```

**Storage only:**
```bash
./scripts/sync-storage-data.sh
```

## How It Works

### Firestore Data
1. Uses `firebase firestore:export` to export production data
2. Imports data into emulator using `firebase emulators:start --import`
3. Data is saved to `./emulator_data/` for future use

### Storage Data
1. Uses `gsutil rsync` to download all files from production Storage
2. Files are stored in `./emulator_data/storage/`
3. Emulator serves files from this local directory

## File Structure After Sync

```
./emulator_data/
├── firestore_export/          # Firestore collections & documents
├── storage/                   # All Firebase Storage files
└── firebase-export-metadata.json
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

# Refresh when needed
./scripts/sync-all-production-data.sh
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

## Security Notes

- ✅ **Safe**: All operations are read-only on production
- ✅ **Isolated**: Emulator data is completely separate from production
- ✅ **Local**: Files are stored locally, no ongoing connection to production
- ⚠️ **Sensitive data**: Be careful with downloaded production data

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
gsutil -m rsync -r gs://bucket-name/portfolio ./emulator_data/storage/portfolio
```

## Script Customization

### Modify Export Location
Edit `scripts/sync-production-data.sh`:
```bash
EXPORT_DIR="./custom-export-location"
```

### Change Storage Directory
Edit `scripts/sync-storage-data.sh`:
```bash
LOCAL_STORAGE_DIR="./custom-storage-location"
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