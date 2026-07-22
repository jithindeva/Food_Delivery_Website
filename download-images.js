import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'src', 'data.js');
const MAIN_FILE = path.join(__dirname, 'src', 'main.js');
const HTML_FILE = path.join(__dirname, 'index.html');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Read contents of data.js, main.js and index.html
let dataContent = fs.readFileSync(DATA_FILE, 'utf8');
let mainContent = fs.readFileSync(MAIN_FILE, 'utf8');
let htmlContent = fs.readFileSync(HTML_FILE, 'utf8');

// Regex patterns to find image URLs (handles all quote styles and gstatic URLs)
const patterns = [
  /image:\s*'(https?:\/\/[^']+)'/g,
  /image:\s*"(https?:\/\/[^"]+)"/g,
  /image:\s*`(https?:\/\/[^`]+)`/g,
  /src=\s*'(https?:\/\/[^']+)'/g,
  /src=\s*"(https?:\/\/[^"]+)"/g,
  /href=\s*'(https?:\/\/[^']+)'/g,
  /href=\s*"(https?:\/\/[^"]+)"/g,
];

const urlsToDownload = new Set();

// Extract URLs
for (const pattern of patterns) {
  let match;
  // Reset lastIndex for reuse
  pattern.lastIndex = 0;
  while ((match = pattern.exec(dataContent)) !== null) {
    const url = match[1];
    if (url.startsWith('http') && !url.includes('.css') && !url.includes('.js') && !url.includes('nominatim.openstreetmap.org')) {
      urlsToDownload.add(url);
    }
  }
  pattern.lastIndex = 0;
  while ((match = pattern.exec(htmlContent)) !== null) {
    const url = match[1];
    if (url.startsWith('http') && !url.includes('.css') && !url.includes('.js') && !url.includes('font-awesome') && !url.includes('cdnjs.cloudflare.com')) {
      urlsToDownload.add(url);
    }
  }
  pattern.lastIndex = 0;
  while ((match = pattern.exec(mainContent)) !== null) {
    const url = match[1];
    if (url.startsWith('http') && !url.includes('.css') && !url.includes('.js') && !url.includes('nominatim.openstreetmap.org')) {
      urlsToDownload.add(url);
    }
  }
}

console.log(`Found ${urlsToDownload.size} unique image URLs to download.`);

// We will map each URL to a local name
const urlMap = {};
let counter = 1;

async function downloadImage(url) {
  // Determine extension
  let ext = '.jpg'; // default
  if (url.includes('.png') || url.toLowerCase().includes('format=png') || url.toLowerCase().includes('.png?')) ext = '.png';
  else if (url.includes('.webp') || url.toLowerCase().includes('format=webp') || url.toLowerCase().includes('.webp?')) ext = '.webp';
  else if (url.includes('.svg') || url.toLowerCase().includes('format=svg') || url.toLowerCase().includes('.svg?')) ext = '.svg';
  else if (url.includes('.gif') || url.toLowerCase().includes('format=gif') || url.toLowerCase().includes('.gif?')) ext = '.gif';

  const filename = `img_${counter++}${ext}`;
  const filepath = path.join(IMAGES_DIR, filename);
  const relativePath = `/images/${filename}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    urlMap[url] = relativePath;
    console.log(`Downloaded: ${url} -> ${relativePath}`);
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
  }
}

async function main() {
  const urlList = Array.from(urlsToDownload);
  
  // Download in batches of 10 to avoid hitting limits or socket hang-ups
  const batchSize = 10;
  for (let i = 0; i < urlList.length; i += batchSize) {
    const batch = urlList.slice(i, i + batchSize);
    console.log(`Downloading batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(urlList.length / batchSize)}...`);
    await Promise.all(batch.map(url => downloadImage(url)));
  }

  // Now perform replacement in data.js, main.js and index.html
  let updatedDataContent = dataContent;
  let updatedHtmlContent = htmlContent;
  let updatedMainContent = mainContent;

  for (const [originalUrl, localPath] of Object.entries(urlMap)) {
    // Escape special regex characters in originalUrl
    const escapedUrl = originalUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    updatedDataContent = updatedDataContent.replace(regex, localPath);
    updatedHtmlContent = updatedHtmlContent.replace(regex, localPath);
    updatedMainContent = updatedMainContent.replace(regex, localPath);
  }

  fs.writeFileSync(DATA_FILE, updatedDataContent, 'utf8');
  fs.writeFileSync(HTML_FILE, updatedHtmlContent, 'utf8');
  fs.writeFileSync(MAIN_FILE, updatedMainContent, 'utf8');

  console.log('Successfully updated src/data.js, src/main.js, and index.html with local links!');
}

main();
