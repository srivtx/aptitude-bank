# Difficulty Classification System

## Classification Criteria

Difficulty is assigned based on multiple factors:

### Easy
- **Time to solve**: < 60 seconds
- **Concepts required**: 1 basic formula or direct application
- **Steps involved**: 1-2 steps
- **Trick potential**: Low chance of common mistake
- **Company frequency**: Asked in almost all company exams

### Medium
- **Time to solve**: 60-120 seconds
- **Concepts required**: 2 formulas or 1 formula with twist
- **Steps involved**: 3-4 steps
- **Trick potential**: Moderate - has 1 common trap
- **Company frequency**: Asked in most company exams

### Hard
- **Time to solve**: 120-180+ seconds
- **Concepts required**: 3+ concepts or advanced application
- **Steps involved**: 5+ steps or requires insight
- **Trick potential**: High - multiple traps or counterintuitive
- **Company frequency**: Asked in selective companies (Infosys, Deloitte, IBM)

## Difficulty Assignment Rules by Topic

### Number System & HCF/LCM
- **Easy**: Direct HCF/LCM of 2 numbers, basic divisibility rule
- **Medium**: HCF/LCM with 3+ numbers, remainder problems, co-prime applications
- **Hard**: Advanced remainder theorems, Euler's theorem applications, last digit of powers

### Percentages & Profit-Loss
- **Easy**: Direct percentage calculation, basic profit/loss
- **Medium**: Successive discounts, false weight, marked price calculations
- **Hard**: Multiple transactions, complex discount structures, break-even analysis

### Time-Speed-Distance
- **Easy**: Direct formula application (D = S * T)
- **Medium**: Average speed, relative speed, train problems
- **Hard**: Races, circular tracks, escalators, boats with changing stream speed

### Time-Work
- **Easy**: 2 workers, direct work rate
- **Medium**: 3+ workers, efficiency variations, leave/absence problems
- **Hard**: Complex pipe systems, work with wages, simultaneous work-leave

### Reasoning
- **Easy**: Simple series (difference/multiple), direct blood relation, basic coding
- **Medium**: Complex series, coded blood relations, circular seating with 2-3 constraints
- **Hard**: 3D arrangements, multi-layer puzzles, complex syllogism with 4 statements

### Verbal
- **Easy**: Direct synonym/antonym, single error spotting, fact-based RC
- **Medium**: Contextual vocabulary, double fill blanks, inference-based RC
- **Hard**: Complex para jumbles, critical reasoning, abstract RC passages

## Confidence Scoring

Each difficulty assignment includes a confidence score:
- **High**: Clear classification based on objective criteria
- **Medium**: Some ambiguity, borderline case
- **Low**: Subjective assessment, may need review

Store confidence in a separate field: `difficulty_confidence: "high"`
