# AI Verification Tool Documentation

## Overview
The AI Verification Tool is an intelligent eligibility assessment system designed to evaluate loan applications based on multiple financial and demographic factors. It uses a sophisticated scoring algorithm to provide users with real-time eligibility estimates and personalized recommendations.

## Purpose
The tool helps prospective borrowers understand their loan eligibility status before submitting a formal application, enabling informed decision-making and allowing users to take proactive steps to improve their eligibility if needed.

## Key Features

### 1. **Real-Time Eligibility Assessment**
- Instant evaluation based on user input
- Dynamic status badges (Likely Eligible, Borderline, Not Likely)
- Visual score representation with color-coded feedback

### 2. **Comprehensive Scoring Algorithm**
The tool evaluates applicants across multiple dimensions:

#### Age Factor (15 points max)
- Optimal range: 18-60 years
- Full credit: +15 points
- Outside range: -20 points

#### Credit Score (25 points max)
- Excellent (750+): +25 points
- Very Good (700-749): +15 points
- Good (650-699): +8 points
- Fair (600-649): +2 points
- Poor (<600): -15 points

#### Employment Status (10 points max)
- Employed: +10 points
- Self-employed: +7 points
- Student: +4 points
- Other: -10 points

#### Education Level (7 points max)
- Doctoral: +7 points
- Master's: +6 points
- Undergraduate: +4 points
- Other: +2 points

#### Income-to-Loan Ratio (20 points max)
- 1.5x or higher: +20 points
- 1.0x to 1.49x: +12 points
- 0.6x to 0.99x: +6 points
- Below 0.6x: -10 points

#### Co-Applicant (8 points max)
- With co-applicant: +8 points
- Without: +0 points

#### Collateral (10 points max)
- With collateral: +10 points
- Without: +0 points

### 3. **Eligibility Status Categories**

| Score Range | Status | Coverage | Estimated Rate |
|-------------|--------|----------|-----------------|
| 70-100 | Likely Eligible | Up to 95% of course cost | 8.5% - 10.9% |
| 50-69 | Borderline | Up to 80% of course cost | 10.5% - 13.5% |
| 0-49 | Not Likely | Up to 60% of course cost | 12.5% - 16.5% |

### 4. **Personalized Recommendations**
Based on the application profile, the tool provides up to 4 actionable recommendations:
- Credit improvement strategies
- Affordability optimization tips
- Documentation preparation guidance
- Loan structuring suggestions
- Study level advantages

## Implementation

### File Location
`web/assets/js/ai-tools.js`

### Required HTML Elements
The tool expects the following HTML structure:

```html
<form id="aiEligibilityForm">
    <!-- Input fields with specific IDs -->
    <input id="aiAge" type="number" />
    <input id="aiCredit" type="number" />
    <input id="aiIncome" type="number" />
    <input id="aiLoan" type="number" />
    <select id="aiEmployment"></select>
    <select id="aiStudy"></select>
    <select id="aiCoApplicant"></select>
    <select id="aiCollateral"></select>
</form>

<!-- Output display elements -->
<div id="aiResultBadge"></div>
<div id="aiScoreText"></div>
<div id="aiScoreBar"></div>
<div id="aiSummary"></div>
<ul id="aiRecommendations"></ul>
```

### CSS Classes Used
- `.text-xs`, `.font-bold`, `.uppercase`, `.tracking-[0.2em]`, `.px-3`, `.py-1`, `.rounded-full`
- Status colors:
  - Eligible: `bg-emerald-100`, `text-emerald-700`
  - Borderline: `bg-amber-100`, `text-amber-700`
  - Not Likely: `bg-rose-100`, `text-rose-700`
  - Idle: `bg-gray-200/70`, `text-gray-700`
- Score bar colors:
  - 70+: `bg-emerald-500`
  - 50-69: `bg-amber-500`
  - <50: `bg-rose-500`

## Usage Instructions

### For End Users
1. Navigate to the loan eligibility page
2. Fill in all required information:
   - Age
   - Credit score
   - Annual income
   - Desired loan amount
   - Employment status
   - Study level
   - Co-applicant availability
   - Collateral availability
3. Submit the form to receive instant evaluation
4. Review eligibility status, score, and personalized recommendations
5. Use recommendations to strengthen application if needed

### For Developers

#### Integration
```javascript
// The script automatically initializes on page load
document.addEventListener('DOMContentLoaded', () => {
    // Tool initializes and attaches event listeners
});
```

#### Customization
To modify scoring weights, edit the `calculateScore()` function:

```javascript
const calculateScore = (data) => {
    let score = 0;
    // Adjust point values as needed
    if (data.age >= 18 && data.age <= 60) {
        score += 15; // Modify this value
    }
    // ... other scoring logic
};
```

#### Testing
Test with various input combinations to ensure the tool:
- Calculates scores accurately
- Displays appropriate status badges
- Provides relevant recommendations
- Handles edge cases (missing data, invalid values)

## Affordability Ratio Calculation

The tool calculates an affordability ratio to help assess loan repayment capacity:

```
Affordability Ratio = Annual Income / Loan Amount
```

**Interpretation:**
- **Ratio ≥ 1.5:** Strong affordability (excellent repayment capacity)
- **Ratio 1.0-1.49:** Good affordability
- **Ratio 0.6-0.99:** Moderate affordability
- **Ratio < 0.6:** Tight affordability (may need larger co-applicant contribution)

## Output Display

### Status Badge
- Dynamic styling based on eligibility status
- Color-coded for quick visual understanding
- Responsive design compatible with light and dark modes

### Score Bar
- Visual representation of numerical score (0-100)
- Color changes based on score level
- Smooth transitions for better UX

### Summary
- Detailed explanation including:
  - Estimated coverage percentage
  - Expected interest rate range
  - Affordability ratio analysis
  - Annual income formatted as currency

### Recommendations
- Up to 4 actionable tips displayed as a list
- Each recommendation includes a checkmark icon
- Tailored to the applicant's specific profile
- Ordered by relevance and impact

## Error Handling

The tool includes robust error handling:
- Validates numeric inputs
- Handles missing form elements gracefully
- Clamps scores to 0-100 range
- Provides safe currency formatting
- Prevents division by zero in ratio calculations

## Browser Compatibility
- Modern browsers supporting ES6+
- Requires Material Symbols Outlined icon library
- Supports dark mode with CSS custom classes

## Future Enhancements
- Integration with actual credit scoring APIs
- Real-time interest rate data from lenders
- Machine learning model for improved predictions
- Multi-language support
- Export eligibility reports as PDF
- Comparison with user's past applications
