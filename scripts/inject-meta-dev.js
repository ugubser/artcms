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

async function initializeFirebaseEmulator() {
  try {
    // Initialize Firebase Admin SDK for emulator
    admin.initializeApp({
      projectId: 'tribecaconcepts-dev', // Default emulator project ID
    });
    
    // Configure for emulator
    process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
    
    log('green', '✅ Firebase Admin SDK initialized for emulator');
    return admin.firestore();
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
    siteUrl: 'http://localhost:5050'
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
      siteUrl: settings.siteUrl || defaultSettings.siteUrl
    };
  } catch (error) {
    log('yellow', `⚠️  Error fetching from emulator: ${error.message}, using defaults`);
    return defaultSettings;
  }
}

async function fetchPortfolioItemsDev(db) {
  const defaultItems = [
    { id: 'sample-art-1', title: 'Sample Art Piece', createdAt: new Date(), category: 'art' },
    { id: 'sample-design-1', title: 'Sample Design Work', createdAt: new Date(), category: 'graphic-design' }
  ];

  if (!db) {
    log('blue', '📋 Using default portfolio items...');
    return defaultItems;
  }

  try {
    log('blue', '📋 Fetching portfolio items from emulator...');
    
    const portfolioSnapshot = await db.collection('portfolio')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    const portfolioItems = [];
    portfolioSnapshot.forEach(doc => {
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
      
      portfolioItems.push({
        id: doc.id,
        title: data.title || 'Untitled',
        createdAt: createdAt,
        category: data.category || 'portfolio'
      });
    });
    
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

function generateIndexFromTemplate(templatePath, siteSettings) {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all template variables with actual values
    content = content.replace(/{{SITE_NAME}}/g, siteSettings.siteName);
    content = content.replace(/{{SITE_DESCRIPTION}}/g, siteSettings.siteDescription);
    content = content.replace(/{{SITE_KEYWORDS}}/g, siteSettings.siteKeywords);
    content = content.replace(/{{FAVICON_URL}}/g, siteSettings.faviconUrl);
    
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
  const baseUrl = siteSettings.siteUrl.endsWith('/') 
    ? siteSettings.siteUrl.slice(0, -1) 
    : siteSettings.siteUrl;
  
  const now = new Date().toISOString();
  
  // Static pages with priorities
  const staticPages = [
    { url: `${baseUrl}/home`, priority: '1.0', changefreq: 'weekly' },
    { url: `${baseUrl}/art`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/design`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' }
  ];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Add portfolio pages
  portfolioItems.forEach(item => {
    let lastmod;
    try {
      if (item.createdAt instanceof Date) {
        lastmod = item.createdAt.toISOString();
      } else if (item.createdAt && item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
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
    
    xml += `  <url>
    <loc>${baseUrl}/portfolio/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}

function generateSitemapHtml(siteSettings, portfolioItems) {
  const baseUrl = siteSettings.siteUrl.endsWith('/') 
    ? siteSettings.siteUrl.slice(0, -1) 
    : siteSettings.siteUrl;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitemap - ${siteSettings.siteName}</title>
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
    .dev-notice {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 20px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="dev-notice">
    🔧 Development Version - URLs point to localhost:5050
  </div>
  
  <h1>Sitemap for ${siteSettings.siteName}</h1>
  <p class="description">${siteSettings.siteDescription}</p>

  <h2>Main Pages</h2>
  <ul>
    <li><a href="${baseUrl}/home">Home</a><div class="description">Main landing page</div></li>
    <li><a href="${baseUrl}/art">Art Portfolio</a><div class="description">Art and creative works</div></li>
    <li><a href="${baseUrl}/design">Design Portfolio</a><div class="description">Graphic design projects</div></li>
    <li><a href="${baseUrl}/about">About</a><div class="description">About the artist</div></li>
    <li><a href="${baseUrl}/contact">Contact</a><div class="description">Get in touch</div></li>
  </ul>

  <h2>Portfolio Items (${portfolioItems.length} items)</h2>
  <ul>
`;

  portfolioItems.forEach(item => {
    html += `    <li>
      <div class="portfolio-item">
        <a href="${baseUrl}/portfolio/${item.id}">${item.title}</a>
        <span class="category">${item.category}</span>
      </div>
    </li>
`;
  });

  html += `  </ul>
  
  <div class="description" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
    Last updated: ${new Date().toLocaleDateString()} (Development)
  </div>
</body>
</html>`;

  return html;
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
  const db = await initializeFirebaseEmulator();
  
  // Fetch site settings (from emulator or defaults)
  const siteSettings = await fetchSiteSettingsDev(db);
  
  // Fetch portfolio items (from emulator or defaults)
  const portfolioItems = await fetchPortfolioItemsDev(db);
  
  // Generate index.html from template
  log('blue', '📋 Generating index.html from template...');
  const indexContent = generateIndexFromTemplate(templateFile, siteSettings);
  
  // Generate SEO files
  log('blue', '📋 Generating SEO files...');
  const robotsContent = generateRobotsTxt(siteSettings);
  const sitemapXmlContent = generateSitemapXml(siteSettings, portfolioItems);
  const sitemapHtmlContent = generateSitemapHtml(siteSettings, portfolioItems);
  
  // Write all files
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
  console.log(`   🎨 Static Pages: 5 pages (home, art, design, about, contact)`);
  console.log(`   📄 Total URLs in sitemap: ${5 + portfolioItems.length} URLs`);
  
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