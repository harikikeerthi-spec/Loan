# AI Backend API Testing Guide

## Quick Start

### 1. Start the NestJS Backend Server
```bash
cd "c:\Projects\Sun Glade\Loan\server\server"
npm run start:dev
```

You should see output like:
```
[Nest] 12345  - 02/19/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/19/2026, 10:30:00 AM     LOG [InstanceLoader] AiModule dependencies initialized
[Nest] 12345  - 02/19/2026, 10:30:00 AM     LOG [RoutesResolver] AiController {/ai}:
[Nest] 12345  - 02/19/2026, 10:30:00 AM     LOG Nest application successfully started
```

### 2. Verify Server is Running
Open a new terminal and test:
```bash
curl http://localhost:3000/
```

You should get a response (check what your app controller returns).

---

## API Testing

### Test 1: Eligibility Check

**Step 1:** Open Postman or use curl

**Step 2:** Make a POST request
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "credit": 720,
    "income": 55000,
    "loanAmount": 50000,
    "employment": "employed",
    "studyLevel": "masters",
    "hasCoApplicant": true,
    "hasCollateral": false
  }'
```

**Step 3:** Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "eligibilityScore": {
      "score": 78,
      "status": "eligible",
      "ratio": 0.91,
      "rateRange": "4.5% - 5.8%",
      "coverage": "90% - 95%",
      "summary": "Excellent eligibility score"
    },
    "recommendations": [
      "Your profile shows strong loan eligibility",
      "Credit score is excellent",
      "Income-to-loan ratio is favorable"
    ]
  }
}
```

**Troubleshooting:**
- ❌ 400 Bad Request: Check JSON format and required fields
- ❌ 500 Server Error: Check server logs for errors
- ❌ Connection refused: Server not running

---

### Test 2: SOP Analysis

**Step 1:** Make a POST request
```bash
curl -X POST http://localhost:3000/ai/sop-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "text": "My name is John and I am applying for a Masters degree in Computer Science. I want to study because I like coding. After my studies, I will work as a software engineer and earn money to repay my loan. I am very excited about this opportunity and I will work hard."
  }'
```

**Step 2:** Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalScore": 55,
    "qualityLevel": "fair",
    "categories": {
      "clarity": 60,
      "financialJustification": 45,
      "careerROI": 50,
      "originality": 50,
      "postStudyIncome": 65
    },
    "weakAreas": [
      "Financial justification is vague - specify loan amount and funding sources",
      "Career goals lack specificity - define concrete positions and companies",
      "SOP lacks personal voice - add specific experiences and unique perspective",
      "Missing timeline - include graduation year and employment timeline"
    ],
    "actionableSummary": "Your SOP needs improvement in specificity and financial detail. Strengthen by adding concrete career goals, specific companies/positions you target, and detailed financial planning."
  }
}
```

**Troubleshooting:**
- ❌ 400 Bad Request: Ensure "text" field is present
- ❌ Empty text: SOP analysis might return poor score

---

## Frontend Integration Testing

### Test 3: Eligibility Form

**Step 1:** Open browser to `http://localhost:3000/loan-eligibility.html`

**Step 2:** Fill out the form:
- Age: 26
- Credit Score: 700
- Annual Income: 60000
- Loan Amount: 50000
- Employment: Employed
- Study Level: Masters
- Co-applicant: Yes
- Collateral: No

**Step 3:** Click "Check eligibility"

**Expected:**
- ✅ Score displays (e.g., "78 / 100")
- ✅ Status badge shows (e.g., "ELIGIBLE" in green)
- ✅ Recommendations list appears
- ✅ Recommended loans display

**Debugging (open browser console Ctrl+Shift+I):**
```javascript
// Check if API client is loaded
console.log(AI_API);

// Manually test API
AI_API.checkEligibility({
  age: 25,
  credit: 700,
  income: 50000,
  loanAmount: 50000,
  employment: 'employed',
  studyLevel: 'masters',
  hasCoApplicant: true,
  hasCollateral: false
});
```

---

### Test 4: SOP Form

**Step 1:** Open browser to `http://localhost:3000/sop.html`

**Step 2:** Enter Sample SOP:
```
I am applying for a Master's degree in Computer Science from Stanford University. 
My career goal is to become a software architect at a leading technology company. 
I have 5 years of experience as a backend engineer at Tech Corp, where I designed 
microservices handling 1 million requests daily.

After graduation, I plan to return to India and establish my own software consultancy, 
generating revenue to comfortably repay this education loan. Based on market research, 
senior architects earn $200,000+ annually, providing strong repayment capability.

This program is ideal because it offers specialization in distributed systems and 
cloud architecture, which directly aligns with my career vision.
```

