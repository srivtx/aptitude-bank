const axios = require('axios');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function downloadImage(url, destPath) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
      responseType: 'arraybuffer'
    });
    
    // Verify it's actually an image (not HTML)
    const contentType = res.headers['content-type'];
    const body = res.data;
    const isPng = body[0] === 0x89 && body[1] === 0x50; // PNG magic bytes
    const isJpg = body[0] === 0xFF && body[1] === 0xD8; // JPEG magic bytes
    const isGif = body[0] === 0x47 && body[1] === 0x49; // GIF magic bytes
    
    if (!isPng && !isJpg && !isGif) {
      console.log(`  SKIP (not image): ${url.split('/').pop()}`);
      return false;
    }
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, body);
    return true;
  } catch (err) {
    console.log(`  FAIL: ${url.split('/').pop()} - ${err.message}`);
    return false;
  }
}

async function processTopic(jsonFile) {
  const jsonPath = path.join(__dirname, '..', 'data', 'reasoning', jsonFile);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let downloadCount = 0;
  let skipCount = 0;
  
  for (const q of data.questions) {
    // Download question image
    if (q.image_url) {
      const url = q.image_url;
      const filename = path.basename(url);
      const subtopic = q.subtopic;
      const destDir = path.join(__dirname, '..', 'web', 'public', 'images', 'reasoning', subtopic);
      const destPath = path.join(destDir, filename);
      
      if (!fs.existsSync(destPath)) {
        await delay(200 + Math.random() * 100);
        const ok = await downloadImage(url, destPath);
        if (ok) downloadCount++;
        else skipCount++;
      } else {
        downloadCount++;
      }
      
      // Update to local path
      q.image_url = `/images/reasoning/${subtopic}/${filename}`;
    }
    
    // Download option images
    if (q.option_images && Array.isArray(q.option_images)) {
      const newOptionImages = [];
      for (const optUrl of q.option_images) {
        const filename = path.basename(optUrl);
        const subtopic = q.subtopic;
        const destDir = path.join(__dirname, '..', 'web', 'public', 'images', 'reasoning', subtopic);
        const destPath = path.join(destDir, filename);
        
        if (!fs.existsSync(destPath)) {
          await delay(200 + Math.random() * 100);
          const ok = await downloadImage(optUrl, destPath);
          if (ok) {
            downloadCount++;
            newOptionImages.push(`/images/reasoning/${subtopic}/${filename}`);
          } else {
            skipCount++;
            // Keep original URL as fallback
            newOptionImages.push(optUrl);
          }
        } else {
          downloadCount++;
          newOptionImages.push(`/images/reasoning/${subtopic}/${filename}`);
        }
      }
      q.option_images = newOptionImages;
    }
    
    // Download answer image
    if (q.answer_image_url) {
      const url = q.answer_image_url;
      const filename = path.basename(url);
      const subtopic = q.subtopic;
      const destDir = path.join(__dirname, '..', 'web', 'public', 'images', 'reasoning', subtopic);
      const destPath = path.join(destDir, filename);
      
      if (!fs.existsSync(destPath)) {
        await delay(200 + Math.random() * 100);
        const ok = await downloadImage(url, destPath);
        if (ok) downloadCount++;
        else skipCount++;
      } else {
        downloadCount++;
      }
      
      q.answer_image_url = `/images/reasoning/${subtopic}/${filename}`;
    }
  }
  
  // Save updated JSON
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  
  // Also update web/public/data copy
  const publicJsonPath = path.join(__dirname, '..', 'web', 'public', 'data', 'reasoning', jsonFile);
  if (fs.existsSync(publicJsonPath)) {
    fs.writeFileSync(publicJsonPath, JSON.stringify(data, null, 2));
  }
  
  console.log(`  Downloaded: ${downloadCount}, Skipped/Failed: ${skipCount}`);
}

// Also process DI topics (bar_charts, pie_charts, line_charts)
async function processDITopic(jsonFile) {
  const jsonPath = path.join(__dirname, '..', 'data', 'quant', jsonFile);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let downloadCount = 0;
  let skipCount = 0;
  
  for (const q of data.questions) {
    if (q.image_url) {
      const url = q.image_url;
      const filename = path.basename(url);
      const subtopic = q.subtopic;
      const destDir = path.join(__dirname, '..', 'web', 'public', 'images', 'quant', subtopic);
      const destPath = path.join(destDir, filename);
      
      if (!fs.existsSync(destPath)) {
        await delay(200 + Math.random() * 100);
        const ok = await downloadImage(url, destPath);
        if (ok) downloadCount++;
        else skipCount++;
      } else {
        downloadCount++;
      }
      
      q.image_url = `/images/quant/${subtopic}/${filename}`;
    }
  }
  
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  
  const publicJsonPath = path.join(__dirname, '..', 'web', 'public', 'data', 'quant', jsonFile);
  if (fs.existsSync(publicJsonPath)) {
    fs.writeFileSync(publicJsonPath, JSON.stringify(data, null, 2));
  }
  
  console.log(`  Downloaded: ${downloadCount}, Skipped/Failed: ${skipCount}`);
}

async function main() {
  const nonVerbalFiles = [
    'mirror_images.json',
    'embedded_images.json', 
    'pattern_completion.json',
    'paper_folding.json',
    'cubes_and_dices.json',
    'water_images.json',
    'figure_matrix.json',
    'paper_cutting.json',
    'classification.json',
    'visual_analogy.json',
    'dot_situation.json',
    'rule_detection.json',
  ];
  
  const diFiles = ['bar_charts.json', 'pie_charts.json', 'line_charts.json'];
  
  console.log('=== Processing Non-Verbal Reasoning Images ===');
  for (const file of nonVerbalFiles) {
    console.log(`\n${file}:`);
    await processTopic(file);
  }
  
  console.log('\n=== Processing DI Chart Images ===');
  for (const file of diFiles) {
    console.log(`\n${file}:`);
    await processDITopic(file);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
