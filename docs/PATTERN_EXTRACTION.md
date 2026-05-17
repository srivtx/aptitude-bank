# Pattern Extraction System

## Pattern Types

### 1. Structural Patterns (Templates)
Questions that follow identical structure with different numbers.

**Example Template T001 (Time-Work):**
```
"A can complete a work in [X] days and B can complete the same work in [Y] days. 
If they work together, in how many days will the work be completed?"
```
**Applies to subtopic**: time_work
**Formula**: 1/(1/X + 1/Y) = XY/(X+Y)
**Shortcut**: Product / Sum
**Frequency**: Very High (asked in 90% of placements)

### 2. Formula Patterns
Track which formulas are most frequently used per subtopic.

**Example F001 (Profit-Loss):**
```
Formula: Selling Price = Cost Price * (100 + Gain%)/100
Frequency: 85% of profit_loss questions
Complexity: Basic
```

### 3. Trap Patterns
Common mistakes that create wrong answers.

**Example TR001 (Percentages):**
```
Trap: If A is 20% more than B, then B is NOT 20% less than A.
Correct: B is (20/120)*100 = 16.67% less than A.
Frequency: Appears in 60% of percentage comparison questions
Prevention: Always calculate from the correct base
```

### 4. Shortcut Patterns
Non-obvious fast-solving methods.

**Example S001 (HCF-LCM):**
```
Shortcut: For any two numbers, Product = HCF * LCM
Use: Given product and one number, find other instantly
Applicable: hcf_lcm
Time saved: 30-45 seconds
```

### 5. Company Signature Patterns
Question styles unique to specific companies.

**Example C001 (TCS):**
```
Pattern: TCS frequently asks "Which of the following is the largest/smallest?"
Format: 4 expressions with powers, roots, and fractions
Method: Approximation and comparison
Frequency in TCS: 70% of number_system questions
```

**Example C002 (Infosys):**
```
Pattern: Cryptarithmetic puzzles (e.g., SEND + MORE = MONEY)
Format: Alphabets represent unique digits
Method: Carry analysis and constraint propagation
Frequency in Infosys: 1-2 questions per test
```

## Pattern Detection Algorithm

### Step 1: Template Matching
```
For each question:
  1. Remove all numbers and specific values -> Template string
  2. Hash template string
  3. Group questions with same template hash
  4. If group size > 5, save as verified pattern
```

### Step 2: Formula Frequency Analysis
```
For each subtopic:
  Count occurrences of each formula_used value
  Rank by frequency
  Mark top 3 as "high_frequency"
```

### Step 3: Trap Clustering
```
For each subtopic:
  Group by trap_type
  Count frequency
  Identify most common traps
  Create "trap_prevention" tip for each
```

### Step 4: Company Style Analysis
```
For each company_tag:
  Analyze question distribution by subtopic
  Identify over-represented subtopics
  Detect unique question formats
  Save as company signature
```

## Pattern Storage Format

### repeated_patterns.json
```json
{
  "patterns": [
    {
      "pattern_id": "T001",
      "name": "Time-Work Two Workers",
      "template": "A can complete in X days, B in Y days, together in ?",
      "subtopic": "time_work",
      "difficulty": "easy",
      "formula": "XY/(X+Y)",
      "shortcut": "Product/Sum",
      "example_ids": ["quant_time_work_001", "quant_time_work_015"],
      "frequency": "very_high",
      "companies": ["TCS", "Wipro", "HCL"]
    }
  ]
}
```

### shortcuts.json
```json
{
  "shortcuts": [
    {
      "shortcut_id": "S001",
      "name": "HCF-LCM Product Rule",
      "description": "For two numbers: Product = HCF * LCM",
      "applicable_subtopics": ["hcf_lcm"],
      "when_to_use": "Given product and one number, find other",
      "time_saved": "30-45 seconds",
      "example_question_id": "quant_hcf_001"
    }
  ]
}
```

### traps.json
```json
{
  "traps": [
    {
      "trap_id": "TR001",
      "name": "Percentage Base Error",
      "description": "A is 20% more than B does NOT mean B is 20% less than A",
      "affected_subtopics": ["percentages", "profit_loss"],
      "prevention": "Always calculate percentage from the correct base value",
      "frequency": "high",
      "example_wrong_answer": "20%",
      "example_correct_answer": "16.67%"
    }
  ]
}
```

### company_signatures.json
```json
{
  "companies": [
    {
      "company": "TCS",
      "signature_patterns": ["C001", "C003"],
      "high_frequency_topics": ["number_system", "time_speed_distance", "percentages"],
      "unique_formats": ["Largest/Smallest expression comparison"],
      "average_difficulty": "medium",
      "time_per_question": "60-90 seconds"
    }
  ]
}
```
