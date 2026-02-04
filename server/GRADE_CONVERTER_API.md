# Grade Converter AI Tool - API Reference

## Overview
The Grade Converter is an advanced AI-powered tool that converts between different grading systems (marks, percentages, GPA, CGPA, letter grades) and provides intelligent analysis with international equivalents and recommendations.

## Features
- ✅ Multi-format grade conversion (marks, percentage, GPA, CGPA, letter grades)
- ✅ Support for multiple grading systems (US, UK, India, Canada, Australia)
- ✅ AI-powered academic analysis with insights
- ✅ International grade equivalents
- ✅ Performance comparison across multiple assessments
- ✅ Actionable recommendations
- ✅ Academic competitiveness scoring

## API Endpoints

### 1. Convert Grades
**Endpoint:** `POST /ai/convert-grades`

**Description:** Convert grades from one format to another with AI analysis

**Request Body:**
```json
{
  "inputType": "marks",
  "inputValue": 85,
  "totalMarks": 100,
  "outputType": "percentage",
  "gradingSystem": "India"
}
```

**Parameters:**
- `inputType` (string): Type of input value
  - `marks` - Numeric marks
  - `percentage` - Percentage (0-100)
  - `gpa` - Grade Point Average
  - `cgpa` - Cumulative GPA
  - `letterGrade` - Letter grade (A+, A, B+, etc.)

- `inputValue` (string|number): The grade value to convert

- `totalMarks` (number, optional): Total marks for normalization (required if inputType is 'marks')

- `outputType` (string): Desired output format
  - `percentage`
  - `gpa` (4.0 scale)
  - `cgpa` (10.0 scale)
  - `letterGrade`

- `gradingSystem` (string, optional): Grading system context
  - `US`, `UK`, `India`, `Canada`, `Australia`

**Response:**
```json
{
  "success": true,
  "gradeConversion": {
    "inputGrade": "85/100 marks",
    "outputGrade": "85%",
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
      "competitiveness": "Competitive for most reputed universities",
      "recommendations": [
        "Good chances at top 50 global universities",
        "May qualify for partial scholarships",
        "Focus on strengthening extracurriculars and test scores"
      ]
    }
  }
}
```

---

### 2. Analyze Grades
**Endpoint:** `POST /ai/analyze-grades`

**Description:** Comprehensive grade analysis with subject breakdown and AI insights

**Request Body:**
```json
{
  "marks": [85, 78, 92, 88],
  "subjects": ["Mathematics", "Physics", "Chemistry", "English"],
  "totalMarks": 100
}
```

**Parameters:**
- `marks` (number[], optional): Array of marks obtained
- `subjects` (string[], optional): Corresponding subject names
- `totalMarks` (number, optional): Total marks per subject
- `gpa` (number, optional): GPA score
- `percentage` (number, optional): Percentage score

**Response:**
```json
{
  "success": true,
  "gradeAnalysis": {
    "percentage": 85.75,
    "letterGrade": "A-",
    "classification": "First Class",
    "internationalEquivalent": {
      "US": "A-",
      "UK": "Upper Second Class (2:1)",
      "India": "A (Very Good)"
    },
    "analysis": {
      "strength": "Very Good",
      "competitiveness": "Competitive for most reputed universities",
      "recommendations": [...]
    },
    "marksBreakdown": [
      {
        "subject": "Mathematics",
        "marks": 85,
        "percentage": 85,
        "outOf": 100
      },
      {
        "subject": "Physics",
        "marks": 78,
        "percentage": 78,
        "outOf": 100
      },
      ...
    ]
  }
}
```

---

### 3. Compare Grades
**Endpoint:** `POST /ai/compare-grades`

**Description:** Compare performance across multiple assessments and identify trends

**Request Body:**
```json
{
  "assessments": [
    {
      "name": "Midterm Exam",
      "percentage": 78
    },
    {
      "name": "Semester Exam",
      "percentage": 85
    },
    {
      "name": "Final Exam",
      "percentage": 92
    }
  ]
}
```

**Parameters:**
- `assessments` (object[]): Array of assessment records
  - `name` (string): Assessment name/title
  - `percentage` (number): Performance percentage

**Response:**
```json
{
  "success": true,
  "comparison": {
    "trend": "Strong Upward Trend",
    "averagePerformance": 85,
    "bestPerformance": "Final Exam",
    "worstPerformance": "Midterm Exam",
    "progression": "Improving"
  }
}
```

---

## Grade Conversion Tables

### Percentage to Letter Grade (US System)
| Percentage | Letter | GPA  |
|-----------|--------|------|
| 93-100    | A+     | 4.0  |
| 90-92     | A      | 3.9  |
| 87-89     | A-     | 3.8  |
| 83-86     | B+     | 3.7  |
| 80-82     | B      | 3.0  |
| 77-79     | B-     | 2.8  |
| 73-76     | C+     | 2.5  |
| 70-72     | C      | 2.0  |
| 0-69      | F      | 0.0  |

### Percentage to Classification (India)
| Percentage | Classification          |
|-----------|------------------------|
| 90+       | First Class with Distinction |
| 75-89     | First Class            |
| 60-74     | Second Class           |
| 50-59     | Third Class            |
| 40-49     | Pass                   |
| 0-39      | Fail                   |

### Percentage to UK Honours Degree
| Percentage | Classification              |
|-----------|---------------------------|
| 70+       | First Class Honours        |
| 60-69     | Upper Second Class (2:1)   |
| 50-59     | Lower Second Class (2:2)   |
| 40-49     | Third Class Honours        |
| 0-39      | Fail                      |

---

## Performance Analysis

The AI provides intelligent analysis based on performance levels:

### Strength Ratings
- **Excellent (90%+):** Outstanding performance, top-tier university eligibility
- **Very Good (80-89%):** Strong performance, competitive for reputed universities
- **Good (70-79%):** Satisfactory performance, average university eligibility
- **Fair (60-69%):** Below average, may need additional qualifications
- **Poor (<60%):** Needs improvement, requires intervention

### Competitiveness Scores
- **Highly Competitive:** Top 10-20 global universities
- **Competitive:** Top 50-100 global universities
- **Moderately Competitive:** Top 100-200 global universities
- **Needs Improvement:** Bridge programs or additional certifications required

---

## Frontend Integration

```javascript
// Initialize client
const gradeConverter = new GradeConverterClient();

// Convert marks to percentage
const result = await gradeConverter.convertGrades({
  inputType: 'marks',
  inputValue: 85,
  totalMarks: 100,
  outputType: 'percentage'
});

// Analyze grades with breakdown
const analysis = await gradeConverter.analyzeGrades({
  marks: [85, 78, 92, 88],
  subjects: ['Math', 'Physics', 'Chemistry', 'English']
});

// Compare performance trends
const comparison = await gradeConverter.compareGrades([
  { name: 'Q1', percentage: 75 },
  { name: 'Q2', percentage: 82 },
  { name: 'Q3', percentage: 88 }
]);
```

---

## Use Cases

1. **Students:** Convert grades from different systems to understand international equivalents
2. **Universities:** Assess and compare student performance across different grading systems
3. **Loan Officers:** Evaluate academic strength for education loan eligibility
4. **Advisors:** Provide data-driven recommendations for student improvement

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

---

## Notes

- All percentage values are calculated to 2 decimal places
- GPA calculations use standard 4.0 scale
- CGPA calculations use standard 10.0 scale
- Recommendations are dynamically generated based on performance level
- International equivalents are provided for US, UK, and India grading systems
