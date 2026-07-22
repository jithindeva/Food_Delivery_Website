import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

let isBuild = false;

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'resolve-paths-for-file-protocol',
      configResolved(config) {
        isBuild = config.command === 'build';
      },
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          if (isBuild) {
            return html
              .replace(/type="module"/g, 'defer')
              .replace(/crossorigin/g, '')
              .replace(/"\/images\//g, '"images/')
              .replace(/'\/images\//g, "'images/");
          }
          return html;
        }
      },
      renderChunk(code) {
        if (isBuild) {
          return {
            code: code
              .replace(/"\/images\//g, '"images/')
              .replace(/'\/images\//g, "'images/")
          };
        }
        return null;
      }
    },
    {
      name: 'vite-plugin-image-downloader',
      configureServer(server) {
        // Watch for data.js and index.html changes
        server.watcher.on('change', async (filePath) => {
          const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
          if (normalizedPath.endsWith('/src/data.js') || normalizedPath.endsWith('src/data.js') || normalizedPath.endsWith('/src/main.js') || normalizedPath.endsWith('src/main.js') || normalizedPath.endsWith('/index.html') || normalizedPath.endsWith('index.html')) {
            console.log(`[Image Downloader] Detected change in ${path.basename(filePath)}, checking for external image URLs...`);
            
            const DATA_FILE = path.resolve('src/data.js');
            const MAIN_FILE = path.resolve('src/main.js');
            const HTML_FILE = path.resolve('index.html');
            const IMAGES_DIR = path.resolve('public/images');

            if (!fs.existsSync(IMAGES_DIR)) {
              fs.mkdirSync(IMAGES_DIR, { recursive: true });
            }

            let dataContent = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : '';
            let mainContent = fs.existsSync(MAIN_FILE) ? fs.readFileSync(MAIN_FILE, 'utf8') : '';
            let htmlContent = fs.existsSync(HTML_FILE) ? fs.readFileSync(HTML_FILE, 'utf8') : '';

            // Regex patterns to find image URLs
            const patterns = [
              /image:\s*['"`](https?:\/\/[^'"`]+)['"`]/g,
              /src=\s*['"`](https?:\/\/[^'"`]+)['"`]/g,
              /href=\s*['"`](https?:\/\/[^'"`]+)['"`]/g
            ];

            const urlsToDownload = new Set();

            for (const pattern of patterns) {
              let match;
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

            if (urlsToDownload.size === 0) return;

            console.log(`[Image Downloader] Found ${urlsToDownload.size} external image URLs to process.`);

            // Get existing files in images directory to determine counter start
            let counter = 1;
            try {
              const files = fs.readdirSync(IMAGES_DIR);
              const numbers = files
                .map(f => {
                  const match = f.match(/img_(\d+)/);
                  return match ? parseInt(match[1]) : 0;
                });
              if (numbers.length > 0) {
                counter = Math.max(...numbers) + 1;
              }
            } catch (e) {}

            const urlMap = {};
            let downloadedCount = 0;

            const downloadImage = async (url) => {
              let ext = '.jpg';
              if (url.includes('.png') || url.toLowerCase().includes('format=png') || url.toLowerCase().includes('.png?')) ext = '.png';
              else if (url.includes('.webp') || url.toLowerCase().includes('format=webp') || url.toLowerCase().includes('.webp?')) ext = '.webp';
              else if (url.includes('.svg') || url.toLowerCase().includes('format=svg') || url.toLowerCase().includes('.svg?')) ext = '.svg';
              else if (url.includes('.gif') || url.toLowerCase().includes('format=gif') || url.toLowerCase().includes('.gif?')) ext = '.gif';

              const filename = `img_${counter++}${ext}`;
              const filepath = path.join(IMAGES_DIR, filename);
              const relativePath = `images/${filename}`;

              try {
                const response = await fetch(url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const buffer = Buffer.from(await response.arrayBuffer());
                fs.writeFileSync(filepath, buffer);
                urlMap[url] = relativePath;
                downloadedCount++;
                console.log(`[Image Downloader] Downloaded: ${url} -> ${relativePath}`);
              } catch (error) {
                console.error(`[Image Downloader] Failed to download ${url}: ${error.message}`);
              }
            };

            // Download in batches
            const urlList = Array.from(urlsToDownload);
            const batchSize = 5;
            for (let i = 0; i < urlList.length; i += batchSize) {
              const batch = urlList.slice(i, i + batchSize);
              await Promise.all(batch.map(url => downloadImage(url)));
            }

            if (downloadedCount > 0) {
              let updatedDataContent = dataContent;
              let updatedMainContent = mainContent;
              let updatedHtmlContent = htmlContent;

              for (const [originalUrl, localPath] of Object.entries(urlMap)) {
                const escapedUrl = originalUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escapedUrl, 'g');
                updatedDataContent = updatedDataContent.replace(regex, localPath);
                updatedMainContent = updatedMainContent.replace(regex, localPath);
                updatedHtmlContent = updatedHtmlContent.replace(regex, localPath);
              }

              fs.writeFileSync(DATA_FILE, updatedDataContent, 'utf8');
              fs.writeFileSync(MAIN_FILE, updatedMainContent, 'utf8');
              fs.writeFileSync(HTML_FILE, updatedHtmlContent, 'utf8');
              console.log(`[Image Downloader] Successfully downloaded ${downloadedCount} images and updated files!`);
            }
          }
        });
      }
    }
  ]
});
