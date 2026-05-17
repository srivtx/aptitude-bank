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
    .replace(/&pi;/g, 'pi')
    .replace(/&sum;/g, 'sum')
    .replace(/&prod;/g, 'product')
    .replace(/&int;/g, 'integral');
  text = text.replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return text;
}

function classifyDifficulty(questionText, explanation, options) {
  const text = (questionText + ' ' + explanation).toLowerCase();
  if (explanation.length > 600) return 'hard';
  if (/permutation|combination|probability|compound interest|syllogism|data sufficiency|cryptarithmetic/.test(text)) return 'hard';
  if (/euler|fermat|binomial|remainder theorem|modular|complex|diophantine/.test(text)) return 'hard';
  if (options.length > 4) return 'hard';
  if (explanation.length > 250) return 'medium';
  if (/ratio|proportion|partnership|mixture|alligation|pipe|cistern|boat|stream|train|average/.test(text)) return 'medium';
  if (/age|work|time.*distance|speed|percentage.*loss|interest/.test(text)) return 'medium';
  if (/coding|decoding|blood relation|seating|arrangement|puzzle|series/.test(text)) return 'medium';
  return 'easy';
}

function extractShortcut(explanation, subtopic) {
  const shortcuts = {
    'hcf_lcm': 'Use Product = HCF x LCM for two numbers',
    'percentages': 'Successive changes multiply, never add percentages directly',
    'profit_loss': 'If SP same and equal % gain/loss, Loss% = p^2/100',
    'time_work': 'Combined rate = sum of individual rates; Time = 1/rate',
    'time_speed_distance': 'Average speed for equal distances = 2ab/(a+b)',
    'ratios_proportions': 'If a/b = c/d, then ad = bc (cross multiplication)',
    'averages': 'New average = (Total sum + new value) / (n + 1) for adding one item',
    'ages': 'Age difference always remains constant over time',
    'simple_interest': 'SI = (P x R x T)/100. Amount = P + SI',
    'compound_interest': 'Amount = P(1 + R/100)^T. CI = Amount - P',
    'boats_streams': 'Upstream speed = U - V; Downstream = U + V',
    'pipes_cisterns': 'If inlet fills in x hours and outlet empties in y hours, net rate = 1/x - 1/y',
    'mixtures_alligations': 'Alligation: (Cheaper qty)/(Dearer qty) = (Dearer - Mean)/(Mean - Cheaper)',
    'partnership': 'Profit share ratio = (Investment x Time) ratio',
    'probability': 'P(A or B) = P(A) + P(B) - P(A and B) for non-mutually exclusive events',
    'permutations_combinations': 'nPr = n!/(n-r)! ; nCr = n!/(r!(n-r)!)',
    'number_system': 'Sum of first n natural numbers = n(n+1)/2',
    'mensuration': 'Circle area = pi*r^2 ; Sphere surface area = 4*pi*r^2',
    'clocks': 'Angle between hands = |30H - 5.5M| degrees',
    'calendars': 'Odd days method: count extra days beyond complete weeks',
    'series': 'Check differences first, then ratios, then squares/cubes',
    'coding_decoding': 'Try +1, -1, reverse, alternate patterns first',
    'blood_relations': 'Draw family tree; remember uncle/aunt are parents siblings',
    'seating_arrangement': 'Note facing direction and relative positions first',
    'puzzles': 'List all constraints and eliminate impossible options systematically',
    'syllogisms': 'Use Venn diagrams; valid only if conclusion is definitely true in ALL cases',
    'direction_sense': 'Draw coordinate axes; track turns as angle changes from north=0',
    'reading_comprehension': 'Read first and last sentence of each paragraph for main idea',
    'para_jumbles': 'Look for pronoun references, chronology words, and connector words',
    'grammar': 'Check subject-verb agreement before checking other errors',
    'synonyms': 'Eliminate obviously wrong options first; pick the closest meaning',
    'antonyms': 'Think of the word meaning, then find the direct opposite',
    'error_spotting': 'Check subject-verb agreement first, then tenses, then prepositions',
    'fill_blanks': 'Read full sentence; check grammar consistency; eliminate wrong options',
    'sentence_correction': 'Identify the error type first: SV agreement, tense, modifier, parallelism'
  };
  return shortcuts[subtopic] || '';
}

