/**
 * Placement Aptitude Research Bank - Main Application
 * Research-first question collection and practice system
 */

// === State ===
const state = {
  topicIndex: null,
  allQuestions: [],
  currentTopicQuestions: [],
  currentQuestionIndex: 0,
  currentView: 'topics',
  activeFilters: {
    category: 'all',
    difficulty: 'all',
    company: 'all'
  }
};

// === Constants ===
const CATEGORY_MAP = {
  quant: 'Quantitative Aptitude',
  reasoning: 'Logical Reasoning',
  verbal: 'Verbal Ability'
};

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 };

// === DOM Elements ===
const els = {};

function cacheElements() {
  els.navTabs = document.querySelectorAll('.nav-tab');
  els.views = document.querySelectorAll('.view');
  els.topicsGrid = document.getElementById('topics-grid');
  els.categoryFilter = document.getElementById('category-filter');
  els.difficultyFilter = document.getElementById('difficulty-filter');
  els.searchTopics = document.getElementById('search-topics');
  els.totalQuestions = document.getElementById('total-questions');
  els.totalTopics = document.getElementById('total-topics');
  
  els.practiceTitle = document.getElementById('practice-title');
  els.practiceProgress = document.getElementById('practice-progress');
  els.practiceDifficulty = document.getElementById('practice-difficulty');
  els.practiceSetup = document.getElementById('practice-setup');
  els.practiceArea = document.getElementById('practice-area');
  els.quickTopics = document.getElementById('quick-topics');
  
  els.qId = document.getElementById('q-id');
  els.qDifficulty = document.getElementById('q-difficulty');
  els.qCompanies = document.getElementById('q-companies');
  els.qText = document.getElementById('q-text');
  els.qOptions = document.getElementById('q-options');
  els.btnCheck = document.getElementById('btn-check');
  els.btnSkip = document.getElementById('btn-skip');
  els.btnNext = document.getElementById('btn-next');
  
  els.solutionPanel = document.getElementById('solution-panel');
  els.resultBadge = document.getElementById('result-badge');
  els.solExplanation = document.getElementById('sol-explanation');
  els.solShortcut = document.getElementById('sol-shortcut');
  els.solShortcutWrap = document.getElementById('sol-shortcut-wrap');
  els.solFormula = document.getElementById('sol-formula');
  els.solFormulaWrap = document.getElementById('sol-formula-wrap');
  els.solTrap = document.getElementById('sol-trap');
  els.solTrapWrap = document.getElementById('sol-trap-wrap');
  els.solSource = document.getElementById('sol-source');
  
  els.bankList = document.getElementById('bank-list');
  els.bankCategoryFilter = document.getElementById('bank-category-filter');
  els.bankDifficultyFilter = document.getElementById('bank-difficulty-filter');
  els.bankSearch = document.getElementById('bank-search');
  
  els.patternsList = document.getElementById('patterns-list');
}

// === Data Loading ===

async function loadTopicIndex() {
  try {
    const res = await fetch('data/topic-index.json');
    state.topicIndex = await res.json();
    updateHeaderStats();
    renderTopicsGrid();
    renderQuickTopics();
    loadAllQuestions();
  } catch (err) {
    console.error('Failed to load topic index:', err);
    els.topicsGrid.innerHTML = '<p style="color:var(--text-secondary)">Failed to load data. Please ensure you are running this via a local server.</p>';
  }
}

async function loadAllQuestions() {
  const questions = [];
  for (const cat of state.topicIndex.categories) {
    for (const sub of cat.subtopics) {
      if (sub.question_count > 0) {
        try {
          const res = await fetch(`data/${cat.id}/${sub.file}`);
          const data = await res.json();
          if (data.questions) {
            data.questions.forEach(q => {
              q._category = cat.id;
              q._subtopicName = sub.name;
              questions.push(q);
            });
          }
        } catch (e) {
          console.warn(`Failed to load ${sub.file}:`, e);
        }
      }
    }
  }
  state.allQuestions = questions;
  renderBank();
  renderPatterns();
}

async function loadTopicQuestions(categoryId, subtopicFile) {
  try {
    const res = await fetch(`data/${categoryId}/${subtopicFile}`);
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.error('Failed to load questions:', err);
    return [];
  }
}

