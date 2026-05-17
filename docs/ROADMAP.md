# Implementation Roadmap

## Phase 1: Research & Data Collection (COMPLETED)

### Week 1-2: Topic Research
- [x] Identify all major placement aptitude topics
- [x] Research topic weightage per company
- [x] Create comprehensive topic map
- [x] Document question schema and JSON structure

### Week 3-4: Question Collection
- [x] Scrape/collect questions from IndiaBIX for core topics
- [x] Scrape/collect questions from PrepInsta for company-specific tags
- [x] Collect from GeeksforGeeks for explanations and shortcuts
- [x] Populate initial data files:
  - [x] HCF and LCM (15 questions)
  - [x] Percentages (20 questions)
  - [x] Profit and Loss (18 questions)
  - [x] Time, Speed and Distance (18 questions)
  - [x] Time and Work (16 questions)
  - [x] Series (20 questions)
  - [x] Coding-Decoding (15 questions)
  - [x] Synonyms and Antonyms (15 questions)
  - [x] TCS company-specific set (25 questions)

## Phase 2: Data Processing & Classification (COMPLETED)

### Week 5: Cleaning & Normalization
- [x] Normalize all questions to standard JSON schema
- [x] Verify all required fields present
- [x] Clean mathematical notation
- [x] Standardize units and formatting

### Week 6: Classification
- [x] Assign difficulty levels (easy/medium/hard)
- [x] Tag with company names
- [x] Identify and code repeated patterns
- [x] Extract shortcuts and formulas
- [x] Document common traps

### Week 7: Pattern Detection
- [x] Build automated pattern detection for templates
- [x] Create pattern index in /data/patterns/
- [x] Map questions to pattern IDs
- [x] Build company signature profiles

## Phase 3: Website Development (COMPLETED - v1.0)

### Core Features Implemented
- [x] Topic selection grid with category/difficulty filters
- [x] MCQ practice mode with one question at a time
- [x] Answer checking with visual feedback
- [x] Solution panel showing:
  - [x] Detailed explanation
  - [x] Shortcut/Trick
  - [x] Formula used
  - [x] Common trap
  - [x] Source attribution
- [x] Question bank viewer with search and filters
- [x] Pattern detection display
- [x] Dark mode support (via prefers-color-scheme)
- [x] Responsive design for mobile
- [x] Quick topic selection for practice

## Phase 4: Data Expansion (NEXT PRIORITY)

### Target: 500+ Questions
- [ ] Number System & Divisibility (25 questions)
- [ ] Simple Interest & Compound Interest (20 questions)
- [ ] Ratios and Proportions (20 questions)
- [ ] Averages (15 questions)
- [ ] Ages (15 questions)
- [ ] Boats and Streams (15 questions)
- [ ] Pipes and Cisterns (15 questions)
- [ ] Mixtures and Alligations (15 questions)
- [ ] Permutations and Combinations (15 questions)
- [ ] Probability (15 questions)
- [ ] Mensuration (15 questions)
- [ ] Clocks and Calendars (15 questions)
- [ ] Data Interpretation (20 questions)

### Reasoning Expansion
- [ ] Blood Relations (15 questions)
- [ ] Seating Arrangement (15 questions)
- [ ] Puzzles (15 questions)
- [ ] Direction Sense (15 questions)
- [ ] Syllogisms (15 questions)
- [ ] Inequalities (15 questions)

### Verbal Expansion
- [ ] Grammar (15 questions)
- [ ] Sentence Correction (15 questions)
- [ ] Fill in the Blanks (15 questions)
- [ ] Reading Comprehension (10 passages)
- [ ] Para Jumbles (15 questions)
- [ ] Error Spotting (15 questions)

### Company-Specific Sets
- [ ] Infosys (25 questions - include cryptarithmetic)
- [ ] Wipro (25 questions)
- [ ] Accenture (25 questions)
- [ ] Infosys (25 questions)
- [ ] Capgemini (25 questions)
- [ ] Cognizant (25 questions)
- [ ] Deloitte (25 questions)
- [ ] HCL (25 questions)
- [ ] IBM (25 questions)
- [ ] Tech Mahindra (25 questions)

## Phase 5: Advanced Features (FUTURE)

### Practice Enhancements
- [ ] Timed practice mode
- [ ] Mock test generator (random questions across topics)
- [ ] Score tracking and progress analytics
- [ ] Weak topic identification
- [ ] Spaced repetition for wrong answers
- [ ] Bookmark difficult questions

### Data & Research Tools
- [ ] Automated scraping scripts for IndiaBIX
- [ ] Automated scraping for PrepInsta
- [ ] PDF parser for placement papers
- [ ] Deduplication system
- [ ] Difficulty auto-classification
- [ ] Formula extraction from explanations

### Community & Sharing
- [ ] Export question sets as PDF
- [ ] Import custom questions
- [ ] Question error reporting
- [ ] Suggest alternative explanations
- [ ] Community-verified shortcuts

## Phase 6: Polish & Deployment

- [ ] Performance optimization for large JSON files
- [ ] Lazy loading of question data
- [ ] Service worker for offline practice
- [ ] PWA support
- [ ] Deploy to static hosting (GitHub Pages/Vercel)
- [ ] README and contribution guidelines
- [ ] Data update workflow documentation

## Current Statistics (v1.0)

| Metric | Count |
|--------|-------|
| Total Questions | 122 |
| Quant Topics with Data | 6 |
| Reasoning Topics with Data | 2 |
| Verbal Topics with Data | 1 |
| Company-Specific Sets | 1 (TCS) |
| Detected Patterns | 15 |
| Data Sources Used | 4 |

## Notes

- The PRIMARY focus remains research and data collection.
- UI features are intentionally minimal and distraction-free.
- All data is stored locally in clean JSON files.
- The system is designed for incremental expansion.
- Each question follows the strict schema for consistency.
