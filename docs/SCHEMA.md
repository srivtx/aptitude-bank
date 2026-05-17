# Placement Aptitude Question Schema

## Question Object Format

Every question in the system follows this JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "topic", "subtopic", "difficulty", "question", "options", "answer", "explanation", "source"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier in format {topic}_{subtopic}_{number} e.g. quant_hcf_001"
    },
    "topic": {
      "type": "string",
      "description": "Main topic: quant, reasoning, verbal"
    },
    "subtopic": {
      "type": "string",
      "description": "Specific subtopic from topic map"
    },
    "difficulty": {
      "type": "string",
      "enum": ["easy", "medium", "hard"],
      "description": "Difficulty classification"
    },
    "company_tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Companies that asked this question or similar"
    },
    "question": {
      "type": "string",
      "description": "The question text in plain text"
    },
    "options": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 4,
      "maxItems": 5,
      "description": "Answer options. First option = A, second = B, etc."
    },
    "answer": {
      "type": "string",
      "description": "Correct option letter: A, B, C, or D"
    },
    "explanation": {
      "type": "string",
      "description": "Detailed step-by-step explanation"
    },
    "shortcut": {
      "type": "string",
      "description": "Shortcut or trick to solve quickly"
    },
    "formula_used": {
      "type": "string",
      "description": "Primary formula or concept used"
    },
    "trap_type": {
      "type": "string",
      "description": "Common trap or mistake students make"
    },
    "source": {
      "type": "string",
      "description": "Source name: IndiaBIX, PrepInsta, GeeksforGeeks, etc."
    },
    "source_url": {
      "type": "string",
      "description": "URL to original source if available"
    },
    "pattern_detected": {
      "type": "string",
      "description": "Identified repeating pattern code"
    }
  }
}
```

## File Naming Convention

- Data files: `{subtopic}.json` (plural form)
- Each file contains an array of question objects
- File size: maximum 500 questions per file for performance

## Example Question

```json
{
  "id": "quant_hcf_001",
  "topic": "quant",
  "subtopic": "hcf_lcm",
  "difficulty": "easy",
  "company_tags": ["TCS", "Infosys", "Wipro"],
  "question": "Find the HCF of 54 and 24.",
  "options": ["6", "8", "12", "18"],
  "answer": "A",
  "explanation": "Factors of 54: 1, 2, 3, 6, 9, 18, 27, 54. Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Common factors: 1, 2, 3, 6. Highest = 6.",
  "shortcut": "Use Euclidean algorithm: 54 = 24*2 + 6, 24 = 6*4 + 0, so HCF = 6.",
  "formula_used": "Euclidean Algorithm",
  "trap_type": "Choosing LCM instead of HCF",
  "source": "IndiaBIX",
  "source_url": "",
  "pattern_detected": "P001"
}
```
