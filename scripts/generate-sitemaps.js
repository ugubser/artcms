#!/usr/bin/env node

/**
 * Post-build script: injects production Firestore data into the built output.
 *
 * 1. Generates static sitemap.xml (crawlers parse it without JS)
 * 2. Patches index.html meta tags with real settings from Firestore
 *    (replaces the hardcoded defaults from inject-meta-simple.js)
 *
 * sitemap.html is left to the Angular SitemapHtmlComponent (dynamic, JS-rendered).
 *
 * Run after `ng build --configuration production` so that
 * dist/tribeca-concepts-clone/browser/ already exists.
 *
 * Expects Firebase env vars to be loaded (source .env.production):
 *   FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET,
 *   FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_AUTH_DOMAIN
 *
 * Optional: SITE_URL (defaults to https://tribecaconcepts.com)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('❌ FIREBASE_PROJECT_ID is not set. Source .env.production first.');
  process.exit(1);
}

const SITE_URL = (process.env.SITE_URL || 'https://tribecaconcepts.com').replace(/\/+$/, '');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'dist', 'tribeca-concepts-clone', 'browser');

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchPublishedPortfolio() {
  const q = query(
    collection(db, 'portfolio'),
    where('published', '==', true),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchPortfolioPages() {
  const snap = await getDocs(collection(db, 'portfolio-pages'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.slug && p.order != null)
    .sort((a, b) => a.order - b.order);
}

async function fetchSettings() {
  const snap = await getDocs(collection(db, 'settings'));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toISODate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value.seconds != null) return new Date(value.seconds * 1000).toISOString();
  try { return new Date(value).toISOString(); } catch { return null; }
}

// ---------------------------------------------------------------------------
// sitemap.xml generation  (mirrors SitemapXmlComponent)
// ---------------------------------------------------------------------------

function generateSitemapXml(portfolioItems, portfolioPages) {
  const now = new Date().toISOString();

  const staticPages = [
    { url: `${SITE_URL}/home`, priority: '1.0', changefreq: 'weekly' },
    ...portfolioPages.map(p => ({ url: `${SITE_URL}/${p.slug}`, priority: '0.9', changefreq: 'weekly' })),
    { url: `${SITE_URL}/about`, priority: '0.8', changefreq: 'monthly' },
    { url: `${SITE_URL}/contact`, priority: '0.7', changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${escapeXml(page.url)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  for (const item of portfolioItems) {
    const lastmod = toISODate(item.createdAt) || now;

    xml += `  <url>\n    <loc>${escapeXml(SITE_URL)}/portfolio/${escapeXml(item.id)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    if (item.galleries && item.galleries.length > 0) {
      item.galleries.forEach((gallery, gIdx) => {
        // Gallery-only URLs are not routable -- only include individual picture URLs
        if (gallery.pictures && gallery.pictures.length > 0) {
          gallery.pictures.forEach((pic, pIdx) => {
            if (pic.imageUrl) {
              xml += `  <url>\n    <loc>${escapeXml(SITE_URL)}/portfolio/${escapeXml(item.id)}/galleries/${gIdx}/pictures/${pIdx}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
            }
          });
        }
      });
    }
  }

  xml += `</urlset>`;
  return xml;
}

// ---------------------------------------------------------------------------
// index.html meta injection  (mirrors MetaService)
// ---------------------------------------------------------------------------

function patchIndexHtml(settings) {
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  index.html not found in build output, skipping meta injection');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  const siteName = settings.siteName || 'Tribecaconcepts';
  const siteDescription = settings.siteDescription || '';
  const siteKeywords = Array.isArray(settings.siteKeywords)
    ? settings.siteKeywords.join(', ')
    : (settings.siteKeywords || '');

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(siteName)}</title>`);

  // Replace meta tags by name/property attribute
  const metaReplacements = [
    { attr: 'name', key: 'description', value: siteDescription },
    { attr: 'name', key: 'keywords', value: siteKeywords },
    { attr: 'name', key: 'author', value: siteName },
    { attr: 'property', key: 'og:title', value: siteName },
    { attr: 'property', key: 'og:description', value: siteDescription },
  ];

  for (const { attr, key, value } of metaReplacements) {
    const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")([^"]*)(")`, 'i');
    html = html.replace(re, `$1${escapeAttr(value)}$3`);
  }

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`✅ Patched ${indexPath} with Firestore meta data`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`❌ Build output directory not found: ${OUTPUT_DIR}`);
    console.error('   Run "ng build --configuration production" first.');
    process.exit(1);
  }

  console.log(`Fetching data from Firestore (project: ${firebaseConfig.projectId})...`);

  const [portfolioItems, portfolioPages, settings] = await Promise.all([
    fetchPublishedPortfolio(),
    fetchPortfolioPages(),
    fetchSettings(),
  ]);

  console.log(`  Portfolio items: ${portfolioItems.length}`);
  console.log(`  Portfolio pages: ${portfolioPages.length}`);
  console.log(`  Settings: ${settings ? 'loaded' : 'not found (using defaults)'}`);

  // Generate sitemap.xml
  const xmlContent = generateSitemapXml(portfolioItems, portfolioPages);
  const xmlPath = path.join(OUTPUT_DIR, 'sitemap.xml');
  fs.writeFileSync(xmlPath, xmlContent, 'utf-8');
  console.log(`✅ Written ${xmlPath}`);

  // Patch index.html with real meta data from Firestore
  if (settings) {
    patchIndexHtml(settings);
  } else {
    console.warn('⚠️  No settings found in Firestore, index.html keeps hardcoded defaults');
  }

  // Clean up Firebase app
  const { deleteApp } = require('firebase/app');
  await deleteApp(app);
}

main().catch(err => {
  console.error('❌ Sitemap generation failed:', err.message);
  process.exit(1);
});
