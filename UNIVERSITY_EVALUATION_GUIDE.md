# University Shortlist Evaluation Feature - Implementation Guide

## Overview
This feature allows users to input 3-5 universities they're shortlisting and get an AI-powered evaluation based on their academic profile, budget, and career goals.

## Features

### 1. **Quick University Input**
- Users can enter universities in multiple formats:
  - Comma-separated: `MIT, Stanford, UC Berkeley, Carnegie Mellon, Harvard`
  - Line-separated: Each university on a new line
- Minimum 3, maximum 5 universities
- Real-time validation and preview

### 2. **User Profile Capture**
The system collects:
- **Undergraduate Major**: e.g., B.Tech in Computer Science, BBA
- **Master's Programme**: e.g., MS Computer Science, MBA
- **CGPA/Percentage**: Scale from 0-10 (or percentage)
- **Work Experience**: In months
- **Annual Budget**: Tiered selection (Below ₹15L to Above ₹40L)

### 3. **Advanced Evaluation Algorithm**
The evaluation engine scores universities across 6 dimensions:

#### a) **Academic Fit (25% weight)**
- Compares user GPA against university requirements
- Ranges from "Excellent fit" (1.5+ GPA above requirement) to "Very challenging" (below requirements)

#### b) **Admission Probability (20% weight)**
- Based on university acceptance rates
- High (>50% accept rate), Moderate (30-50%), Competitive (15-30%), Highly selective (<15%)

#### c) **Cost-Benefit Analysis (15% weight)**
- Evaluates tuition against user budget
- Calculates ROI (Average salary / Tuition)
- Considers scholarship availability

#### d) **Course Match (15% weight)**
- Scores program relevance to user's desired field
- Perfect match → Strong match → Related programs

#### e) **Reputation & Rankings (15% weight)**
- World ranking considerations (Top 50, 100, 200, 500)
- Employment rate bonuses

#### f) **Career Prospects (10% weight)**
- Average graduate salary potential
- Employment rate post-graduation
- Top employer reputation

### 4. **Results & Recommendations**
Users receive:
- **Overall Evaluation Score** (0-100%)
- **Personalized Recommendation Level**:
  - 🌟 Highly Recommended (85%+)
  - ✓ Recommended (75-84%)
  - △ Consider (65-74%)
  - ⚠ Challenging (<65%)
- **Detailed Factor Breakdown** with expandable details
- **Top Recommendation Highlight** with actionable insights
- **Complete Ranking** of all entered universities
- **Next Steps Guidance**

## Component Structure

### Main Component: `UniversityEvaluatorFlow.tsx`
```tsx
interface EvaluationResult {
  name: string;
  evaluationScore: number;
  recommendation: string;
  factors: {
    academic: { score: number; text: string };
    admission: { score: number; text: string };
    cost: { score: number; text: string };
    courseMatch: { score: number; text: string };
    reputation: { score: number; text: string };
  };
}
```

### Evaluation Engine: `universityEvaluationEngine.ts`
The `UniversityEvaluationEngine` class provides:
- `calculateAcademicScore()` - GPA-based scoring
- `calculateAdmissionScore()` - Acceptance rate scoring
- `calculateCostScore()` - Budget and ROI analysis
- `calculateCourseMatchScore()` - Program relevance
- `calculateReputationScore()` - Ranking-based scoring
- `calculateCareerProspectsScore()` - Salary and employment analysis
- `evaluateUniversity()` - Comprehensive evaluation
- `rankUniversities()` - Sort and rank multiple universities
- `generateSummary()` - Create recommendation text

## Integration with Onboarding Flow

### Current Integration Path
The component can be integrated into the onboarding flow in multiple ways:

#### Option 1: Add as a New Goal Selection Option
Add to the `goal` step in onboarding:
```tsx
{
  value: 'evaluate',
  label: 'Quickly evaluate my shortlisted universities',
  icon: 'assessment',
  iconClass: 'icon-blue',
  emoji: '📊'
}
```

#### Option 2: Direct URL Route
Create a route at `/onboarding/evaluate`:
```tsx
// app/(onboarding)/onboarding/evaluate/page.tsx
import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";

export default function EvaluatePage() {
  return <UniversityEvaluatorFlow />;
}
```

#### Option 3: Embedded in Compare Flow
Integrate into existing compare flow as an enhanced shortlist manager.

## API Integration

