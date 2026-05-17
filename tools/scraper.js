const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Rate limiting
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
  // Replace common HTML entities and tags with text equivalents
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
  
  // Decode HTML entities
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
  
  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  return text;
}

function classifyDifficulty(questionText, explanation, options) {
  const text = (questionText + ' ' + explanation).toLowerCase();
  
  // Hard indicators
  if (explanation.length > 600) return 'hard';
  if (/permutation|combination|probability|compound interest|syllogism|data sufficiency|cryptarithmetic/.test(text)) return 'hard';
  if (/euler|fermat|binomial|remainder theorem|modular|complex|diophantine/.test(text)) return 'hard';
  if (options.length > 4) return 'hard'; // 5 options usually harder
  
  // Medium indicators
  if (explanation.length > 250) return 'medium';
  if (/ratio|proportion|partnership|mixture|alligation|pipe|cistern|boat|stream|train|average/.test(text)) return 'medium';
  if (/age|work|time.*distance|speed|percentage.*loss|interest/.test(text)) return 'medium';
  if (/coding|decoding|blood relation|seating|arrangement|puzzle|series/.test(text)) return 'medium';
  
  // Default easy
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
    'partnership': 'Profit share ratio = Investment x Time ratio',
    'probability': 'Probability = (Favorable outcomes) / (Total outcomes)',
    'permutations_combinations': 'nPr = n!/(n-r)! ; nCr = n!/(r!(n-r)!)',
    'number_system': 'Unit digit cycles every 4 for powers of 2,3,7,8; every 2 for 4,9',
    'divisibility': 'Divisibility by 11: (Sum odd positions) - (Sum even positions) must be 0 or multiple of 11',
    'mensuration': 'Memorize formulas: Circle area = pi*r^2, Sphere vol = 4/3*pi*r^3',
    'data_interpretation': 'Read chart carefully; check units; verify before calculating',
    'clocks': 'Angle = |30H - 11M/2|. Hands coincide 11 times in 12 hours',
    'calendars': 'Odd days method: 1600 years = 0 odd days, 2000 years = 0 odd days',
    'series': 'Check differences, then ratios, then alternate patterns, then interleaved series',
    'coding_decoding': 'Compare first 2-3 letters to detect shift pattern immediately',
    'blood_relations': 'Draw family tree; track generations; use + for male, - for female if needed',
    'seating_arrangement': 'Fix one position, then place others relative to it step by step',
    'puzzles': 'Make a grid/table; fill confirmed values first; use elimination',
    'syllogisms': 'Draw Venn diagrams; check all valid conclusions; watch for "some not" cases',
    'direction_sense': 'Use coordinate system: N=+Y, S=-Y, E=+X, W=-X',
    'inequalities': 'Reverse inequality when multiplying/dividing by negative number',
    'reading_comprehension': 'Read question first, then scan passage for keywords',
    'para_jumbles': 'Find opening sentence (usually introduces topic); look for connectors like "therefore", "however"',
    'error_spotting': 'Check subject-verb agreement first, then tenses, then prepositions',
    'fill_blanks': 'Read full sentence; check grammar consistency; eliminate wrong options',
    'sentence_correction': 'Identify the error type first: SV agreement, tense, modifier, parallelism',
    'synonyms': 'Learn root words: bene=good, mal=bad, philo=love, miso=hatred'
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
    'sentence_correction': 'Changing what is correct and leaving the actual error untouched'
  };
  
  return traps[subtopic] || 'Common calculation or reading errors';
}

