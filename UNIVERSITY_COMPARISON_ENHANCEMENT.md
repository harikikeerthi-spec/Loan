# University Comparison Enhancement - Program-Specific with Webometrics Integration

## Overview
Enhanced the university comparison feature to support **program-specific comparisons** and integrate **Webometrics world university rankings** from https://webometricsranking.com/.

---

## 🎯 Key Changes

### 1. **Frontend Updates** (`compare-universities.html`)

#### **Added Program Fields:**
- Changed "Program (Optional)" to "Program *" (now required)
- Added IDs to program input fields:
  - `program1` - Program for University 1
  - `program2` - Program for University 2
- Updated placeholder text to show examples: "e.g. Computer Science, MBA, Engineering"

#### **Updated Validation Logic:**
```javascript
// Now checks for both universities AND programs
if (!uni1Key || !uni2Key) {
    alert('Please enter two universities to compare');
    return;
}

if (!program1 || !program2) {
    alert('Please specify programs for both universities');
    return;
}

// Allows comparing same university with different programs
if (uni1Key === uni2Key && program1 === program2) {
    alert('Please select different universities or programs');
    return;
}
```

#### **Updated API Call:**
```javascript
const json = await AI_API.compareUniversities({
    uni1: uni1Key,
    uni2: uni2Key,
    program1: program1,
    program2: program2
});
```

---

### 2. **API Client Updates** (`ai-api.js`)

Changed from:
```javascript
async compareUniversities(uni1, uni2) {
    body: JSON.stringify({ uni1, uni2 })
}
```

To:
```javascript
async compareUniversities(data) {
    body: JSON.stringify(data)
}
```

Now accepts an object with `uni1`, `uni2`, `program1`, and `program2`.

---

### 3. **Backend Controller Updates** (`ai.controller.ts`)

**Updated endpoint definition:**
```typescript
@Post('compare-universities')
async compareUniversities(
  @Body()
  data: {
    uni1: string;
    uni2: string;
    program1?: string;    // NEW
    program2?: string;    // NEW
  },
) {
  const result = await this.universityComparisonService.compare(
    data.uni1,
    data.uni2,
    data.program1,     // Pass program to service
    data.program2      // Pass program to service
  );
  return {
    success: true,
    data: result,
  };
}
```

---

### 4. **Backend Service Updates** (`university-comparison.service.ts`)

#### **Method Signature:**
```typescript
async compare(
    uni1: string,
    uni2: string,
    program1?: string,    // NEW optional parameter
    program2?: string     // NEW optional parameter
): Promise<{ uni1: UniversityData; uni2: UniversityData }>
```

#### **Enhanced AI Prompt:**

**Webometrics Integration:**
```
IMPORTANT: For the "rank" field, use the Webometrics Ranking (https://webometricsranking.com/) 
which provides the most comprehensive world universities ranking based on web presence and impact.
Format the rank as "#123" (e.g. #5, #42, #150).

If specific program rankings are available (e.g. QS subject rankings, US News program rankings), 
include them in parentheses like "#42 (CS: #15)" where CS is the program ranking.
```

**Program-Specific Data:**
```
Provide program-specific data where applicable:
- Tuition should be specific to the mentioned program if different
- Acceptance rate for the specific program
- Average salary for graduates of that specific program
- Include any program-specific strengths or specializations
```

**Example JSON Response:**
```json
{
    "uni1": {
        "name": "Stanford University",
        "rank": "#3 (Computer Science: #2)",
        "tuition": "$62,000/year for CS program",
        "rate": "3.8% for CS program",
        "salary": "$145,000/year for CS graduates",
        "loc": "Stanford, CA, USA"
    },
    "uni2": {
        "name": "MIT",
        "rank": "#1 (Computer Science: #1)",
        "tuition": "$58,000/year for CS program",
        "rate": "4.1% for CS program",
        "salary": "$150,000/year for CS graduates",
        "loc": "Cambridge, MA, USA"
    }
}
```

---

## 🌟 Features Added

