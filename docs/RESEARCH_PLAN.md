# Research and Scraping Plan

## Phase 1: Source Identification

### Primary Sources (High Reliability)
1. **IndiaBIX** (indiabix.com)
   - Sections: Aptitude, Logical Reasoning, Verbal Ability
   - URL patterns: `/aptitude/{topic}/`, `/logical-reasoning/{topic}/`
   - Rate limit: 1 request/sec
   - Method: Parse topic pages, extract question blocks

2. **PrepInsta** (prepinsta.com)
   - Company-specific pages very valuable
   - URL patterns: `/{company}-placement-papers/`, `/aptitude/{topic}/`
   - Contains actual previous year questions
   - Method: Company-wise scraping for tagged questions

3. **GeeksforGeeks Aptitude** (geeksforgeeks.org/aptitude/)
   - Well-structured topic pages
   - Often includes explanations and shortcuts
   - URL patterns: `/{topic}-aptitude/`
   - Method: Topic page scraping

4. **FacePrep** (faceprep.in)
   - Company-specific and topic-wise content
   - Good for pattern detection
   - Method: Topic and company scraping

### Secondary Sources
5. **Freshersworld** (freshersworld.com) - Campus placement papers
6. **Testbook** (testbook.com) - Topic-wise practice sets
7. **CareerRide** (careerride.com) - Placement questions
8. **PlacementSeason** - PDF collections

### Tertiary Sources
9. Previous year PDFs from college training centers
10. Mock test platforms: TCSCraze, PrepBytes, Unstop
11. Company career sites: TCS NQT, InfyTQ, Wipro NLTH archives

## Phase 2: Scraping Architecture

### Tools
- `axios` or `node-fetch` for HTTP requests
- `cheerio` for HTML parsing (lightweight, server-friendly)
- `puppeteer` only for JS-rendered pages (slower, use sparingly)
- Custom rate limiting: max 2 requests/second per domain
- User-agent rotation to avoid blocks
- Request delay: 1-3 seconds between requests

### Scraping Strategy
1. **Topic Crawler**: Start from topic index page, collect all question URLs
2. **Question Parser**: Extract question text, options, answer, explanation from detail page
3. **Deduplication**: Hash question text to avoid storing duplicates
4. **Classification**: Auto-classify into subtopic based on keywords

### Deduplication Logic
```
Normalize: lowercase, remove extra spaces, remove numbers (if not part of question)
Hash: SHA256 of normalized text
Store: Check hash before inserting new question
```

## Phase 3: Data Cleaning Pipeline

### Normalization Rules
1. Convert all text to UTF-8
2. Remove HTML tags and entities
3. Standardize mathematical notation: `x^2` instead of superscript
4. Convert fractions to `a/b` format
5. Standardize units (km/h, m/s, Rs.)
6. Fix common OCR errors: `0` vs `O`, `1` vs `l`, `5` vs `S`

### Quality Checks
- Must have at least 4 options
- Must have one clearly marked answer
- Question text must be > 20 characters
- Explanation must be > 50 characters (for medium/hard)

## Phase 4: Manual Research & Gap Filling

### Topics Requiring Manual Collection
- Company-specific recent questions (2022-2024)
- Cryptarithmetic puzzles (Infosys specialty)
- Advanced seating arrangement with 10+ constraints
- Complex data interpretation caselets

### Research Method
1. Search: `{company} placement questions 2024 site:reddit.com OR site:quora.com`
2. Collect from student experience posts
3. Cross-verify with PrepInsta/IndiaBIX
4. Add to JSON with `source: "student_report"` and confidence flag

## Phase 5: Pattern Detection

### Automated Pattern Extraction
After collecting 50+ questions per subtopic:
1. **Template Detection**: Group questions with similar structure
   - Example: "If A can complete work in X days and B in Y days..." -> Time-Work template T001
   
2. **Formula Frequency**: Track which formulas appear most
   - Count occurrences of each `formula_used` field
   
3. **Trap Analysis**: Identify most common `trap_type` per subtopic
   
4. **Shortcut Clustering**: Group questions solvable by same shortcut

### Pattern Storage
Save patterns to `/data/patterns/`:
- `repeated_patterns.json`: Template structures with examples
- `shortcuts.json`: Shortcut index with applicable topics
- `traps.json`: Common traps with prevention tips
- `company_signatures.json`: Question styles unique to each company
