# Grade Converter AI Tool - Quick Reference

## What Is It?
An AI-powered grade conversion and analysis tool that converts between multiple grading systems (marks, percentage, GPA, CGPA, letter grades) and provides intelligent academic insights.

## Key Features

### 1️⃣ Grade Conversion
- Convert marks → percentage
- Convert percentage → GPA
- Convert GPA → CGPA
- Convert any format to letter grades
- Support for 5 international grading systems

### 2️⃣ AI Analysis
- Academic strength assessment
- University competitiveness scoring
- International grade equivalents
- Scholarship eligibility check
- Personalized recommendations

### 3️⃣ Performance Tracking
- Compare grades across assessments
- Identify performance trends
- Track improvements over time
- Average performance calculation

---

## API Endpoints

### Convert Grades
```
POST /ai/convert-grades
Input: { inputType, inputValue, totalMarks?, outputType, gradingSystem? }
Output: { percentage, gpa, cgpa, letterGrade, analysis, ... }
```

### Analyze Grades
```
POST /ai/analyze-grades
Input: { marks?, subjects?, totalMarks?, percentage? }
Output: { percentage, analysis, marksBreakdown, recommendations, ... }
```

### Compare Performance
```
POST /ai/compare-grades
Input: { assessments: [{ name, percentage }, ...] }
Output: { trend, averagePerformance, bestPerformance, progression, ... }
```

---

## Supported Formats

| Format | Example | Scale |
|--------|---------|-------|
| Marks | 85/100 | 0-100 |
| Percentage | 85% | 0-100 |
| GPA | 3.7 | 0-4.0 |
| CGPA | 8.5 | 0-10.0 |
| Letter | A- | A+ to F |

---

## Grading Systems

- 🇺🇸 US (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F)
- 🇬🇧 UK (First Class, Upper Second (2:1), Lower Second (2:2), Third)
- 🇮🇳 India (O, A+, A, B+, B, C)
- 🇨🇦 Canada (A+, A, A-, B+, B, B-, etc.)
- 🇦🇺 Australia (HD, D, C, P, F)

---

## Performance Levels

| Level | Range | Assessment |
|-------|-------|-----------|
| Excellent | 90%+ | Highly competitive, top universities |
| Very Good | 80-89% | Competitive, good university prospects |
| Good | 70-79% | Acceptable, average universities |
| Fair | 60-69% | Below average, may need support |
| Poor | <60% | Needs improvement, consider intervention |

---

## Example Usage

### JavaScript (Frontend)
```javascript
// Convert marks to percentage
const result = await gradeConverter.convertGrades({
  inputType: 'marks',
  inputValue: 85,
  totalMarks: 100,
  outputType: 'percentage'
});
// Returns: { percentage: 85, gpa: 3.7, letterGrade: 'A-', ... }

// Analyze subject-wise performance
const analysis = await gradeConverter.analyzeGrades({
  marks: [85, 78, 92, 88],
  subjects: ['Math', 'Physics', 'Chemistry', 'English']
});
// Returns: analysis with strengths, weaknesses, recommendations

// Compare semester performance
const comparison = await gradeConverter.compareGrades([
  { name: 'Sem 1', percentage: 75 },
  { name: 'Sem 2', percentage: 82 },
  { name: 'Sem 3', percentage: 88 }
]);
// Returns: { trend: 'Strong Upward Trend', progression: 'Improving', ... }
```

### cURL (API)
```bash
curl -X POST http://localhost:3000/ai/convert-grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "inputType": "marks",
    "inputValue": 85,
    "totalMarks": 100,
    "outputType": "percentage"
  }'
```

---

## AI Insights Provided

✨ **Strength Assessment** - Identifies academic level and competitiveness
✨ **University Matching** - Suggests suitable universities based on grades
✨ **Scholarship Info** - Indicates scholarship eligibility
✨ **Personalized Recommendations** - Suggests improvement areas and strategies
✨ **Trend Analysis** - Shows whether performance is improving or declining
✨ **International Comparison** - Provides equivalents in different systems

---

## Response Structure

```json
{
  "success": true,
  "gradeConversion": {
    "percentage": 85,
    "gpa": 3.7,
    "cgpa": 8.5,
    "letterGrade": "A-",
    "classification": "First Class",
    "internationalEquivalent": {
      "US": "A-",
      "UK": "Upper Second Class (2:1)",
      "India": "A (Very Good)"
    },
    "analysis": {
      "strength": "Very Good",
      "competitiveness": "Competitive for top 50 universities",
      "recommendations": [...]
    }
  }
}
```

---

## Integration Points

✅ Integrated with NestJS backend
✅ Works with existing authentication
✅ Part of `/ai` controller
✅ Uses same error handling as other AI tools
✅ Frontend client ready to use
✅ RESTful API design

---

## Files

| File | Purpose |
|------|---------|
| `src/ai/services/grade-conversion.service.ts` | Core service logic |
| `src/ai/ai.controller.ts` | API endpoints |
| `src/ai/ai.module.ts` | Module configuration |
| `web/assets/js/grade-converter-client.js` | Frontend client |
| `server/GRADE_CONVERTER_API.md` | Detailed API docs |

---

## Build Status

✅ Backend: Compiles successfully
✅ TypeScript: All types correct
✅ Module: Fully integrated
✅ API: All endpoints functional
✅ Frontend: Client ready
✅ Documentation: Complete

---

## Next Steps

1. ✅ Start backend: `npm run start` in server/server
2. ✅ Include JS in your HTML: `<script src="assets/js/grade-converter-client.js"></script>`
3. ✅ Call APIs: `await gradeConverter.convertGrades(...)`
4. ✅ Display results on your UI

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Language:** TypeScript + JavaScript  
**Framework:** NestJS  

For detailed documentation, see: `server/GRADE_CONVERTER_API.md`
