import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGES_DIR = path.resolve(__dirname, 'public/images');
const DATA_FILE = path.resolve(__dirname, 'src/data.js');

// All 30 non-veg Google image URLs (in order, nv-1 to nv-30)
const nonVegImages = [
  { id: 'cat-nv-1',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTtWQFgd3t1sPPSxlnk-0TT5KOM6GnliFxVKqudAMSTA&s=10' },
  { id: 'cat-nv-2',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxKkA18YcK0Z0Bxx0o5smfQC6gSSPeR90ivQXswKQ4Aw&s=10' },
  { id: 'cat-nv-3',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhmER0x8S7nz8WpJR1wUqOwOEkJvYjYsuFTMdq5uulNw&s=10' },
  { id: 'cat-nv-4',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfIvNQcAV08qoawZBUPz2omRJeKTreGD7AvoDSJs3lUw&s=10' },
  { id: 'cat-nv-5',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-juI4qbwWpiQbtj8X0W759x73_j0y220HAZKqaA6dvg&s=10' },
  { id: 'cat-nv-6',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6bainQnj3XTHQy2qxi48zhdN1kihvMvHJlzw_g_251g&s=10' },
  { id: 'cat-nv-7',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrz4IWvLXkZeFj_017hMs6QuNYEMMv92WCRhwsTaYNmg&s=10' },
  { id: 'cat-nv-8',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXmOIpJxM4wd9suQ5bfc00_gkLjiHPGQi9SnxOyxDNpw&s=10' },
  { id: 'cat-nv-9',  url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlBt-0fettiFSbspntyiBx5r_blL98tTjN8dFGvs2uew&s=10' },
  { id: 'cat-nv-10', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbNi4mHWJNH3q7mw1GPL90LCt0GIsefAbOuyJF2CqRDw&s=10' },
  { id: 'cat-nv-11', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmqYZioDKBrqkLMt3lNTjNu_hbL2m6C4A42JfvrEt_bA&s=10' },
  { id: 'cat-nv-12', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCLCMBqpPbGixWKafeh4aLsKpnUUGImPgc4YpeLwtTog&s=10' },
  { id: 'cat-nv-13', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8VQk7U_XSGAeBgcfBvHrwFQmjL6VwemF-FoOfr9qsNg&s=10' },
  { id: 'cat-nv-14', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHuwtrkV3XY-V6h8fjKLM0Y534nl8-hnpdudCsk9FNcA&s=10' },
  { id: 'cat-nv-15', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE4LodOqH3XpSIEJ6Zdwe5I3oHuWmtpM8EgveuV2BTqA&s=10' },
  { id: 'cat-nv-16', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqn306wrhlJ_kUmB9sP1ikPJ-R_RYrhU2f8XkXuzvq7Q&s=10' },
  { id: 'cat-nv-17', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAbUgBVkdEi9loVrA829hp7_z_BpLg7vxsOZgAJNxM9g&s=10' },
  { id: 'cat-nv-18', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrzOGWptzHNjSIAhD4WcknpRR04fljEpTrsaLzCwPEJQ&s=10' },
  { id: 'cat-nv-19', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk0XMJeV_p0SMZ1gyIFU1hI2_vB1aj5JCePFZ8_8iCvg&s=10' },
  { id: 'cat-nv-20', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3_XWp8z1dC_1v4pQGbMFdkMj2nXwNxPX3caXAVxkp5A&s=10' },
  { id: 'cat-nv-21', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAGb4GlhonJ7KfUeJ_xEd2nEx9BJwmtQVeXysB-9weBg&s=10' },
  { id: 'cat-nv-22', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1PAasY9umeH_QkMivxrxeY6Z40s-eE98JYQHtCXuEjQ&s=10' },
  { id: 'cat-nv-23', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStQLPdcfAtuNdfZQW-3O13Ddi8o-10cMN1rTiFs8KhzA&s=10' },
  { id: 'cat-nv-24', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_2T-kUrbm7i-xFfNWoO5QRbC3HfxGJJTYc88ya8JiUg&s=10' },
  { id: 'cat-nv-25', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR84wl77B7jgi47eBK3YjCzfaf7MFSOjbAxYDhSQFi8QQ&s=10' },
  { id: 'cat-nv-26', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD7kC-U5VLc77hDxYgQRSxI0WUnaizNXHa--roAW-OAQ&s=10' },
  { id: 'cat-nv-27', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXxUjLHp4KX890SQGPAHita6JbcdQXnvEfHRZnEw2dw&s=10' },
  { id: 'cat-nv-28', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROaJ_UaJxVMVInq4dYrvxzk-y2qA8_aXjyfUeo2YvkRg&s' },
  { id: 'cat-nv-29', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHPAgk4UzYA9fy3hZ7rQn28-F9Q9ENhf4d_ZH6gbHboA&s=10' },
  { id: 'cat-nv-30', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-bGvdaOLLDQloSdlAOs8gkOPH76sAspqah3CgpUrFbQ&s=10' },
];

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filepath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`OK Downloaded: ${filename}`);
    return true;
  } catch (err) {
    console.error(`FAIL: ${filename} - ${err.message}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Find next available image number
  const files = fs.readdirSync(IMAGES_DIR);
  const maxNum = files.reduce((max, f) => {
    const m = f.match(/img_(\d+)/);
    return m ? Math.max(max, parseInt(m[1])) : max;
  }, 0);

  let counter = maxNum + 1;
  console.log(`Starting from img_${counter}.jpg`);

  const idToPath = {};

  for (const item of nonVegImages) {
    const filename = `img_${counter}.jpg`;
    const ok = await downloadImage(item.url, filename);
    idToPath[item.id] = ok ? `/images/${filename}` : null;
    counter++;
  }

  // Update data.js - replace image field for each non-veg id
  let content = fs.readFileSync(DATA_FILE, 'utf8');
  let updatedCount = 0;

  for (const [id, localPath] of Object.entries(idToPath)) {
    if (!localPath) continue;
    const regex = new RegExp(
      `(\\{ id: '${id}',[^}]*image: ')[^']*('[^}]*isVeg: false \\})`,
      'g'
    );
    const before = content;
    content = content.replace(regex, `$1${localPath}$2`);
    if (content !== before) {
      updatedCount++;
      console.log(`Updated: ${id} -> ${localPath}`);
    }
  }

  fs.writeFileSync(DATA_FILE, content, 'utf8');
  console.log(`\nDone! Updated ${updatedCount}/30 non-veg image paths in data.js`);
}

main();
