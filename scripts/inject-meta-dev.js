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
    
    // Add sitemap link at the bottom of the page
    const sitemapLink = `  <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    <a href="/sitemap.html" style="color: #999; text-decoration: none;">Sitemap</a>
  </div>
`;
    content = content.replace('</body>', `${sitemapLink}</body>`);
    
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

function generateSitemapXml(siteSettings, portfolioItems) {
  const baseUrl = siteSettings.siteUrl.endsWith('/') ? siteSettings.siteUrl.slice(0, -1) : siteSettings.siteUrl;
  const now = new Date().toISOString();
  
  // Static pages with priorities
  const staticPages = [
    { url: `${baseUrl}/home`, priority: '1.0', changefreq: 'weekly' },
    { url: `${baseUrl}/art`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/exhibition`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' }
  ];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add sitemap.html entry first with high priority
  xml += `  <url>
    <loc>${escapeXml(baseUrl)}/sitemap.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Add portfolio pages and individual gallery items
  portfolioItems.forEach(item => {
    let lastmod;
    try {
      if (item.createdAt instanceof Date) {
        lastmod = item.createdAt.toISOString();
      } else if (item.createdAt && typeof (item.createdAt).toDate === 'function') {
        // Firestore Timestamp object
        lastmod = item.createdAt.toDate().toISOString();
      } else if (item.createdAt) {
        lastmod = new Date(item.createdAt).toISOString();
      } else {
        lastmod = now;
      }
    } catch (error) {
      // Fallback to current time if date conversion fails
      lastmod = now;
    }
    
    // Add portfolio item page
    xml += `  <url>
    <loc>${escapeXml(baseUrl)}/portfolio/${escapeXml(item.id || '')}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    
    // Add individual gallery picture items (skip gallery folder URLs)
    if (item.galleries && item.galleries.length > 0) {
      item.galleries.forEach((gallery, galleryIndex) => {
        // Add individual picture URLs only (skip gallery folder URL)
        if (gallery.pictures && gallery.pictures.length > 0) {
          gallery.pictures.forEach((picture, pictureIndex) => {
            if (picture.imageUrl) {
              xml += `  <url>
    <loc>${escapeXml(baseUrl)}/portfolio/${escapeXml(item.id || '')}/galleries/${galleryIndex}/pictures/${pictureIndex}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
            }
          });
        }
      });
    }
  });

  xml += `</urlset>`;
  return xml;
}

