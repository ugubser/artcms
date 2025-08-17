#!/usr/bin/env node

/**
 * Meta Data Injection & SEO Files Generation Script
 * 
 * This script fetches site settings and portfolio data from production Firestore
 * and generates multiple SEO-related files before building:
 * 
 * - src/index.html (from template with injected meta data)
 * - src/robots.txt (search engine crawler instructions)
 * - src/sitemap.xml (XML sitemap for search engines)
 * - src/sitemap.html (human-readable sitemap)
 * 
 * The script fetches published portfolio items and includes them in the sitemaps
 * along with static pages (home, art, design, about, contact).
 * 
 * Usage: node scripts/inject-meta.js
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

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
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
    
    return envVars;
  } catch (error) {
    log('red', `❌ Error reading ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

async function ensureGoogleCloudAuth() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // Check if Google Cloud Application Default Credentials are available
    await execAsync('gcloud auth application-default print-access-token', { timeout: 5000 });
    log('green', '✅ Google Cloud Application Default Credentials are available');
    return true;
  } catch (error) {
    log('yellow', '⚠️  Google Cloud Application Default Credentials not found');
    log('red', '❌ Google Cloud authentication required for Firestore access');
    log('blue', '💡 Please run the following command manually in a separate terminal:');
    log('blue', '   gcloud auth application-default login --no-launch-browser');
    log('yellow', '   Then press any key to continue...');
    
    // Wait for user to press a key
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

    // Check again if authentication is now available
    try {
      await execAsync('gcloud auth application-default print-access-token', { timeout: 5000 });
      log('green', '✅ Google Cloud authentication verified');
      return true;
    } catch (retryError) {
      log('red', '❌ Authentication still not available');
      log('yellow', '   Please ensure you completed the authentication process');
      process.exit(1);
    }
  }
}

async function initializeFirebase(envVars) {
  try {
    // Ensure Google Cloud authentication is available
    await ensureGoogleCloudAuth();

    // Initialize Firebase Admin SDK with project ID only
    // This should work if Google Cloud is authenticated
    admin.initializeApp({
      projectId: envVars.FIREBASE_PROJECT_ID
    });
    
    log('green', '✅ Firebase Admin SDK initialized successfully');
    return admin.firestore();
  } catch (error) {
    log('red', `❌ Error initializing Firebase: ${error.message}`);
    log('yellow', '   Please ensure you are authenticated with Google Cloud');
    process.exit(1);
  }
}

async function fetchSiteSettings(db) {
  try {
    log('blue', '📋 Fetching site settings from Firestore...');
    
    const settingsDoc = await db.collection('settings').doc('main-settings').get();
    
    if (!settingsDoc.exists) {
      log('red', '❌ Site settings document not found in Firestore');
      log('yellow', '   Please ensure the settings document exists at /settings/main-settings');
      process.exit(1);
    }
    
    const settings = settingsDoc.data();
    log('green', '✅ Site settings fetched successfully');
    
    return {
      siteName: settings.siteName || 'Tribecaconcepts',
      siteDescription: settings.siteDescription || 'MIYUKI NAGAI-GUBSER @ TribeCa conceptS',
      siteKeywords: Array.isArray(settings.siteKeywords) ? settings.siteKeywords.join(', ') : 'portfolio, art, abstract, paintings, visual, expression, mindmap, emotions, memories',
      faviconUrl: settings.faviconUrl || 'favicon.ico',
      siteUrl: settings.siteUrl || 'https://tribecaconcepts.com',
      // Artist information
      artistName: settings.artistName || '',
      artistAlternateName: settings.artistAlternateName || '',
      artistBirthPlace: settings.artistBirthPlace || '',
      artistNationality: settings.artistNationality || '',
      artistPortraitUrl: settings.artistPortraitUrl || '',
      artistBiography: settings.artistBiography || '',
      socialMedia: settings.socialMedia || {}
    };
  } catch (error) {
    log('red', `❌ Error fetching site settings: ${error.message}`);
    process.exit(1);
  }
}

async function fetchPortfolioItems(db, urlResolver) {
  try {
    log('blue', '📋 Fetching portfolio items from Firestore...');
    
    let portfolioSnapshot;
    try {
      // Try the optimized query first (requires composite index)
      portfolioSnapshot = await db.collection('portfolio')
        .where('published', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      log('yellow', '⚠️  Composite index not available, using fallback query...');
      log('blue', '💡 You can create the index at: https://console.firebase.google.com/project/your-project/firestore/indexes');
      
      // Fallback: get all published items without ordering
      portfolioSnapshot = await db.collection('portfolio')
        .where('published', '==', true)
        .get();
    }
    
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
    
    // Sort by createdAt in JavaScript if we used the fallback query
    portfolioItems.sort((a, b) => b.createdAt - a.createdAt);
    
    log('green', `✅ Fetched ${portfolioItems.length} published portfolio items`);
    return portfolioItems;
  } catch (error) {
    log('red', `❌ Error fetching portfolio items: ${error.message}`);
    log('yellow', '⚠️  Continuing with empty portfolio list...');
    return [];
  }
}

async function fetchContactInfo(db) {
  try {
    log('blue', '📋 Fetching contact info from Firestore...');
    
    // First try the specific document ID
    let contactDoc = await db.collection('contact').doc('main-contact').get();
    
    if (!contactDoc.exists) {
      // If main-contact doesn't exist, try to get any contact document
      log('blue', '📋 main-contact not found, checking for any contact documents...');
      const contactSnapshot = await db.collection('contact').limit(1).get();
      
      if (contactSnapshot.empty) {
        log('yellow', '⚠️  No contact documents found in Firestore');
        return null;
      }
      
      contactDoc = contactSnapshot.docs[0];
      log('green', `✅ Found contact document with ID: ${contactDoc.id}`);
    } else {
      log('green', '✅ Contact info fetched from Firestore (main-contact)');
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
    log('red', `❌ Error fetching contact info: ${error.message}`);
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
  log('blue', '🔧 Injecting meta data and generating SEO files from Firestore...');
  
  // Paths
  const envFile = path.join(process.cwd(), '.env.production');
  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  const robotsFile = path.join(process.cwd(), 'src/robots.txt');
  
  // Check if .env.production exists
  if (!fs.existsSync(envFile)) {
    log('red', '❌ .env.production file not found');
    log('yellow', '   Please run ./scripts/setup-firebase.sh first');
    process.exit(1);
  }
  
  // Check if template file exists
  if (!fs.existsSync(templateFile)) {
    log('red', '❌ src/index.html.template file not found');
    process.exit(1);
  }
  
  // Load environment variables
  log('blue', '📋 Loading environment variables from .env.production...');
  const envVars = loadEnvFile(envFile);
  
  // Initialize Firebase Admin SDK
  const db = await initializeFirebase(envVars);
  
  // Create URL resolver for production
  const urlResolver = StorageUrlResolver.createFromEnv(envVars, false);
  log('green', '✅ Storage URL resolver initialized for production');
  
  // Fetch site settings from Firestore
  const siteSettings = await fetchSiteSettings(db);
  
  // Fetch contact info from Firestore
  const contactInfo = await fetchContactInfo(db);
  
  // Fetch portfolio items from Firestore (with URL resolution)
  const portfolioItems = await fetchPortfolioItems(db, urlResolver);
  
  // Generate index.html from template
  log('blue', '📋 Generating index.html from template...');
  const indexContent = generateIndexFromTemplate(templateFile, siteSettings, contactInfo);
  
  // Generate SEO files
  log('blue', '📋 Generating SEO files...');
  const robotsContent = generateRobotsTxt(siteSettings);
  
  // Write all files (sitemaps are now dynamic Angular routes)
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
  log('blue', '📋 Generated files summary:');
  console.log(`   🏷️  Site Name: ${siteSettings.siteName}`);
  console.log(`   🌐 Site URL: ${siteSettings.siteUrl}`);
  console.log(`   📝 Description: ${siteSettings.siteDescription.substring(0, 50)}...`);
  console.log(`   🔍 Keywords: ${siteSettings.siteKeywords.substring(0, 60)}...`);
  console.log(`   📁 Portfolio Items: ${portfolioItems.length} published items`);
  console.log(`   📄 Static Files Generated: 2 files (index.html, robots.txt)`);
  console.log(`   🌐 Dynamic Sitemaps: Available at /sitemap.html and /sitemap.xml`);
  
  log('green', '🎉 Meta data injection and SEO file generation completed successfully!');
  
  // Clean up Firebase connection
  await admin.app().delete();
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});