### **1. Program-Specific Comparisons**
✅ Users must now specify the program they want to compare  
✅ Comparisons are tailored to specific programs (e.g., CS, MBA, Engineering)  
✅ Allows comparing the same university for different programs  
  - Example: Stanford CS vs Stanford MBA  

### **2. Webometrics Ranking Integration**
✅ AI references https://webometricsranking.com/ for authoritative rankings  
✅ Webometrics provides comprehensive world university rankings  
✅ Rankings based on web presence, impact, and openness  

### **3. Program-Specific Metrics**
✅ **Tuition:** Program-specific fees (CS program may differ from MBA)  
✅ **Acceptance Rate:** Admission rates for the specific program  
✅ **Graduate Salary:** Average salary for graduates of that specific program  
✅ **Program Rankings:** Subject-specific rankings (e.g., QS, US News)  

### **4. Enhanced Ranking Format**
✅ World Rank: `#3`  
✅ With Program Rank: `#3 (Computer Science: #2)`  
✅ Clear distinction between overall and program-specific rankings  

---

## 📊 Example Use Cases

### **Case 1: Same University, Different Programs**
```
University 1: Stanford University
Program 1: Computer Science

University 2: Stanford University
Program 2: MBA

Result: Compares CS vs MBA programs at Stanford
```

### **Case 2: Same Program, Different Universities**
```
University 1: MIT
Program 1: Artificial Intelligence

University 2: Stanford
Program 2: Artificial Intelligence

Result: Compares AI programs at MIT vs Stanford
```

### **Case 3: Different Programs, Different Universities**
```
University 1: Harvard
Program 1: Law

University 2: Wharton
Program 2: Business Administration

Result: Compares Law at Harvard vs Business at Wharton
```

---

## 🚀 How to Use

1. **Navigate to:** `http://localhost:3000/compare-universities.html`
2. **Fill in the form:**
   - University 1: `MIT`
   - Program 1: `Computer Science`
   - University 2: `Stanford`
   - Program 2: `Computer Science`
3. **Click** "Compare Now"
4. **View Results:**
   - Webometrics World Ranking
   - Program-specific tuition
   - Program acceptance rates
   - Graduate salary for that program
   - Location details

---

## 🔍 Data Sources

### **Webometrics Ranking**
- **URL:** https://webometricsranking.com/
- **Coverage:** 30,000+ universities worldwide
- **Methodology:** Web presence, impact, openness, excellence
- **Updates:** Twice yearly (January & July)

### **Program Rankings** (when available)
- QS World University Rankings by Subject
- US News Best Graduate Schools
- Times Higher Education Subject Rankings
- Shanghai Rankings by Subject

---

## ✅ Benefits

1. **More Accurate Comparisons:**  
   - Same program across universities (apples-to-apples)
   - Program-specific costs and outcomes

2. **Authoritative Rankings:**  
   - Webometrics is globally recognized
   - Transparent methodology
   - Regular updates

3. **Better Decision Making:**  
   - Students can compare relevant programs
   - Understand program-specific ROI
   - See both overall and subject rankings

4. **Flexibility:**  
   - Compare different programs at same university
   - Compare same program across universities
   - Any combination of universities and programs

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add More Comparison Metrics:**
   - Research opportunities
   - Faculty-to-student ratio
   - Alumni network strength
   - Internship/placement rates

2. **Visual Rankings:**
   - Bar charts comparing metrics
   - Color-coded better/worse indicators
   - Graphical ranking visualization

3. **Save Comparisons:**
   - Let users save comparison results
   - Export to PDF
   - Email comparison report

4. **Multiple Universities:**
   - Compare 3-5 universities at once
   - Side-by-side table view

---

## 📝 Summary

The university comparison feature now provides:
✅ **Program-specific comparisons** for accurate, relevant analysis  
✅ **Webometrics rankings** for authoritative world university data  
✅ **Program-specific metrics** (tuition, acceptance rate, salary)  
✅ **Flexible comparisons** (same uni different programs, different unis same program, etc.)  

This enhancement makes the comparison tool significantly more useful for students making informed decisions about their education!