function generateSitemapHtml(siteSettings, portfolioItems) {
  const lastUpdated = new Date().toISOString();
  const baseUrl = siteSettings.siteUrl.endsWith('/') ? siteSettings.siteUrl.slice(0, -1) : siteSettings.siteUrl;
  
  // Generate structured data for all portfolio artworks
  const artworkSchemas = [];
  portfolioItems.forEach(item => {
    if (item.galleries && item.galleries.length > 0) {
      item.galleries.forEach((gallery, galleryIndex) => {
        if (gallery.pictures && gallery.pictures.length > 0) {
          gallery.pictures.forEach((picture, pictureIndex) => {
            if (picture.imageUrl) {
              const artworkSchema = {
                "@context": "https://schema.org",
                "@type": ["Painting", "VisualArtwork"],
                "@id": `${baseUrl}/portfolio/${item.id}/galleries/${galleryIndex}/pictures/${pictureIndex}`,
                "name": gallery.title || gallery.description || `Gallery ${galleryIndex + 1}`,
                "description": picture.description || (gallery.title || gallery.description || `Artwork from ${item.title}`),
                "image": picture.imageUrl,
                "artist": {
                  "@type": "Person",
                  "@id": baseUrl,
                  "name": siteSettings.artistName || "Miyuki Nagai-Gubser",
                  "url": baseUrl,
                  "sameAs": [
                    "http://instagram.com/tribecaconcepts_art",
                    "https://www.linkedin.com/in/miyuki-nagai-gubser-91311477/"
                  ]
                }
              };
              
              // Add artwork details if they exist
              if (picture.artMedium) {
                artworkSchema.artMedium = picture.artMedium;
              }
              if (picture.dimensions && (picture.dimensions.width > 0 || picture.dimensions.height > 0)) {
                artworkSchema.width = {
                  "@type": "QuantitativeValue",
                  "value": picture.dimensions.width || 0,
                  "unitCode": "CMT"
                };
                artworkSchema.height = {
                  "@type": "QuantitativeValue", 
                  "value": picture.dimensions.height || 0,
                  "unitCode": "CMT"
                };
              }
              if (picture.price && picture.showPrice && picture.price > 0) {
                artworkSchema.offers = {
                  "@type": "Offer",
                  "price": picture.price,
                  "priceCurrency": "CHF",
                  "availability": picture.sold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
                };
              }
              
              artworkSchemas.push(artworkSchema);
            }
          });
        }
      });
    }
  });
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap - ${siteSettings.siteName}</title>
    <meta name="description" content="${siteSettings.siteDescription}">`;

  // Add structured data for artworks
  if (artworkSchemas.length > 0) {
    artworkSchemas.forEach(schema => {
      html += `
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>`;
    });
  }

  html += `
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            color: #333;
            line-height: 1.6;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 20px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        a {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
        }
        .description {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .portfolio-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .category {
            background: #ecf0f1;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            color: #2c3e50;
        }
        .galleries {
            margin-left: 20px;
            margin-top: 8px;
        }
        .gallery {
            margin-bottom: 12px;
        }
        .gallery-title {
            font-size: 0.9em;
            color: #2c3e50;
        }
        .pictures {
            margin: 4px 0 0 20px;
            list-style: none;
            padding: 0;
        }
        .pictures li {
            margin: 4px 0;
            border: none;
            padding: 0;
            font-size: 0.8em;
        }
        .picture-link {
            text-decoration: none;
            display: block;
        }
        .thumbnail {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #ddd;
            transition: transform 0.2s;
            margin-right: 8px;
            vertical-align: middle;
        }
        .thumbnail:hover {
            transform: scale(1.1);
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
        }
    </style>
</head>
<body>
    <div class="sitemap-container">
        <h1>Sitemap for ${siteSettings.siteName}</h1>
        <p class="description">${siteSettings.siteDescription}</p>

        <h2>Main Pages</h2>
        <ul class="main-pages">
            <li><a href="/home">Home</a><div class="description">Main landing page</div></li>
            <li><a href="/art">Art Portfolio</a><div class="description">Art and creative works</div></li>
            <li><a href="/exhibition">Exhibition</a><div class="description">Exhibition works and gallery displays</div></li>
            <li><a href="/about">About</a><div class="description">About the artist</div></li>
            <li><a href="/contact">Contact</a><div class="description">Get in touch</div></li>
        </ul>

        <h2>Portfolio Items</h2>`;

  if (portfolioItems.length > 0) {
    html += `
        <ul class="portfolio-items">`;
    
    portfolioItems.forEach(item => {
      html += `
            <li>
                <div class="portfolio-item">
                    <a href="/portfolio/${item.id}">${item.title}</a>
                    <span class="category">${item.category}</span>
                </div>`;
      
      // Gallery structure
      if (item.galleries && item.galleries.length > 0) {
        html += `
                <div class="galleries">`;
        
        item.galleries.forEach((gallery, galleryIndex) => {
          html += `
                    <div class="gallery">`;
          
          if (gallery.pictures && gallery.pictures.length > 0) {
            html += `
                        <ul class="pictures">`;
            
            gallery.pictures.forEach((picture, pictureIndex) => {
              const altText = picture.alt || picture.description;
              // Use Gallery Title as description, fallback to picture description or alt
              const displayText = gallery.title || gallery.description || picture.description || picture.alt;
              
              html += `
                            <li>
                                <a href="/portfolio/${item.id}/galleries/${galleryIndex}/pictures/${pictureIndex}" class="picture-link">
                                    <img src="${picture.imageUrl || ''}"${altText ? ` 
                                         alt="${altText}"` : ''} 
                                         class="thumbnail">${displayText ? `
                                    ${displayText}` : ''}
                                </a>
                            </li>`;
            });
            
            html += `
                        </ul>`;
          }
          
          html += `
                    </div>`;
        });
        
        html += `
                </div>`;
      }
      
      html += `
            </li>`;
    });
    
    html += `
        </ul>`;
  } else {
    html += `
        <p class="description">No portfolio items available.</p>`;
  }

  html += `
        
        <div class="footer">
            <div class="description">
                Last updated: ${new Date(lastUpdated).toLocaleString()}<br>
                <a href="/sitemap.xml">XML Sitemap</a>
            </div>
        </div>
    </div>
</body>
</html>`;

  return html;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}



async function main() {
  log('blue', '🔧 Generating SEO files for development...');
  
  // Paths
  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  const robotsFile = path.join(process.cwd(), 'src/robots.txt');
  const sitemapXmlFile = path.join(process.cwd(), 'src/sitemap.xml');
  const sitemapHtmlFile = path.join(process.cwd(), 'src/sitemap.html');
  
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
  const sitemapXmlContent = generateSitemapXml(siteSettings, portfolioItems);
  const sitemapHtmlContent = generateSitemapHtml(siteSettings, portfolioItems);
  
  // Prepare files to write (now including static sitemaps)
  log('blue', '📋 Preparing files (static sitemaps for crawler compatibility)...');
  const filesToWrite = [
    { path: indexFile, content: indexContent, name: 'index.html' },
    { path: robotsFile, content: robotsContent, name: 'robots.txt' },
    { path: sitemapXmlFile, content: sitemapXmlContent, name: 'sitemap.xml' },
    { path: sitemapHtmlFile, content: sitemapHtmlContent, name: 'sitemap.html' }
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
  console.log(`   📄 Static Files Generated: 4 files (index.html, robots.txt, sitemap.xml, sitemap.html)`);
  console.log(`   🌐 Static Sitemaps: Available at /sitemap.html and /sitemap.xml (crawler-friendly)`);
  
  log('green', '🎉 Development SEO file generation completed successfully!');

  // Clean up Firebase connection if it exists
  if (db) {
    try {
      await admin.app().delete();
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Force exit since Firebase SDK may keep connections alive
  process.exit(0);
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});