**Step 3:** Click "Analyze SOP"

**Expected:**
- ✅ Score displays (e.g., "82 / 100")
- ✅ Quality level shows (e.g., "GOOD" or "EXCELLENT")
- ✅ Category breakdown shows 5 bars with percentages
- ✅ Weak areas list (if any)
- ✅ Actionable summary appears

**Debugging:**
```javascript
// In browser console
AI_API.analyzeSOP("Your SOP text here...")
```

---

## Common Test Cases

### Edge Cases to Test

**Test 5: Low Credit Score**
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "credit": 450,
    "income": 30000,
    "loanAmount": 100000,
    "employment": "unemployed",
    "studyLevel": "undergrad",
    "hasCoApplicant": false,
    "hasCollateral": false
  }'
```

Expected: Low score (~20-30), "unlikely" status

**Test 6: Excellent Profile**
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{
    "age": 24,
    "credit": 800,
    "income": 100000,
    "loanAmount": 30000,
    "employment": "employed",
    "studyLevel": "masters",
    "hasCoApplicant": true,
    "hasCollateral": true
  }'
```

Expected: High score (~90+), "eligible" status

**Test 7: Empty SOP**
```bash
curl -X POST http://localhost:3000/ai/sop-analysis \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'
```

Expected: Very low score, multiple weak areas flagged

**Test 8: Generic SOP**
```bash
curl -X POST http://localhost:3000/ai/sop-analysis \
  -H "Content-Type: application/json" \
  -d '{"text": "I am a good student and I want to study abroad to get a good education."}'
```

Expected: Fair score (40-50), weak in specificity and originality

---

## Performance Testing

### Test Response Times
```bash
# Test eligibility response time
time curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{"age":25,"credit":700,"income":50000,"loanAmount":40000,"employment":"employed","studyLevel":"masters","hasCoApplicant":true,"hasCollateral":false}'

# Test SOP response time  
time curl -X POST http://localhost:3000/ai/sop-analysis \
  -H "Content-Type: application/json" \
  -d '{"text":"Long text here..."}'
```

Expected: Both under 500ms

---

## Error Handling Tests

### Test 9: Invalid Input

**Missing required field:**
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{"age": 25}'
```

**Invalid field type:**
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{"age": "twenty-five", "credit": 700, "income": 50000, "loanAmount": 40000, "employment": "employed", "studyLevel": "masters", "hasCoApplicant": true, "hasCollateral": false}'
```

**Out-of-range values:**
```bash
curl -X POST http://localhost:3000/ai/eligibility-check \
  -H "Content-Type: application/json" \
  -d '{"age": 200, "credit": 2000, "income": 50000, "loanAmount": 40000, "employment": "employed", "studyLevel": "masters", "hasCoApplicant": true, "hasCollateral": false}'
```

Expected: 400 Bad Request with error message

---

## Network & CORS Testing

### Test 10: CORS Headers

```bash
curl -i -X OPTIONS http://localhost:3000/ai/eligibility-check \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST"
```

Should return CORS headers in response

---

## Monitoring

### Check Server Logs
Watch server terminal for:
- Request logs: `POST /ai/eligibility-check`
- Response times
- Any errors or warnings

### Check Browser Console
Watch browser console for:
- Network requests (Network tab)
- Any JavaScript errors (Console tab)
- API response data (Console)

---

## Completion Checklist

- [ ] Backend compiles without errors
- [ ] Server starts successfully
- [ ] Eligibility API endpoint works
- [ ] SOP API endpoint works
- [ ] Eligibility form submits and displays results
- [ ] SOP form submits and displays results
- [ ] Error handling works (invalid input)
- [ ] Response times acceptable (<1 second)
- [ ] CORS configured if needed
- [ ] Both test pages show "Awaiting input" initially

---

## Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Monitor API usage and performance
   - Gather user feedback on new endpoints

2. **If tests fail:**
   - Check server logs for error details
   - Verify backend module integration
   - Test individual services in isolation

3. **Future enhancements:**
   - Add authentication/authorization
   - Implement rate limiting
   - Store analysis results in database
   - Add caching layer
   - Create admin dashboard for analytics
