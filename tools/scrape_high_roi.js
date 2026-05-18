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
  let text = html
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
    .replace(/<table[^>]*>[^]*?<\/table>/gi, '[TABLE]')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ')
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

function classifyDifficulty(questionText, explanation, options) {
  const text = (questionText + ' ' + explanation).toLowerCase();
  if (explanation.length > 600) return 'hard';
  if (/permutation|combination|probability|compound interest|syllogism/.test(text)) return 'hard';
  if (options.length > 4) return 'hard';
  if (explanation.length > 250) return 'medium';
  if (/ratio|proportion|partnership|mixture|alligation|pipe|cistern|boat|stream|train|average/.test(text)) return 'medium';
  if (/age|work|time.*distance|speed|percentage.*loss|interest/.test(text)) return 'medium';
  if (/coding|decoding|blood relation|seating|arrangement|puzzle|series/.test(text)) return 'medium';
  return 'easy';
}

function extractShortcut(explanation, subtopic) {
  const shortcuts = {
    'bar_charts': 'For bar chart DI: read the question carefully, then locate the relevant bar only',
    'pie_charts': 'For pie charts: 1% = 3.6 degrees; calculate angles for comparisons',
    'line_charts': 'For line graphs: track trends (increasing/decreasing) before reading exact values',
    'paper_folding': 'Visualize the fold line as a mirror; the pattern reflects across it',
    'mirror_images': 'Mirror image reverses left-right; water image reverses top-bottom',
    'embedded_images': 'Rotate the given figure mentally and search for it in the options',
    'pattern_completion': 'Look for symmetry, rotation, or progression in the existing pattern',
    'reading_comprehension': 'Read the first and last sentence of each paragraph for main idea',
    'seating_arrangement': 'Draw a diagram; note facing direction and relative positions first',
  };
  return shortcuts[subtopic] || '';
}

function detectTrap(questionText, explanation, subtopic) {
  const text = questionText.toLowerCase();
  const traps = {
    'bar_charts': 'Reading wrong bar or wrong year from the chart',
    'pie_charts': 'Confusing percentage with actual value or central angle',
    'line_charts': 'Misreading the scale or confusing two overlapping lines',
    'paper_folding': 'Folding in the wrong direction or not visualizing the overlap',
    'mirror_images': 'Confusing mirror image with water image',
    'embedded_images': 'Looking for exact orientation; the figure may be rotated',
    'pattern_completion': 'Filling the blank without checking symmetry on both sides',
    'reading_comprehension': 'Choosing an option mentioned in passage but not answering the question',
    'seating_arrangement': 'Assuming all face the same direction without checking constraints',
  };
  return traps[subtopic] || 'Common calculation or reading errors';
}

function parseIndiaBIX(html, subtopic, topic, category, startIndex = 0) {
  const $ = cheerio.load(html);
  const questions = [];

  // For DI and comprehension, get the common context (chart description / passage)
  let commonContext = '';
  const directionsEl = $('.bix-td-direction');
  if (directionsEl.length) {
    commonContext = cleanText(directionsEl.html() || '');
  }

  $('.bix-div-container').each((i, el) => {
    try {
      const container = $(el);
      const qTextEl = container.find('.bix-td-qtxt');
      let question = cleanText(qTextEl.html() || '');
      if (!question || question.length < 10) return;

      // Prepend common context for DI and comprehension
      if (commonContext && (subtopic.includes('chart') || subtopic === 'reading_comprehension')) {
        question = commonContext + '\n\nQuestion: ' + question;
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

      const explanationEl = container.find('.bix-ans-description');
      let explanation = cleanText(explanationEl.html() || '');
      explanation = explanation.replace(/Video Explanation:.*$/m, '').trim();

      const difficulty = classifyDifficulty(question, explanation, options);
      const companyTags = ['TCS', 'Infosys', 'Wipro', 'Accenture'];
      const id = `${category}_${subtopic.replace(/_/g, '').substring(0, 6)}_${String(startIndex + i + 1).padStart(3, '0')}`;

      questions.push({
        id,
        topic: category,
        subtopic,
        difficulty,
        company_tags: companyTags,
        question,
        options: options.slice(0, 5),
        answer,
        explanation,
        shortcut: extractShortcut(explanation, subtopic),
        formula_used: '',
        trap_type: detectTrap(question, explanation, subtopic),
        source: 'IndiaBIX',
        source_url: '',
        pattern_detected: ''
      });
    } catch (err) {
      console.error(`Error parsing question ${i}:`, err.message);
    }
  });

  return questions;
}

async function getExerciseUrls(mainUrl) {
  const html = await fetchPage(mainUrl);
  if (!html) return [mainUrl];

  const $ = cheerio.load(html);
  const urls = new Set();

  // Extract exercise links (URLs with numeric IDs)
  const basePath = mainUrl.replace(/\/$/, '');
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.match(new RegExp(basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[0-9]{4,}'))) {
      urls.add(href);
    }
  });

  // Also include the main page
  urls.add(mainUrl);

  return Array.from(urls).sort();
}

