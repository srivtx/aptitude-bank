const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchPage(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    return res.data;
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

function cleanText(html) {
  if (!html) return '';
  let text = html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<sup>(\d+)<\/sup>/gi, '^$1')
    .replace(/<sub>(\d+)<\/sub>/gi, '_$1')
    .replace(/<i[^>]*>([^<]*)<\/i>/gi, '$1')
    .replace(/<em>([^<]*)<\/em>/gi, '$1')
    .replace(/<b>([^<]*)<\/b>/gi, '$1')
    .replace(/<strong>([^<]*)<\/strong>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>([^]*?)<\/p>/gi, '$1\n')
    .replace(/<div[^>]*>([^]*?)<\/div>/gi, '$1')
    .replace(/<span[^>]*>([^]*?)<\/span>/gi, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&times;/g, 'x')
    .replace(/&divide;/g, '/')
    .replace(/&minus;/g, '-')
    .replace(/&plus;/g, '+')
    .replace(/&equals;/g, '=')
    .replace(/&radic;/g, 'sqrt')
    .replace(/&pi;/g, 'pi');
  text = text.replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return text;
}

function classifyDifficulty(questionText, explanation) {
  const text = (questionText + ' ' + explanation).toLowerCase();
  if (explanation.length > 300) return 'hard';
  if (/complex|difficult|advanced/.test(text)) return 'hard';
  if (explanation.length > 100) return 'medium';
  return 'easy';
}

async function getExerciseUrls(mainUrl) {
  const html = await fetchPage(mainUrl);
  if (!html) return [mainUrl];

  const $ = cheerio.load(html);
  const urls = new Set();

  const basePath = mainUrl.replace(/\/$/, '');
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.match(new RegExp(basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[0-9]'))) {
      urls.add(href);
    }
  });

  urls.add(mainUrl);
  return Array.from(urls).sort();
}

async function scrapeNonVerbalTopic(config) {
  const { name, subtopic, url, maxExercises = 20 } = config;
  const exerciseUrls = await getExerciseUrls(url);
  console.log(`Found ${exerciseUrls.length} exercise pages`);

  const allQuestions = [];
  let globalIndex = 0;

  const limit = Math.min(exerciseUrls.length, maxExercises);
  for (let i = 0; i < limit; i++) {
    const pageUrl = exerciseUrls[i];
    console.log(`[${i + 1}/${limit}] ${pageUrl}`);
    await delay(800 + Math.random() * 400);

    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const $ = cheerio.load(html);

    $('.bix-div-container').each((qIdx, el) => {
      try {
        const container = $(el);

        // Extract question text and image
        const qTextEl = container.find('.bix-td-qtxt');
        let question = cleanText(qTextEl.html() || '');
        if (!question || question.length < 5) return;

        // Extract question image
        let imageUrl = '';
        const qImg = qTextEl.find('img').first();
        if (qImg.length) {
          const src = qImg.attr('src');
          if (src) {
            imageUrl = src.startsWith('http') ? src : `https://www.indiabix.com${src}`;
          }
        }

        const options = [];
        container.find('.bix-opt-row').each((j, optEl) => {
          const optText = cleanText($(optEl).find('.bix-td-option-val .flex-wrap').html() || '');
          if (optText) options.push(optText);
        });

        if (options.length < 2) return;

        const answerInput = container.find('input.jq-hdnakq');
        let answer = answerInput.attr('value') || '';
        if (/^[0-9]$/.test(answer)) {
          const letters = ['', 'A', 'B', 'C', 'D', 'E'];
          answer = letters[parseInt(answer)] || answer;
        }

        // Extract explanation and answer image
        const explanationEl = container.find('.bix-ans-description');
        let explanation = cleanText(explanationEl.html() || '');
        explanation = explanation.replace(/Video Explanation:.*$/m, '').trim();

        let answerImageUrl = '';
        const ansImg = explanationEl.find('img').first();
        if (ansImg.length) {
          const src = ansImg.attr('src');
          if (src) {
            answerImageUrl = src.startsWith('http') ? src : `https://www.indiabix.com${src}`;
          }
        }

        const difficulty = classifyDifficulty(question, explanation);
        const id = `reasoning_${subtopic.replace(/_/g, '').substring(0, 6)}_${String(globalIndex + 1).padStart(3, '0')}`;

        const qObj = {
          id,
          topic: 'reasoning',
          subtopic,
          difficulty,
          company_tags: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
          question,
          options: options.slice(0, 5),
          answer,
          explanation,
          shortcut: 'Visual reasoning: observe the figure carefully, identify the pattern or transformation being tested',
          formula_used: '',
          trap_type: 'Not accounting for rotation, reflection, or perspective changes correctly',
          source: 'IndiaBIX',
          source_url: pageUrl,
          pattern_detected: ''
        };

        if (imageUrl) qObj.image_url = imageUrl;
        if (answerImageUrl) qObj.answer_image_url = answerImageUrl;

        allQuestions.push(qObj);
        globalIndex++;
      } catch (err) {
        console.error(`Error parsing question ${qIdx}:`, err.message);
      }
    });

    console.log(`  Total so far: ${allQuestions.length}`);
  }

  // Deduplicate by image URL since non-verbal questions have generic text
  const seen = new Set();
  const uniqueQuestions = [];
  for (const q of allQuestions) {
    const key = q.image_url || q.question;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    }
  }

  console.log(`Total unique: ${uniqueQuestions.length}`);

  const output = {
    metadata: {
      topic: 'Non Verbal Reasoning',
      subtopic,
      total_questions: uniqueQuestions.length,
      sources: ['IndiaBIX'],
      last_updated: new Date().toISOString().split('T')[0]
    },
    questions: uniqueQuestions
  };

  const outputPath = path.join(__dirname, '..', 'data', 'reasoning', `${subtopic}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved to ${outputPath}`);
  return uniqueQuestions.length;
}

