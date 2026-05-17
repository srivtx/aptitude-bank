const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const categories = ['quant', 'reasoning', 'verbal'];

function getSubtopicPrefix(subtopic) {
  return subtopic.replace(/_/g, '').substring(0, 6);
}

for (const cat of categories) {
  const catDir = path.join(DATA_DIR, cat);
  if (!fs.existsSync(catDir)) continue;

  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(catDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const subtopic = data.metadata?.subtopic || file.replace('.json', '');
    const prefix = getSubtopicPrefix(subtopic);

    // Renumber all questions sequentially
    let seq = 1;
    for (const q of data.questions || []) {
      q.id = `${cat}_${prefix}_${String(seq).padStart(3, '0')}`;
      seq++;
    }

    // Update metadata count
    if (data.metadata) {
      data.metadata.total_questions = data.questions?.length || 0;
      data.metadata.last_updated = new Date().toISOString().split('T')[0];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  Fixed ${cat}/${file}: ${data.questions?.length || 0} questions`);
  }
}

console.log('\nAll IDs renumbered successfully.');
