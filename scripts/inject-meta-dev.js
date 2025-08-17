#!/usr/bin/env node

/**
 * Meta Data Injection & SEO Files Generation Script - Development Version
 * 
 * This script generates SEO files for development using Firebase emulator data:
 * 
 * - src/index.html (from template with default meta data)
 * - src/robots.txt (search engine crawler instructions)
 * - src/sitemap.xml (XML sitemap for search engines)
 * - src/sitemap.html (human-readable sitemap)
 * 
 * This version works with emulator data and doesn't require production Firestore access.
 * 
 * Usage: node scripts/inject-meta-dev.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const StorageUrlResolver = require('./storage-url-resolver');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadFirebaseConfig() {
  try {
    // Read .firebaserc for project configuration
    const firebaseRcPath = path.join(process.cwd(), '.firebaserc');
    const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
    const projectId = firebaseRc.projects.default || firebaseRc.projects.dev;
    
    // Read environment configuration from .env.production for bucket info
    const envPath = path.join(process.cwd(), '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return {
      projectId: projectId,
      storageBucket: envVars.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`
    };
  } catch (error) {
    log('yellow', `⚠️  Could not read config files: ${error.message}`);
    log('yellow', '   Using fallback configuration...');
    return {
      projectId: 'tribecaconcepts-9c',
      storageBucket: 'tribecaconcepts-9c.firebasestorage.app'
    };
  }
}

async function initializeFirebaseEmulator() {
  try {
    // Load Firebase configuration from existing files
    const config = loadFirebaseConfig();
    
    // Configure for emulator BEFORE initializing Firebase Admin SDK
    process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
    process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = 'localhost:9199';
    
    // Clear any existing Firebase instances
    try {
      await admin.app().delete();
    } catch (e) {
      // App doesn't exist, which is fine
    }
    
    // Initialize Firebase Admin SDK for emulator  
    // Use Application Default Credentials (same as production script)
    admin.initializeApp({
      projectId: config.projectId,
    });
    
    log('green', `✅ Firebase Admin SDK initialized for emulator (Project: ${config.projectId})`);
    return { db: admin.firestore(), config };
  } catch (error) {
    log('yellow', '⚠️  Could not connect to emulator, using default data');
    return null;
  }
}

async function fetchSiteSettingsDev(db) {
  const defaultSettings = {
    siteName: 'Tribecaconcepts',
    siteDescription: 'MIYUKI NAGAI-GUBSER @ TribeCa conceptS',
    siteKeywords: 'portfolio, art, abstract, paintings, visual, expression, mindmap, emotions, memories',
    faviconUrl: 'favicon.ico',
    siteUrl: 'http://localhost:5050',
    // Default artist information
    artistName: '',
    artistAlternateName: '',
    artistBirthPlace: '',
    artistNationality: '',
    artistPortraitUrl: '',
    artistBiography: ''
  };

  if (!db) {
    log('blue', '📋 Using default site settings...');
    return defaultSettings;
  }

  try {
    log('blue', '📋 Fetching site settings from emulator...');
    
    const settingsDoc = await db.collection('settings').doc('main-settings').get();
    
    if (!settingsDoc.exists) {
      log('yellow', '⚠️  Site settings not found in emulator, using defaults');
      return defaultSettings;
    }
    
    const settings = settingsDoc.data();
    log('green', '✅ Site settings fetched from emulator');
    
    return {
      siteName: settings.siteName || defaultSettings.siteName,
      siteDescription: settings.siteDescription || defaultSettings.siteDescription,
      siteKeywords: Array.isArray(settings.siteKeywords) ? settings.siteKeywords.join(', ') : defaultSettings.siteKeywords,
      faviconUrl: settings.faviconUrl || defaultSettings.faviconUrl,
      siteUrl: settings.siteUrl || defaultSettings.siteUrl,
      // Artist information
      artistName: settings.artistName || defaultSettings.artistName,
      artistAlternateName: settings.artistAlternateName || defaultSettings.artistAlternateName,
      artistBirthPlace: settings.artistBirthPlace || defaultSettings.artistBirthPlace,
      artistNationality: settings.artistNationality || defaultSettings.artistNationality,
      artistPortraitUrl: settings.artistPortraitUrl || defaultSettings.artistPortraitUrl,
      artistBiography: settings.artistBiography || defaultSettings.artistBiography
    };
  } catch (error) {
    log('yellow', `⚠️  Error fetching from emulator: ${error.message}, using defaults`);
    return defaultSettings;
  }
}

async function fetchPortfolioItemsDev(db, urlResolver) {
  const defaultItems = [
    { 
      id: 'sample-art-1', 
      title: 'Sample Art Piece', 
      createdAt: new Date(), 
      category: 'art',
      galleries: [
        { description: 'Sample Gallery 1', pictures: [{ imageUrl: '/sample-image-1.jpg' }] },
        { description: 'Sample Gallery 2', pictures: [{ imageUrl: '/sample-image-2.jpg' }] }
      ]
    },
    { 
      id: 'sample-design-1', 
      title: 'Sample Design Work', 
      createdAt: new Date(), 
      category: 'graphic-design',
      galleries: [
        { description: 'Design Samples', pictures: [{ imageUrl: '/sample-design-1.jpg' }] }
      ]
    }
  ];

  if (!db) {
    log('blue', '📋 Using default portfolio items...');
    // Resolve URLs for default items too
    const resolvedDefaultItems = await Promise.all(
      defaultItems.map(async (item) => {
        const resolvedGalleries = await Promise.all(
          item.galleries.map(async (gallery) => {
            const resolvedPictures = await Promise.all(
              gallery.pictures.map(async (picture) => {
                if (picture.imageUrl) {
                  const resolvedUrl = await urlResolver.resolveUrl(picture.imageUrl);
                  return {
                    ...picture,
                    imageUrl: resolvedUrl
                  };
                }
                return picture;
              })
            );
            return {
              ...gallery,
              pictures: resolvedPictures
            };
          })
        );
        return {
          ...item,
          galleries: resolvedGalleries
        };
      })
    );
    return resolvedDefaultItems;
  }

  try {
    log('blue', '📋 Fetching portfolio items from emulator...');
    
    const portfolioSnapshot = await db.collection('portfolio')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    const portfolioItems = [];
    
    for (const doc of portfolioSnapshot.docs) {
      const data = doc.data();
      let createdAt;
      try {
        if (data.createdAt && data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          // Firestore Timestamp object
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt);
        } else {
          createdAt = new Date();
        }
      } catch (error) {
        createdAt = new Date();
      }
      
      // Fetch galleries for this portfolio item
      let galleries = [];
      try {
        log('blue', `📋 Checking galleries for portfolio item: ${doc.id}`);
        const galleriesSnapshot = await db.collection('portfolio')
          .doc(doc.id)
          .collection('galleries')
          .get();
        
        log('blue', `   Found ${galleriesSnapshot.docs.length} gallery documents`);
        
        for (const galleryDoc of galleriesSnapshot.docs) {
          const galleryData = galleryDoc.data();
          log('blue', `   Gallery ${galleryDoc.id}: ${JSON.stringify(galleryData, null, 2)}`);
          
          if (galleryData.pictures && Array.isArray(galleryData.pictures)) {
            // Resolve picture URLs
            const resolvedPictures = await Promise.all(
              galleryData.pictures.map(async (picture) => {
                if (picture.imageUrl) {
                  const resolvedUrl = await urlResolver.resolveUrl(picture.imageUrl);
                  return {
                    ...picture,
                    imageUrl: resolvedUrl
                  };
                }
                return picture;
              })
            );

            galleries.push({
              id: galleryDoc.id,
              description: galleryData.description || 'Gallery',
              pictures: resolvedPictures
            });
            log('green', `   ✅ Added gallery ${galleryDoc.id} with ${resolvedPictures.length} pictures (URLs resolved)`);
          } else {
            log('yellow', `   ⚠️  Gallery ${galleryDoc.id} has no pictures array`);
          }
        }
        
        // Also check if galleries are stored as a field in the main document
        if (galleries.length === 0 && data.galleries) {
          log('blue', `   📋 Checking galleries field in main document`);
          if (Array.isArray(data.galleries)) {
            galleries = await Promise.all(
              data.galleries.map(async (gallery, index) => {
                let resolvedPictures = gallery.pictures || [];
                
                // Resolve picture URLs if they exist
                if (resolvedPictures.length > 0) {
                  resolvedPictures = await Promise.all(
                    resolvedPictures.map(async (picture) => {
                      if (picture.imageUrl) {
                        const resolvedUrl = await urlResolver.resolveUrl(picture.imageUrl);
                        return {
                          ...picture,
                          imageUrl: resolvedUrl
                        };
                      }
                      return picture;
                    })
                  );
                }

                return {
                  id: `gallery-${index}`,
                  description: gallery.description || `Gallery ${index + 1}`,
                  pictures: resolvedPictures
                };
              })
            );
            log('green', `   ✅ Found ${galleries.length} galleries in main document (URLs resolved)`);
          }
        }
        
      } catch (galleryError) {
        log('yellow', `⚠️  Error fetching galleries for ${doc.id}: ${galleryError.message}`);
      }
      
      portfolioItems.push({
        id: doc.id,
        title: data.title || 'Untitled',
        createdAt: createdAt,
        category: data.category || 'portfolio',
        galleries: galleries
      });
    }
    
    if (portfolioItems.length === 0) {
      log('yellow', '⚠️  No published portfolio items found, using defaults');
      return defaultItems;
    }
    
    log('green', `✅ Fetched ${portfolioItems.length} published portfolio items from emulator`);
    return portfolioItems;
  } catch (error) {
    log('yellow', `⚠️  Error fetching portfolio from emulator: ${error.message}, using defaults`);
    return defaultItems;
  }
}

async function fetchContactInfoDev(db) {
  if (!db) {
    log('yellow', '⚠️  No database connection, skipping contact info');
    return null;
  }

  try {
    log('blue', '📋 Fetching contact info from emulator...');
    
    // First try the specific document ID
    let contactDoc = await db.collection('contact').doc('main-contact').get();
    
    if (!contactDoc.exists) {
      // If main-contact doesn't exist, try to get any contact document
      log('blue', '📋 main-contact not found, checking for any contact documents...');
      const contactSnapshot = await db.collection('contact').limit(1).get();
      
      if (contactSnapshot.empty) {
        log('yellow', '⚠️  No contact documents found in emulator - add contact info through admin interface');
        return null;
      }
      
      contactDoc = contactSnapshot.docs[0];
      log('green', `✅ Found contact document with ID: ${contactDoc.id}`);
    } else {
      log('green', '✅ Contact info fetched from emulator (main-contact)');
    }
    
    const contact = contactDoc.data();
    
    return {
      address: contact.address || '',
      socialMedia: {
        instagram: contact.socialMedia?.instagram || '',
        linkedin: contact.socialMedia?.linkedin || '',
        twitter: contact.socialMedia?.twitter || '',
        behance: contact.socialMedia?.behance || ''
      }
    };
  } catch (error) {
    log('red', `❌ Error fetching contact from emulator: ${error.message}`);
    return null;
  }
}

function generateIndexFromTemplate(templatePath, siteSettings, contactInfo) {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all template variables with actual values
    content = content.replace(/{{SITE_NAME}}/g, siteSettings.siteName);
    content = content.replace(/{{SITE_DESCRIPTION}}/g, siteSettings.siteDescription);
    content = content.replace(/{{SITE_KEYWORDS}}/g, siteSettings.siteKeywords);
    content = content.replace(/{{FAVICON_URL}}/g, siteSettings.faviconUrl);
    
    // Generate VisualArtist structured data if artist information is available
    if (siteSettings.artistName) {
      // Build sameAs array from available social media links
      const sameAsLinks = [];
      
      // Add contact social media links if contact info is available
      if (contactInfo?.socialMedia) {
        if (contactInfo.socialMedia.instagram) sameAsLinks.push(contactInfo.socialMedia.instagram);
        if (contactInfo.socialMedia.linkedin) sameAsLinks.push(contactInfo.socialMedia.linkedin);
        if (contactInfo.socialMedia.twitter) sameAsLinks.push(contactInfo.socialMedia.twitter);
        if (contactInfo.socialMedia.behance) sameAsLinks.push(contactInfo.socialMedia.behance);
      }
      
      // Add settings social media links
      if (siteSettings.socialMedia?.facebook) sameAsLinks.push(siteSettings.socialMedia.facebook);
      if (siteSettings.socialMedia?.instagram) sameAsLinks.push(siteSettings.socialMedia.instagram);
      if (siteSettings.socialMedia?.linkedin) sameAsLinks.push(siteSettings.socialMedia.linkedin);
      if (siteSettings.socialMedia?.twitter) sameAsLinks.push(siteSettings.socialMedia.twitter);
      
      const visualArtistSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": siteSettings.artistName,
        "url": siteSettings.siteUrl
      };
      
      // Add optional fields if they exist
      if (siteSettings.artistAlternateName) {
        visualArtistSchema.alternateName = siteSettings.artistAlternateName;
      }
      
      if (siteSettings.artistBirthPlace) {
        visualArtistSchema.birthPlace = {
          "@type": "Place",
          "name": siteSettings.artistBirthPlace
        };
      }
      
      if (siteSettings.artistNationality) {
        visualArtistSchema.nationality = siteSettings.artistNationality;
      }
      
      if (siteSettings.artistPortraitUrl) {
        visualArtistSchema.image = siteSettings.artistPortraitUrl;
      }
      
      if (siteSettings.artistBiography) {
        visualArtistSchema.description = siteSettings.artistBiography;
      }
      
      if (sameAsLinks.length > 0) {
        visualArtistSchema.sameAs = sameAsLinks;
      }
      
      if (contactInfo?.address) {
        // Simple address parsing - could be enhanced
        visualArtistSchema.address = {
          "@type": "PostalAddress",
          "addressLocality": "Zurich", // Default for now
          "addressCountry": "CH"
        };
      }
      
      const schemaScript = `<script type="application/ld+json">
${JSON.stringify(visualArtistSchema, null, 2)}
</script>`;
      
      // Insert the structured data before the closing </head> tag
      content = content.replace('</head>', `  ${schemaScript}\n</head>`);
      
      log('green', '✅ Added Person structured data to index.html');
    } else {
      log('yellow', '⚠️  No artist name provided, skipping Person structured data');
    }
    
    return content;
  } catch (error) {
    log('red', `❌ Error reading template file ${templatePath}: ${error.message}`);
    process.exit(1);
  }
}

function generateRobotsTxt(siteSettings) {
  const content = `User-agent: *
Allow: /

Sitemap: ${siteSettings.siteUrl}/sitemap.xml
`;
  return content;
}



async function main() {
  log('blue', '🔧 Generating SEO files for development...');
  
  // Paths
  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  const robotsFile = path.join(process.cwd(), 'src/robots.txt');
  
  // Check if template file exists
  if (!fs.existsSync(templateFile)) {
    log('red', '❌ src/index.html.template file not found');
    process.exit(1);
  }
  
  // Try to initialize Firebase emulator connection
  const firebaseResult = await initializeFirebaseEmulator();
  const db = firebaseResult?.db || null;
  const config = firebaseResult?.config || loadFirebaseConfig();
  
  // Create URL resolver for emulator environment using config from files
  const envVars = { 
    FIREBASE_PROJECT_ID: config.projectId,
    FIREBASE_STORAGE_BUCKET: config.storageBucket
  };
  const urlResolver = StorageUrlResolver.createFromEnv(envVars, true);
  log('green', '✅ Storage URL resolver initialized for emulator');
  
  // Debug: Check configuration
  log('blue', `🔧 FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  log('blue', `🔧 FIREBASE_STORAGE_EMULATOR_HOST: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
  log('blue', `🔧 Project ID: ${config.projectId}`);
  log('blue', `🔧 Storage Bucket: ${config.storageBucket}`);
  
  // Fetch site settings (from emulator or defaults)
  const siteSettings = await fetchSiteSettingsDev(db);
  
  // Fetch contact info (from emulator or defaults)
  const contactInfo = await fetchContactInfoDev(db);
  
  // Fetch portfolio items (from emulator or defaults with URL resolution)
  const portfolioItems = await fetchPortfolioItemsDev(db, urlResolver);
  
  // Generate index.html from template
  log('blue', '📋 Generating index.html from template...');
  const indexContent = generateIndexFromTemplate(templateFile, siteSettings, contactInfo);
  
  // Generate SEO files
  log('blue', '📋 Generating SEO files...');
  const robotsContent = generateRobotsTxt(siteSettings);
  
  // Prepare files to write (sitemaps are now dynamic Angular routes)
  log('blue', '📋 Preparing files (sitemaps handled by Angular components)...');
  const filesToWrite = [
    { path: indexFile, content: indexContent, name: 'index.html' },
    { path: robotsFile, content: robotsContent, name: 'robots.txt' }
  ];
  
  try {
    filesToWrite.forEach(({ path, content, name }) => {
      fs.writeFileSync(path, content, 'utf8');
      log('green', `✅ ${name} generated successfully`);
      log('blue', `   📁 Created: ${path}`);
    });
  } catch (error) {
    log('red', `❌ Error writing files: ${error.message}`);
    process.exit(1);
  }
  
  // Show summary
  log('blue', '📋 Development files summary:');
  console.log(`   🏷️  Site Name: ${siteSettings.siteName}`);
  console.log(`   🌐 Site URL: ${siteSettings.siteUrl} (Development)`);
  console.log(`   📝 Description: ${siteSettings.siteDescription.substring(0, 50)}...`);
  console.log(`   📁 Portfolio Items: ${portfolioItems.length} items`);
  console.log(`   📄 Static Files Generated: 2 files (index.html, robots.txt)`);
  console.log(`   🌐 Dynamic Sitemaps: Available at /sitemap.html and /sitemap.xml`);
  
  log('green', '🎉 Development SEO file generation completed successfully!');
  
  // Clean up Firebase connection if it exists
  if (db) {
    try {
      await admin.app().delete();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});