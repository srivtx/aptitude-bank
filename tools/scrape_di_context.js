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
    .replace(/<img[^>]*>/gi, '[IMAGE]')
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

// Extract table data as readable text
function extractTableText(tableHtml) {
  const $ = cheerio.load(tableHtml);
  const rows = [];
  $('tr').each((i, tr) => {
    const cells = [];
    $(tr).find('td, th').each((j, cell) => {
      let text = $(cell).text().trim();
      // Clean up math fractions
      text = text.replace(/\s+/g, ' ');
      cells.push(text);
    });
    if (cells.length > 0) rows.push(cells.join(' | '));
  });
  return rows.join('\n');
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

async function scrapeDIExercise(url, subtopic, category, globalIndex) {
  const html = await fetchPage(url);
  if (!html) return { questions: [], globalIndex };

  const $ = cheerio.load(html);
  const questions = [];

  // Extract direction text
  let passage = '';
  const dirEl = $('.direction-text');
  if (dirEl.length) {
    // Clone the element so we can manipulate it
    const dirClone = dirEl.clone();
    
    // Convert tables within direction to text
    dirClone.find('table').each((i, table) => {
      const tableText = extractTableText($.html(table));
      $(table).replaceWith(`\n[TABLE DATA]\n${tableText}\n[/TABLE DATA]\n`);
    });
    
    passage = cleanText(dirClone.html() || '');
    // Remove [IMAGE] markers from passage - we cant show images
    passage = passage.replace(/\[IMAGE\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  }

  if (!passage) {
    console.log(`  No direction text found for ${url}`);
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

      // Extract explanation - convert tables too
      const explanationEl = container.find('.bix-ans-description');
      let explanation = '';
      if (explanationEl.length) {
        const expClone = explanationEl.clone();
        expClone.find('table').each((i, table) => {
          const tableText = extractTableText($.html(table));
          $(table).replaceWith(`\n[TABLE DATA]\n${tableText}\n[/TABLE DATA]\n`);
        });
        explanation = cleanText(expClone.html() || '');
        explanation = explanation.replace(/Video Explanation:.*$/m, '').trim();
      }

      const difficulty = classifyDifficulty(question, explanation);
      const id = `${category}_${subtopic.replace(/_/g, '').substring(0, 6)}_${String(globalIndex + 1).padStart(3, '0')}`;

      const qObj = {
        id,
        topic: category,
        subtopic,
        difficulty,
        company_tags: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
        question,
        options: options.slice(0, 5),
        answer,
        explanation,
        shortcut: subtopic === 'bar_charts' ? 'For bar chart DI: read the question carefully, then locate the relevant bar only' :
                   subtopic === 'pie_charts' ? 'For pie charts: 1% = 3.6 degrees; calculate angles for comparisons' :
                   'For line graphs: track trends (increasing/decreasing) before reading exact values',
        formula_used: '',
        trap_type: subtopic === 'bar_charts' ? 'Reading wrong bar or wrong year from the chart' :
                   subtopic === 'pie_charts' ? 'Confusing percentage with actual value or central angle' :
                   'Misreading the scale or confusing two overlapping lines',
        source: 'IndiaBIX',
        source_url: url,
        pattern_detected: ''
      };

      // Add passage if available
      if (passage && passage.length > 20) {
        qObj.passage = passage;
      }

      questions.push(qObj);
      globalIndex++;
    } catch (err) {
      console.error(`Error parsing question ${i}:`, err.message);
    }
  });

  return { questions, globalIndex };
}

const TOPICS = [
  {
    name: 'Bar Charts',
    subtopic: 'bar_charts',
    category: 'quant',
    url: 'https://www.indiabix.com/data-interpretation/bar-charts/',
    maxExercises: 25
  },
  {
    name: 'Pie Charts',
    subtopic: 'pie_charts',
    category: 'quant',
    url: 'https://www.indiabix.com/data-interpretation/pie-charts/',
    maxExercises: 25
  },
  {
    name: 'Line Charts',
    subtopic: 'line_charts',
    category: 'quant',
    url: 'https://www.indiabix.com/data-interpretation/line-charts/',
    maxExercises: 25
  }
];

async function main() {
  for (const topic of TOPICS) {
    console.log(`\n=== Scraping ${topic.name} ===`);
    
    const exerciseUrls = await getExerciseUrls(topic.url);
    console.log(`Found ${exerciseUrls.length} exercise pages`);
    
    const allQuestions = [];
    let globalIndex = 0;

    const limit = Math.min(exerciseUrls.length, topic.maxExercises);
    for (let i = 0; i < limit; i++) {
      const url = exerciseUrls[i];
      console.log(`[${i + 1}/${limit}] ${url}`);
      await delay(800 + Math.random() * 400);

      const result = await scrapeDIExercise(url, topic.subtopic, topic.category, globalIndex);
      allQuestions.push(...result.questions);
      globalIndex = result.globalIndex;

      console.log(`  Got ${result.questions.length} questions (total: ${allQuestions.length})`);
    }

    // Deduplicate
    const seen = new Set();
    const uniqueQuestions = [];
    for (const q of allQuestions) {
      const key = q.question + '|' + q.options.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(q);
      }
    }

    console.log(`Total unique: ${uniqueQuestions.length}`);

    const output = {
      metadata: {
        topic: 'Data Interpretation',
        subtopic: topic.subtopic,
        total_questions: uniqueQuestions.length,
        sources: ['IndiaBIX'],
        last_updated: new Date().toISOString().split('T')[0]
      },
      questions: uniqueQuestions
    };

    const outputPath = path.join(__dirname, '..', 'data', 'quant', `${topic.subtopic}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Saved to ${outputPath}`);
  }
}

main().catch(console.error);