// === Header ===

function updateHeaderStats() {
  const stats = state.topicIndex.stats;
  els.totalQuestions.textContent = `${stats.total_questions} Questions`;
  els.totalTopics.textContent = `${stats.total_topics} Topics`;
}

// === Navigation ===

function initNavigation() {
  els.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      switchView(view);
      els.navTabs.forEach(t => t.classList.toggle('active', t === tab));
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  els.views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
  if (viewName === 'bank') renderBank();
  if (viewName === 'patterns') renderPatterns();
}

// === Topics Grid ===

function renderTopicsGrid() {
  const grid = els.topicsGrid;
  grid.innerHTML = '';
  
  const search = (els.searchTopics?.value || '').toLowerCase();
  const catFilter = els.categoryFilter?.value || 'all';
  const diffFilter = els.difficultyFilter?.value || 'all';
  
  for (const cat of state.topicIndex.categories) {
    if (catFilter !== 'all' && cat.id !== catFilter) continue;
    
    for (const sub of cat.subtopics) {
      if (search && !sub.name.toLowerCase().includes(search)) continue;
      if (diffFilter !== 'all' && sub.difficulty_distribution[diffFilter] === 0) continue;
      
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <h3>${sub.name}</h3>
        <div class="topic-meta">
          <span>${CATEGORY_MAP[cat.id]}</span>
          <span>${sub.question_count} questions</span>
        </div>
        <div class="topic-difficulties">
          ${sub.difficulty_distribution.easy > 0 ? `<span class="diff-badge easy">${sub.difficulty_distribution.easy} Easy</span>` : ''}
          ${sub.difficulty_distribution.medium > 0 ? `<span class="diff-badge medium">${sub.difficulty_distribution.medium} Medium</span>` : ''}
          ${sub.difficulty_distribution.hard > 0 ? `<span class="diff-badge hard">${sub.difficulty_distribution.hard} Hard</span>` : ''}
        </div>
      `;
      card.addEventListener('click', () => startPractice(cat.id, sub.file, sub.name));
      grid.appendChild(card);
    }
  }
}

function initTopicFilters() {
  els.categoryFilter?.addEventListener('change', renderTopicsGrid);
  els.difficultyFilter?.addEventListener('change', renderTopicsGrid);
  els.searchTopics?.addEventListener('input', debounce(renderTopicsGrid, 200));
}

// === Quick Topics ===

function renderQuickTopics() {
  const container = els.quickTopics;
  container.innerHTML = '';
  
  // Show top topics with most questions
  const allSubtopics = [];
  for (const cat of state.topicIndex.categories) {
    for (const sub of cat.subtopics) {
      if (sub.question_count > 0) {
        allSubtopics.push({ ...sub, categoryId: cat.id });
      }
    }
  }
  allSubtopics.sort((a, b) => b.question_count - a.question_count);
  const top = allSubtopics.slice(0, 12);
  
  for (const sub of top) {
    const btn = document.createElement('button');
    btn.className = 'quick-topic-btn';
    btn.textContent = sub.name;
    btn.addEventListener('click', () => startPractice(sub.categoryId, sub.file, sub.name));
    container.appendChild(btn);
  }
}

// === Practice ===

async function startPractice(categoryId, subtopicFile, subtopicName) {
  switchView('practice');
  els.navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === 'practice'));
  
  els.practiceTitle.textContent = subtopicName;
  els.practiceSetup.classList.add('hidden');
  els.practiceArea.classList.remove('hidden');
  
  const questions = await loadTopicQuestions(categoryId, subtopicFile);
  state.currentTopicQuestions = questions;
  state.currentQuestionIndex = 0;
  
  updatePracticeMeta();
  renderCurrentQuestion();
}

function updatePracticeMeta() {
  const total = state.currentTopicQuestions.length;
  const current = total > 0 ? state.currentQuestionIndex + 1 : 0;
  els.practiceProgress.textContent = `${current} / ${total}`;
  
  const diffs = {};
  state.currentTopicQuestions.forEach(q => { diffs[q.difficulty] = (diffs[q.difficulty] || 0) + 1; });
  const diffText = Object.entries(diffs).map(([d, c]) => `${c} ${d}`).join(', ');
  els.practiceDifficulty.textContent = diffText || 'All Levels';
}

function renderCurrentQuestion() {
  hideSolution();
  els.btnCheck.classList.remove('hidden');
  els.btnSkip.classList.remove('hidden');
  els.btnNext.classList.add('hidden');
  
  const q = state.currentTopicQuestions[state.currentQuestionIndex];
  if (!q) {
    els.qText.textContent = 'No more questions in this topic.';
    els.qOptions.innerHTML = '';
    els.btnCheck.classList.add('hidden');
    els.btnSkip.classList.add('hidden');
    return;
  }
  
  els.qId.textContent = q.id;
  els.qDifficulty.textContent = q.difficulty;
  els.qDifficulty.className = `question-difficulty ${q.difficulty}`;
  els.qCompanies.textContent = (q.company_tags || []).join(', ');
  els.qText.textContent = q.question;
  
  els.qOptions.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'option-item';
    div.dataset.index = i;
    div.innerHTML = `<span class="option-label">${labels[i]}</span><span>${escapeHtml(opt)}</span>`;
    div.addEventListener('click', () => selectOption(div));
    els.qOptions.appendChild(div);
  });
}

function selectOption(el) {
  if (els.solutionPanel.classList.contains('hidden') === false) return;
  els.qOptions.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
  el.classList.add('selected');
}

function getSelectedOption() {
  const selected = els.qOptions.querySelector('.option-item.selected');
  return selected ? parseInt(selected.dataset.index) : -1;
}

function checkAnswer() {
  const selected = getSelectedOption();
  if (selected === -1) return;
  
  const q = state.currentTopicQuestions[state.currentQuestionIndex];
  const labels = ['A', 'B', 'C', 'D'];
  const correctIndex = labels.indexOf(q.answer);
  const isCorrect = selected === correctIndex;
  
  // Update options UI
  const items = els.qOptions.querySelectorAll('.option-item');
  items.forEach((item, i) => {
    item.classList.add('disabled');
    if (i === correctIndex) item.classList.add('correct');
    else if (i === selected && !isCorrect) item.classList.add('wrong');
  });
  
  // Show solution
  els.solutionPanel.classList.remove('hidden');
  els.resultBadge.textContent = isCorrect ? 'Correct!' : 'Incorrect';
  els.resultBadge.className = `result-badge ${isCorrect ? 'correct' : 'wrong'}`;
  
  els.solExplanation.textContent = q.explanation;
  
  if (q.shortcut) {
    els.solShortcutWrap.classList.remove('hidden');
    els.solShortcut.textContent = q.shortcut;
  } else {
    els.solShortcutWrap.classList.add('hidden');
  }
  
  if (q.formula_used) {
    els.solFormulaWrap.classList.remove('hidden');
    els.solFormula.textContent = q.formula_used;
  } else {
    els.solFormulaWrap.classList.add('hidden');
  }
  
  if (q.trap_type) {
    els.solTrapWrap.classList.remove('hidden');
    els.solTrap.textContent = q.trap_type;
  } else {
    els.solTrapWrap.classList.add('hidden');
  }
  
  els.solSource.textContent = q.source || 'Unknown';
  
  els.btnCheck.classList.add('hidden');
  els.btnSkip.classList.add('hidden');
  els.btnNext.classList.remove('hidden');
}

function skipQuestion() {
  nextQuestion();
}

function nextQuestion() {
  state.currentQuestionIndex++;
  if (state.currentQuestionIndex >= state.currentTopicQuestions.length) {
    els.practiceTitle.textContent = 'Practice Complete!';
    els.qText.textContent = 'You have completed all questions in this topic. Select another topic to continue.';
    els.qOptions.innerHTML = '';
    hideSolution();
    els.btnCheck.classList.add('hidden');
    els.btnSkip.classList.add('hidden');
    els.btnNext.classList.add('hidden');
    return;
  }
  updatePracticeMeta();
  renderCurrentQuestion();
}

function hideSolution() {
  els.solutionPanel.classList.add('hidden');
}

function initPracticeControls() {
  els.btnCheck?.addEventListener('click', checkAnswer);
  els.btnSkip?.addEventListener('click', skipQuestion);
  els.btnNext?.addEventListener('click', nextQuestion);
}

// === Question Bank ===

function renderBank() {
  const container = els.bankList;
  container.innerHTML = '';
  
  if (!state.allQuestions.length) {
    container.innerHTML = '<p style="color:var(--text-secondary)">Loading questions...</p>';
    return;
  }
  
  const catFilter = els.bankCategoryFilter?.value || 'all';
  const diffFilter = els.bankDifficultyFilter?.value || 'all';
  const search = (els.bankSearch?.value || '').toLowerCase();
  
  const filtered = state.allQuestions.filter(q => {
    if (catFilter !== 'all' && q.topic !== catFilter) return false;
    if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
    if (search && !q.question.toLowerCase().includes(search) && !q.id.toLowerCase().includes(search)) return false;
    return true;
  });
  
  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--text-secondary)">No questions match your filters.</p>';
    return;
  }
  
  for (const q of filtered.slice(0, 100)) { // Limit to 100 for performance
    const item = document.createElement('div');
    item.className = 'bank-item';
    item.innerHTML = `
      <div class="bank-item-header">
        <span class="bank-item-title">${escapeHtml(q.question.substring(0, 120))}${q.question.length > 120 ? '...' : ''}</span>
        <div class="bank-item-meta">
          <span class="diff-badge ${q.difficulty}">${q.difficulty}</span>
          <span>${q._subtopicName || q.subtopic}</span>
          <span>${q.id}</span>
        </div>
      </div>
    `;
    item.addEventListener('click', () => {
      // Scroll to top and show in practice if possible
      // For now just highlight
      item.style.borderColor = 'var(--accent)';
      setTimeout(() => item.style.borderColor = '', 500);
    });
    container.appendChild(item);
  }
}

function initBankFilters() {
  els.bankCategoryFilter?.addEventListener('change', renderBank);
  els.bankDifficultyFilter?.addEventListener('change', renderBank);
  els.bankSearch?.addEventListener('input', debounce(renderBank, 200));
}

// === Patterns ===

function renderPatterns() {
  const container = els.patternsList;
  container.innerHTML = '';
  
  if (!state.allQuestions.length) {
    container.innerHTML = '<p style="color:var(--text-secondary)">Loading patterns...</p>';
    return;
  }
  
  // Detect patterns from loaded questions
  const patterns = detectPatterns();
  
  if (!patterns.length) {
    container.innerHTML = '<p style="color:var(--text-secondary)">No patterns detected yet. Add more questions to enable pattern extraction.</p>';
    return;
  }
  
  for (const p of patterns) {
    const card = document.createElement('div');
    card.className = 'pattern-card';
    card.innerHTML = `
      <h3>${escapeHtml(p.name)}</h3>
      <div class="pattern-meta">${p.subtopic} | Found in ${p.count} questions | Companies: ${p.companies.join(', ')}</div>
      <p>${escapeHtml(p.description)}</p>
    `;
    container.appendChild(card);
  }
}

function detectPatterns() {
  const patterns = [];
  const patternMap = {};
  
  for (const q of state.allQuestions) {
    if (!q.pattern_detected) continue;
    const pid = q.pattern_detected;
    if (!patternMap[pid]) {
      patternMap[pid] = {
        id: pid,
        name: pid,
        subtopic: q.subtopic,
        count: 0,
        companies: new Set(),
        description: q.shortcut || q.formula_used || 'Recurring question structure'
      };
    }
    patternMap[pid].count++;
    (q.company_tags || []).forEach(c => patternMap[pid].companies.add(c));
  }
  
  for (const pid in patternMap) {
    const p = patternMap[pid];
    if (p.count >= 2) {
      patterns.push({
        name: `Pattern ${pid} (${p.subtopic})`,
        subtopic: p.subtopic,
        count: p.count,
        companies: Array.from(p.companies).slice(0, 5),
        description: p.description
      });
    }
  }
  
  return patterns.sort((a, b) => b.count - a.count);
}

// === Utilities ===

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// === Init ===

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  initNavigation();
  initTopicFilters();
  initPracticeControls();
  initBankFilters();
  loadTopicIndex();
});