The component uses existing API endpoint:
```typescript
aiApi.compareShortlist(
  shortlist: Array<{ name: string; course: string }>,
  profile: { bachelors?: string; workExp?: string; gpa?: string }
)
```

This calls: `POST /ai/compare-shortlist`

## Usage Example

```tsx
import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";

export default function Page() {
  return (
    <div className="container">
      <UniversityEvaluatorFlow />
    </div>
  );
}
```

## Scoring Formula

**Overall Score = (Academic × 0.25) + (Admission × 0.20) + (Cost × 0.15) + (Course × 0.15) + (Reputation × 0.15) + (Career × 0.10)**

### Example Calculation:
```
University: MIT
- Academic Score: 85% (Strong fit)
- Admission Score: 20% (2% acceptance rate)
- Cost Score: 75% (Within budget)
- Course Match: 95% (Perfect match)
- Reputation: 95% (Rank #1)
- Career Score: 95% (High salary, 98% employment)

Overall = (85 × 0.25) + (20 × 0.20) + (75 × 0.15) + (95 × 0.15) + (95 × 0.15) + (95 × 0.10)
Overall = 21.25 + 4 + 11.25 + 14.25 + 14.25 + 9.5 = 74.5% (Recommended)
```

## User Flow

```
1. Input 3-5 Universities
   ↓
2. Enter Personal Profile
   (Undergrad, Master's, GPA, Experience, Budget)
   ↓
3. AI Evaluation
   (System evaluates each university)
   ↓
4. View Results
   - Top recommendation highlighted
   - All universities ranked
   - Detailed factor breakdown
   - Next steps guidance
   ↓
5. Actions
   - View full details
   - Apply now
   - Compare different universities
```

## Customization Points

### Adjust Evaluation Weights
Modify weights in `UniversityEvaluationEngine.evaluateUniversity()`:
```typescript
const weights = {
  academic: 0.25,      // 25%
  admission: 0.20,     // 20%
  cost: 0.15,         // 15%
  courseMatch: 0.15,  // 15%
  reputation: 0.15,   // 15%
  career: 0.10,       // 10%
};
```

### Adjust Scoring Thresholds
Modify thresholds in individual scoring methods:
```typescript
if (ranking <= 50) { score = 95; }      // Top 50
else if (ranking <= 100) { score = 85; } // Top 100
else if (ranking <= 200) { score = 75; } // Top 200
```

### Customize Recommendation Text
Modify recommendation logic in `evaluateUniversity()`:
```typescript
if (overallScore >= 85) recommendation = "🌟 Highly Recommended";
else if (overallScore >= 75) recommendation = "✓ Recommended";
// ... etc
```

## Testing Scenarios

### Test Case 1: Perfect Match
```
Universities: MIT, Stanford, Harvard
Profile: 8.5 GPA, 24 months exp, MS CS, Budget: Above ₹40L
Expected: High scores for all, MIT likely top
```

### Test Case 2: Budget Constraints
```
Universities: MIT, TUM, McGill, NUS, Trinity Dublin
Profile: 7.2 GPA, 12 months exp, MBA, Budget: Below ₹15L
Expected: TUM and Trinity likely top (lower tuition)
```

### Test Case 3: Academic Challenge
```
Universities: MIT, Stanford, Harvard
Profile: 6.0 GPA, 0 months exp, MS CS
Expected: Lower scores, challenging recommendations
```

## Future Enhancements

1. **Visa & Work Permit Analysis**: Score based on post-study work opportunities
2. **Scholarship Matching**: Automatic scholarship eligibility assessment
3. **Alumni Network Comparison**: Track alumni success metrics
4. **Real-Time Ranking Updates**: Live world rankings integration
5. **Debt vs. Earning Calculator**: Visualize ROI with actual loan calculations
6. **Application Timeline**: Auto-generate application deadline checklist
7. **Interview Prep**: Connect to interview coaching based on university
8. **Scholarship Search**: Integrated scholarship database matching

## Troubleshooting

### Issue: API returns no data
**Solution**: Ensure university names match database. Try variations or full names.

### Issue: Scores seem low
**Solution**: Check that profile data is accurately entered. GPA scale matters (4.0 vs 10.0).

### Issue: Budget scoring not reflected
**Solution**: Ensure budget value is one of: `below_15`, `15_25`, `25_40`, `above_40`

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (12+)
- Mobile browsers: Fully responsive

## Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation supported
- Screen reader friendly
- High contrast support
- Mobile touch-friendly buttons

---

**Last Updated**: May 2026
**Version**: 1.0.0