async function scrapeTopic(config) {
  const { name, subtopic, topic, category, url, maxExercises = 50 } = config;
  const allQuestions = [];
  let globalIndex = 0;

  console.log(`\n=== Scraping ${name} ===`);

  const exerciseUrls = await getExerciseUrls(url);
  const urlsToScrape = exerciseUrls.slice(0, maxExercises);
  console.log(`  Found ${exerciseUrls.length} exercises, scraping ${urlsToScrape.length}`);

  for (const pageUrl of urlsToScrape) {
    console.log(`  Fetching: ${pageUrl}`);
    const html = await fetchPage(pageUrl);
    if (!html) {
      console.log(`  Skipping (fetch failed)`);
      continue;
    }

    const questions = parseIndiaBIX(html, subtopic, topic, category, globalIndex);
    console.log(`  Found ${questions.length} questions`);
    allQuestions.push(...questions);
    globalIndex += questions.length;
    await delay(1500);
  }

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const q of allQuestions) {
    const key = q.question.toLowerCase().replace(/\s+/g, '').substring(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  console.log(`  Total unique questions: ${unique.length}`);
  return unique;
}

async function saveToJSON(questions, category, subtopic) {
  if (questions.length === 0) {
    console.log(`  No questions to save for ${subtopic}`);
    return;
  }
  const dir = path.join(__dirname, '..', 'data', category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${subtopic}.json`);
  const data = {
    metadata: {
      topic: questions[0].topic === 'quant' ? 'Quantitative Aptitude' :
             questions[0].topic === 'reasoning' ? 'Logical Reasoning' : 'Verbal Ability',
      subtopic: subtopic,
      total_questions: questions.length,
      sources: ['IndiaBIX'],
      last_updated: new Date().toISOString().split('T')[0]
    },
    questions
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  Saved to ${filePath}`);
}

const NEW_TOPICS = [
  { name: 'Bar Charts DI', subtopic: 'bar_charts', topic: 'Bar Charts', category: 'quant', url: 'https://www.indiabix.com/data-interpretation/bar-charts/', maxExercises: 19 },
  { name: 'Pie Charts DI', subtopic: 'pie_charts', topic: 'Pie Charts', category: 'quant', url: 'https://www.indiabix.com/data-interpretation/pie-charts/', maxExercises: 13 },
  { name: 'Line Charts DI', subtopic: 'line_charts', topic: 'Line Charts', category: 'quant', url: 'https://www.indiabix.com/data-interpretation/line-charts/', maxExercises: 10 },
  { name: 'Reading Comprehension', subtopic: 'reading_comprehension', topic: 'Reading Comprehension', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/comprehension/', maxExercises: 34 },
  { name: 'Seating Arrangement', subtopic: 'seating_arrangement', topic: 'Seating Arrangement', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/seating-arrangement/', maxExercises: 11 },
  { name: 'Paper Folding', subtopic: 'paper_folding', topic: 'Paper Folding', category: 'reasoning', url: 'https://www.indiabix.com/non-verbal-reasoning/paper-folding/', maxExercises: 8 },
  { name: 'Mirror Images', subtopic: 'mirror_images', topic: 'Mirror Images', category: 'reasoning', url: 'https://www.indiabix.com/non-verbal-reasoning/mirror-images/', maxExercises: 4 },
  { name: 'Embedded Images', subtopic: 'embedded_images', topic: 'Embedded Images', category: 'reasoning', url: 'https://www.indiabix.com/non-verbal-reasoning/embedded-images/', maxExercises: 9 },
  { name: 'Pattern Completion', subtopic: 'pattern_completion', topic: 'Pattern Completion', category: 'reasoning', url: 'https://www.indiabix.com/non-verbal-reasoning/pattern-completion/', maxExercises: 9 },
];

async function main() {
  console.log('=== Scraping High-ROI Missing Topics ===');
  const results = {};

  for (const topic of NEW_TOPICS) {
    const questions = await scrapeTopic(topic);
    await saveToJSON(questions, topic.category, topic.subtopic);
    results[topic.subtopic] = questions.length;
    await delay(3000);
  }

  console.log('\n=== Summary ===');
  let total = 0;
  for (const [subtopic, count] of Object.entries(results)) {
    console.log(`  ${subtopic}: ${count} questions`);
    total += count;
  }
  console.log(`\nTotal new questions collected: ${total}`);
}

main().catch(console.error);
