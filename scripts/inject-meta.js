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
      siteUrl: settings.siteUrl || 'https://tribecaconcepts.com'
    };
  } catch (error) {
    log('red', `❌ Error fetching site settings: ${error.message}`);
    process.exit(1);
  }
}

async function fetchPortfolioItems(db) {
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
  </style>
</head>
<body>
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
    Last updated: ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;

  return html;
}

async function main() {
  log('blue', '🔧 Injecting meta data and generating SEO files from Firestore...');
  
  // Paths
  const envFile = path.join(process.cwd(), '.env.production');
  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  const robotsFile = path.join(process.cwd(), 'src/robots.txt');
  const sitemapXmlFile = path.join(process.cwd(), 'src/sitemap.xml');
  const sitemapHtmlFile = path.join(process.cwd(), 'src/sitemap.html');
  
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
  
  // Fetch site settings from Firestore
  const siteSettings = await fetchSiteSettings(db);
  
  // Fetch portfolio items from Firestore
  const portfolioItems = await fetchPortfolioItems(db);
  
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
  log('blue', '📋 Generated files summary:');
  console.log(`   🏷️  Site Name: ${siteSettings.siteName}`);
  console.log(`   🌐 Site URL: ${siteSettings.siteUrl}`);
  console.log(`   📝 Description: ${siteSettings.siteDescription.substring(0, 50)}...`);
  console.log(`   🔍 Keywords: ${siteSettings.siteKeywords.substring(0, 60)}...`);
  console.log(`   📁 Portfolio Items: ${portfolioItems.length} published items`);
  console.log(`   🎨 Static Pages: 5 pages (home, art, design, about, contact)`);
  console.log(`   📄 Total URLs in sitemap: ${5 + portfolioItems.length} URLs`);
  
  log('green', '🎉 Meta data injection and SEO file generation completed successfully!');
  
  // Clean up Firebase connection
  await admin.app().delete();
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});