function detectTrap(questionText, explanation, subtopic) {
  const text = questionText.toLowerCase();
  const traps = {
    'percentages': 'Adding/subtracting percentages directly instead of multiplying factors',
    'profit_loss': 'Calculating profit% on wrong base (SP instead of CP, or vice versa)',
    'time_speed_distance': 'Using simple average of speeds instead of harmonic mean for equal distances',
    'time_work': 'Using time values directly instead of converting to rates (1/time)',
    'hcf_lcm': 'Using LCM when HCF is asked, or vice versa',
    'ratios_proportions': 'Adding/subtracting ratios directly instead of working with actual values',
    'averages': 'Assuming simple average works when weights are different',
    'ages': 'Not accounting for time passing equally for all people',
    'simple_interest': 'Using SI formula for CI or vice versa',
    'compound_interest': 'Forgetting that CI > SI for same P, R, T (except first year)',
    'boats_streams': 'Using boat speed in still water as upstream/downstream speed',
    'pipes_cisterns': 'Adding times instead of adding rates (1/time)',
    'mixtures_alligations': 'Using wrong values in alligation formula or forgetting to invert ratio',
    'partnership': 'Not considering time period for investments',
    'probability': 'Counting outcomes without checking independence or mutual exclusivity',
    'permutations_combinations': 'Using permutation when order does not matter (combination needed)',
    'number_system': 'Confusing consecutive numbers with consecutive even/odd numbers',
    'mensuration': 'Using diameter instead of radius in formulas, or forgetting to square units',
    'clocks': 'Using 360/12 = 30 degrees per hour but forgetting minute hand movement',
    'calendars': 'Forgetting that century years not divisible by 400 are not leap years',
    'series': 'Seeing pattern too quickly without verifying across all terms',
    'coding_decoding': 'Applying shift only to some letters or reversing direction of shift',
    'blood_relations': 'Confusing maternal and paternal sides, or uncle/aunt with cousin',
    'seating_arrangement': 'Assuming all faces same direction without checking constraints',
    'puzzles': 'Filling in assumed values without verifying all constraints',
    'syllogisms': 'Assuming converse of a valid statement is also valid',
    'direction_sense': 'Getting left/right confused when facing different directions',
    'reading_comprehension': 'Choosing an option that is mentioned but not the main point',
    'para_jumbles': 'Forcing a logical flow that ignores connector words',
    'error_spotting': 'Finding one error and stopping without checking the whole sentence',
    'fill_blanks': 'Choosing a word that fits meaning but not grammar structure',
    'sentence_correction': 'Changing what is correct and leaving the actual error untouched',
    'synonyms': 'Picking a related word instead of the exact synonym',
    'antonyms': 'Choosing a loosely opposite word rather than the precise antonym'
  };
  return traps[subtopic] || 'Common calculation or reading errors';
}

function parseIndiaBIX(html, subtopic, topic, category, startIndex = 0) {
  const $ = cheerio.load(html);
  const questions = [];

  $('.bix-div-container').each((i, el) => {
    try {
      const container = $(el);
      const qTextEl = container.find('.bix-td-qtxt');
      let question = cleanText(qTextEl.html() || '');
      const minLen = ['synonyms', 'antonyms'].includes(subtopic) ? 2 : 10;
      if (!question || question.length < minLen) return;

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

async function scrapeTopic(config) {
  const { name, subtopic, topic, category, url, pages = 1 } = config;
  const allQuestions = [];
  let globalIndex = 0;
  console.log(`\n=== Scraping ${name} ===`);

  for (let page = 1; page <= pages; page++) {
    const pageUrl = page === 1 ? url : url.replace(/\/$/, '') + `/${String(page).padStart(6, '0')}`;
    console.log(`  Fetching page ${page}: ${pageUrl}`);

    const html = await fetchPage(pageUrl);
    if (!html) {
      console.log(`  Skipping page ${page} (fetch failed)`);
      continue;
    }

    const questions = parseIndiaBIX(html, subtopic, topic, category, globalIndex);
    console.log(`  Found ${questions.length} questions`);
    allQuestions.push(...questions);
    globalIndex += questions.length;
    await delay(1500);
  }

  // Deduplicate
  const verbalDedupTopics = ['error_spotting', 'fill_blanks', 'sentence_correction', 'para_jumbles', 'puzzles', 'statements_assumptions'];
  const seen = new Set();
  const unique = [];
  for (const q of allQuestions) {
    let key = q.question.toLowerCase().replace(/\s+/g, '').substring(0, 80);
    if (verbalDedupTopics.includes(subtopic)) {
      key += '|' + q.options.join('').substring(0, 100);
    }
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

const FIX_TOPICS = [
  { name: 'Analogies', subtopic: 'analogies', topic: 'Analogies', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/analogy/', pages: 3 },
  { name: 'One Word Substitution', subtopic: 'one_word_substitution', topic: 'One Word Substitution', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/one-word-substitutes/', pages: 3 },
];

async function main() {
  console.log('=== Focused Re-Scrape for Broken Topics ===');
  const results = {};
  for (const topic of FIX_TOPICS) {
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
  console.log(`\nTotal questions collected: ${total}`);
}

main().catch(console.error);