const TOPICS = [
  { name: 'Mirror Images', subtopic: 'mirror_images', url: 'https://www.indiabix.com/non-verbal-reasoning/mirror-images/', maxExercises: 15 },
  { name: 'Embedded Images', subtopic: 'embedded_images', url: 'https://www.indiabix.com/non-verbal-reasoning/embedded-images/', maxExercises: 15 },
  { name: 'Pattern Completion', subtopic: 'pattern_completion', url: 'https://www.indiabix.com/non-verbal-reasoning/pattern-completion/', maxExercises: 15 },
  { name: 'Paper Folding', subtopic: 'paper_folding', url: 'https://www.indiabix.com/non-verbal-reasoning/paper-folding/', maxExercises: 15 },
  { name: 'Cubes and Dice', subtopic: 'cubes_and_dices', url: 'https://www.indiabix.com/non-verbal-reasoning/cubes-and-dice/', maxExercises: 15 },
  { name: 'Water Images', subtopic: 'water_images', url: 'https://www.indiabix.com/non-verbal-reasoning/water-images/', maxExercises: 15 },
  { name: 'Figure Matrix', subtopic: 'figure_matrix', url: 'https://www.indiabix.com/non-verbal-reasoning/figure-matrix/', maxExercises: 15 },
  { name: 'Paper Cutting', subtopic: 'paper_cutting', url: 'https://www.indiabix.com/non-verbal-reasoning/paper-cutting/', maxExercises: 15 },
  { name: 'Classification', subtopic: 'classification', url: 'https://www.indiabix.com/non-verbal-reasoning/classification/', maxExercises: 15 },
  { name: 'Analogy', subtopic: 'visual_analogy', url: 'https://www.indiabix.com/non-verbal-reasoning/analogy/', maxExercises: 15 },
  { name: 'Dot Situation', subtopic: 'dot_situation', url: 'https://www.indiabix.com/non-verbal-reasoning/dot-situation/', maxExercises: 15 },
  { name: 'Rule Detection', subtopic: 'rule_detection', url: 'https://www.indiabix.com/non-verbal-reasoning/rule-detection/', maxExercises: 15 },
];

async function main() {
  let total = 0;
  for (const topic of TOPICS) {
    console.log(`\n========================================`);
    console.log(`SCRAPING: ${topic.name}`);
    console.log(`========================================`);
    try {
      const count = await scrapeNonVerbalTopic(topic);
      total += count;
    } catch (err) {
      console.error(`Failed to scrape ${topic.name}:`, err.message);
    }
  }
  console.log(`\n========================================`);
  console.log(`TOTAL NON-VERBAL QUESTIONS: ${total}`);
  console.log(`========================================`);
}

main().catch(console.error);
