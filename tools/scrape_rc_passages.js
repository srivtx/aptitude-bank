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

function classifyDifficulty(questionText, explanation) {
  const text = (questionText + ' ' + explanation).toLowerCase();
  if (explanation.length > 600) return 'hard';
  if (/permutation|combination|probability|compound interest|syllogism/.test(text)) return 'hard';
  if (explanation.length > 250) return 'medium';
  if (/ratio|proportion|partnership|mixture|alligation|pipe|cistern|boat|stream|train|average/.test(text)) return 'medium';
  if (/age|work|time.*distance|speed|percentage.*loss|interest/.test(text)) return 'medium';
  if (/coding|decoding|blood relation|seating|arrangement|puzzle|series/.test(text)) return 'medium';
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
    if (href && href.match(new RegExp(basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[0-9]{4,}'))) {
      urls.add(href);
    }
  });

  urls.add(mainUrl);
  return Array.from(urls).sort();
}

async function scrapeRCExercise(url, globalIndex) {
  const html = await fetchPage(url);
  if (!html) return { questions: [], globalIndex };

  const $ = cheerio.load(html);
  const questions = [];

  // Extract passage - try multiple selectors
  let passage = '';
  const passageSelectors = ['.direction-text', '.div-direction', '.bix-td-direction'];
  for (const sel of passageSelectors) {
    const el = $(sel);
    if (el.length) {
      passage = cleanText(el.html());
      // Remove "Directions to Solve" prefix
      passage = passage.replace(/^Directions to Solve\s*/i, '').trim();
      if (passage.length > 50) break;
    }
  }

  if (!passage) {
    console.log(`  No passage found for ${url}`);
    return { questions: [], globalIndex };
  }

  // Extract questions
  $('.bix-div-container').each((i, el) => {
    try {
      const container = $(el);
      const qTextEl = container.find('.bix-td-qtxt');
      let question = cleanText(qTextEl.html() || '');
      if (!question || question.length < 10) return;

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

      const difficulty = classifyDifficulty(question, explanation);
      const id = `verbal_readin_${String(globalIndex + 1).padStart(3, '0')}`;

      questions.push({
        id,
        topic: 'verbal',
        subtopic: 'reading_comprehension',
        difficulty,
        company_tags: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
        passage,
        question,
        options: options.slice(0, 5),
        answer,
        explanation,
        shortcut: 'Read the first and last sentence of each paragraph for main idea. For specific detail questions, scan the passage for keywords.',
        formula_used: '',
        trap_type: 'Choosing an option mentioned in passage but not answering the question. Watch for "too specific" or "too general" distractors.',
        source: 'IndiaBIX',
        source_url: url,
        pattern_detected: ''
      });

      globalIndex++;
    } catch (err) {
      console.error(`Error parsing question ${i}:`, err.message);
    }
  });

  return { questions, globalIndex };
}

async function main() {
  const mainUrl = 'https://www.indiabix.com/verbal-ability/comprehension/';
  const exerciseUrls = await getExerciseUrls(mainUrl);
  console.log(`Found ${exerciseUrls.length} exercise pages`);

  const allQuestions = [];
  let globalIndex = 0;

  for (let i = 0; i < exerciseUrls.length; i++) {
    const url = exerciseUrls[i];
    console.log(`[${i + 1}/${exerciseUrls.length}] Scraping ${url}...`);
    await delay(800 + Math.random() * 400);

    const result = await scrapeRCExercise(url, globalIndex);
    allQuestions.push(...result.questions);
    globalIndex = result.globalIndex;

    console.log(`  Got ${result.questions.length} questions (total: ${allQuestions.length})`);
  }

  // Deduplicate by question text + options
  const seen = new Set();
  const uniqueQuestions = [];
  for (const q of allQuestions) {
    const key = q.question + '|' + q.options.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    }
  }

  console.log(`\nTotal unique questions: ${uniqueQuestions.length}`);

  const output = {
    metadata: {
      topic: 'Verbal Ability',
      subtopic: 'reading_comprehension',
      total_questions: uniqueQuestions.length,
      sources: ['IndiaBIX'],
      last_updated: new Date().toISOString().split('T')[0]
    },
    questions: uniqueQuestions
  };

  const outputPath = path.join(__dirname, '..', 'data', 'verbal', 'reading_comprehension.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved to ${outputPath}`);
}

main().catch(console.error);
