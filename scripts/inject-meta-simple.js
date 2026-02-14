#!/usr/bin/env node

/**
 * Simple Meta Data Injection Script (no database required)
 *
 * Generates src/index.html and src/robots.txt from templates with hardcoded defaults.
 * MetaService overwrites meta tags at runtime from Firestore settings.
 * Sitemaps are served dynamically by SitemapXmlComponent and SitemapHtmlComponent.
 *
 * Usage: node scripts/inject-meta-simple.js
 */

const fs = require('fs');
const path = require('path');

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

function main() {
  log('blue', 'Generating index.html and robots.txt (no database required)...');

  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  const robotsFile = path.join(process.cwd(), 'src/robots.txt');

  // Check if template file exists
  if (!fs.existsSync(templateFile)) {
    log('red', 'src/index.html.template file not found');
    process.exit(1);
  }

  // Default values (MetaService overwrites these at runtime from Firestore)
  const defaults = {
    siteName: 'Tribecaconcepts',
    siteDescription: 'MIYUKI NAGAI-GUBSER @ TribeCa conceptS',
    siteKeywords: 'portfolio, art, abstract, paintings, visual, expression, mindmap, emotions, memories',
    faviconUrl: 'favicon.ico'
  };

  // Generate index.html from template
  let indexContent = fs.readFileSync(templateFile, 'utf8');
  indexContent = indexContent.replace(/{{SITE_NAME}}/g, defaults.siteName);
  indexContent = indexContent.replace(/{{SITE_DESCRIPTION}}/g, defaults.siteDescription);
  indexContent = indexContent.replace(/{{SITE_KEYWORDS}}/g, defaults.siteKeywords);
  indexContent = indexContent.replace(/{{FAVICON_URL}}/g, defaults.faviconUrl);

  // Generate robots.txt
  const robotsContent = `User-agent: *
Allow: /

Sitemap: /sitemap.xml
`;

  // Write files
  try {
    fs.writeFileSync(indexFile, indexContent, 'utf8');
    log('green', 'index.html generated successfully');

    fs.writeFileSync(robotsFile, robotsContent, 'utf8');
    log('green', 'robots.txt generated successfully');
  } catch (error) {
    log('red', `Error writing files: ${error.message}`);
    process.exit(1);
  }

  log('green', 'Meta injection completed (no database connection needed)');
}

main();