function parseIndiaBIX(html, subtopic, topic, category, startIndex = 0) {
  const $ = cheerio.load(html);
  const questions = [];

  $('.bix-div-container').each((i, el) => {
    try {
      const container = $(el);
      
      // Question text
      const qTextEl = container.find('.bix-td-qtxt');
      let question = cleanText(qTextEl.html() || '');
      // Verbal topics (synonyms, antonyms) may have single-word questions
      const minLen = ['synonyms', 'antonyms'].includes(subtopic) ? 2 : 10;
      if (!question || question.length < minLen) return;
      
      // Options
      const options = [];
      container.find('.bix-opt-row').each((j, optEl) => {
        const optText = cleanText($(optEl).find('.bix-td-option-val .flex-wrap').html() || '');
        if (optText) options.push(optText);
      });
      
      if (options.length < 2) return; // Not a valid MCQ
      
      // Answer
      const answerInput = container.find('input.jq-hdnakq');
      let answer = answerInput.attr('value') || '';
      // Map answer: if it's a number, map to letter
      if (/^[0-9]$/.test(answer)) {
        const letters = ['', 'A', 'B', 'C', 'D', 'E'];
        answer = letters[parseInt(answer)] || answer;
      }
      
      // Explanation
      const explanationEl = container.find('.bix-ans-description');
      let explanation = cleanText(explanationEl.html() || '');
      // Remove "Video Explanation" lines
      explanation = explanation.replace(/Video Explanation:.*$/m, '').trim();
      
      // Difficulty
      const difficulty = classifyDifficulty(question, explanation, options);
      
      // Company tags (generic for IndiaBIX since they don't tag companies)
      const companyTags = ['TCS', 'Infosys', 'Wipro', 'Accenture'];
      
      // Generate ID using global index to avoid duplicates across pages
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
    
    // Rate limiting
    await delay(1500);
  }
  
  // Deduplicate by question text hash (first 80 chars normalized)
  // For verbal topics with repeated directions, include options in dedup key
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

// Topic configurations for IndiaBIX - CORRECTED URLs
const TOPICS = [
  // These already succeeded - include to not break existing files
  { name: 'Number System', subtopic: 'number_system', topic: 'Number System', category: 'quant', url: 'https://www.indiabix.com/aptitude/numbers/', pages: 3 },
  { name: 'Ratios and Proportions', subtopic: 'ratios_proportions', topic: 'Ratios and Proportions', category: 'quant', url: 'https://www.indiabix.com/aptitude/ratio-and-proportion/', pages: 3 },
  { name: 'Averages', subtopic: 'averages', topic: 'Averages', category: 'quant', url: 'https://www.indiabix.com/aptitude/average/', pages: 3 },
  { name: 'Ages', subtopic: 'ages', topic: 'Ages', category: 'quant', url: 'https://www.indiabix.com/aptitude/problems-on-ages/', pages: 3 },
  { name: 'Simple Interest', subtopic: 'simple_interest', topic: 'Simple Interest', category: 'quant', url: 'https://www.indiabix.com/aptitude/simple-interest/', pages: 2 },
  { name: 'Compound Interest', subtopic: 'compound_interest', topic: 'Compound Interest', category: 'quant', url: 'https://www.indiabix.com/aptitude/compound-interest/', pages: 2 },
  { name: 'Boats and Streams', subtopic: 'boats_streams', topic: 'Boats and Streams', category: 'quant', url: 'https://www.indiabix.com/aptitude/boats-and-streams/', pages: 2 },
  { name: 'Pipes and Cisterns', subtopic: 'pipes_cisterns', topic: 'Pipes and Cisterns', category: 'quant', url: 'https://www.indiabix.com/aptitude/pipes-and-cistern/', pages: 2 },
  { name: 'Mixtures and Alligations', subtopic: 'mixtures_alligations', topic: 'Mixtures and Alligations', category: 'quant', url: 'https://www.indiabix.com/aptitude/alligation-or-mixture/', pages: 2 },
  { name: 'Partnership', subtopic: 'partnership', topic: 'Partnership', category: 'quant', url: 'https://www.indiabix.com/aptitude/partnership/', pages: 2 },
  { name: 'Probability', subtopic: 'probability', topic: 'Probability', category: 'quant', url: 'https://www.indiabix.com/aptitude/probability/', pages: 3 },
  { name: 'Permutation and Combination', subtopic: 'permutations_combinations', topic: 'Permutation and Combination', category: 'quant', url: 'https://www.indiabix.com/aptitude/permutation-and-combination/', pages: 3 },
  { name: 'Mensuration', subtopic: 'mensuration', topic: 'Mensuration', category: 'quant', url: 'https://www.indiabix.com/aptitude/area/', pages: 3 },
  { name: 'Clocks', subtopic: 'clocks', topic: 'Clocks', category: 'quant', url: 'https://www.indiabix.com/aptitude/clock/', pages: 2 },
  { name: 'Calendars', subtopic: 'calendars', topic: 'Calendars', category: 'quant', url: 'https://www.indiabix.com/aptitude/calendar/', pages: 2 },
  
  // FIXED: Reasoning topics use /verbal-reasoning/
  { name: 'Blood Relations', subtopic: 'blood_relations', topic: 'Blood Relations', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/blood-relation-test/', pages: 3 },
  { name: 'Seating Arrangement', subtopic: 'seating_arrangement', topic: 'Seating Arrangement', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/seating-arrangement/', pages: 3 },
  { name: 'Puzzles', subtopic: 'puzzles', topic: 'Puzzles', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/character-puzzles/', pages: 3 },
  { name: 'Syllogisms', subtopic: 'syllogisms', topic: 'Syllogisms', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/syllogism/', pages: 3 },
  { name: 'Direction Sense', subtopic: 'direction_sense', topic: 'Direction Sense', category: 'reasoning', url: 'https://www.indiabix.com/verbal-reasoning/direction-sense-test/', pages: 3 },
  { name: 'Statements and Assumptions', subtopic: 'statements_assumptions', topic: 'Statements and Assumptions', category: 'reasoning', url: 'https://www.indiabix.com/logical-reasoning/statement-and-assumption/', pages: 2 },
  { name: 'Logical Deductions', subtopic: 'logical_deductions', topic: 'Logical Deductions', category: 'reasoning', url: 'https://www.indiabix.com/logical-reasoning/logical-deduction/', pages: 2 },
  
  // FIXED: Data Interpretation
  { name: 'Data Interpretation', subtopic: 'data_interpretation', topic: 'Data Interpretation', category: 'quant', url: 'https://www.indiabix.com/data-interpretation/table-charts/', pages: 2 },
  
  // FIXED: Verbal Ability topics
  { name: 'Reading Comprehension', subtopic: 'reading_comprehension', topic: 'Reading Comprehension', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/comprehension/', pages: 3 },
  { name: 'Para Jumbles', subtopic: 'para_jumbles', topic: 'Para Jumbles', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/paragraph-formation/', pages: 3 },
  { name: 'Error Spotting', subtopic: 'error_spotting', topic: 'Error Spotting', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/spotting-errors/', pages: 3 },
  { name: 'Fill in the Blanks', subtopic: 'fill_blanks', topic: 'Fill in the Blanks', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/closet-test/', pages: 3 },
  { name: 'Sentence Correction', subtopic: 'sentence_correction', topic: 'Sentence Correction', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/sentence-correction/', pages: 3 },
  { name: 'Grammar', subtopic: 'grammar', topic: 'Grammar', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/change-of-voice/', pages: 2 },
  { name: 'Synonyms', subtopic: 'synonyms', topic: 'Synonyms', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/synonyms/', pages: 2 },
  { name: 'Antonyms', subtopic: 'antonyms', topic: 'Antonyms', category: 'verbal', url: 'https://www.indiabix.com/verbal-ability/antonyms/', pages: 2 },
];

async function main() {
  console.log('=== Placement Aptitude Scraper ===');
  console.log(`Scraping ${TOPICS.length} topics from IndiaBIX`);
  
  const results = {};
  
  for (const topic of TOPICS) {
    const questions = await scrapeTopic(topic);
    await saveToJSON(questions, topic.category, topic.subtopic);
    results[topic.subtopic] = questions.length;
    
    // Delay between topics to be respectful
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
