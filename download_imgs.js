import https from 'https';
import http from 'http';
import fs from 'fs';

const downloads = [
  { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAz_QlKv_FEO63fmab7uUJ_WfdGCqRiAxBCP7hThfbjw&s=10', dest: 'public/images/img_333.jpg', name: 'PG Spl Biryani (99-1)' },
  { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLmNpI44fbBoJxRTM-gvqZTWQWL2a04S0Yg1N2RJIdyw&s=10', dest: 'public/images/img_334.jpg', name: 'Deluxe Veg Thali (99-2)' },
  { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlSuDjE_xhZkda6nPD-m0PCJzNrCAj-YJQJmzZ-AJylQ&s=10', dest: 'public/images/img_335.jpg', name: 'Ghar Jaisa Rajma Chawal (99-3)' },
  { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwrsVens4gI-Q0wzuUoXfCcwA3nChFSuuuGaFVq-bB4A&s=10', dest: 'public/images/img_336.jpg', name: 'Paneer Butter Masala Combo (99-4)' },
  { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8UWUV9baROUQ5TbxPCCllsqjxMn33XgezOc11hw_C7w&s=10', dest: 'public/images/img_337.jpg', name: 'Egg Curry Rice Combo (99-5)' },
];

function downloadImage(url, destPath, name) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const lib = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      }
    };
    lib.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        downloadImage(response.headers.location, destPath, name).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch(e) {}
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(destPath).size;
        console.log(`✅ [${name}] -> ${destPath} (${size} bytes)`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch(e) {}
      reject(err);
    });
  });
}

async function main() {
  console.log(`\n📥 Downloading ${downloads.length} NinetyNineStore images...\n`);
  for (const item of downloads) {
    try {
      await downloadImage(item.url, item.dest, item.name);
    } catch(e) {
      console.error(`❌ Failed [${item.name}]: ${e.message}`);
    }
  }

  // Update data.js: replace external URLs with local paths
  let content = fs.readFileSync('src/data.js', 'utf8');
  const replacements = {
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAz_QlKv_FEO63fmab7uUJ_WfdGCqRiAxBCP7hThfbjw&s=10': '/images/img_333.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLmNpI44fbBoJxRTM-gvqZTWQWL2a04S0Yg1N2RJIdyw&s=10': '/images/img_334.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlSuDjE_xhZkda6nPD-m0PCJzNrCAj-YJQJmzZ-AJylQ&s=10': '/images/img_335.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwrsVens4gI-Q0wzuUoXfCcwA3nChFSuuuGaFVq-bB4A&s=10': '/images/img_336.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8UWUV9baROUQ5TbxPCCllsqjxMn33XgezOc11hw_C7w&s=10': '/images/img_337.jpg',
  };

  let count = 0;
  for (const [extUrl, localPath] of Object.entries(replacements)) {
    if (content.includes(extUrl)) {
      content = content.split(extUrl).join(localPath);
      count++;
    }
  }
  fs.writeFileSync('src/data.js', content, 'utf8');
  console.log(`\n✅ data.js updated: ${count} URL(s) → local paths`);
  console.log('🎉 Done!');
}

main().catch(console.error);
