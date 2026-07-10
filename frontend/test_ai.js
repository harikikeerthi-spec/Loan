const fs = require('fs');

async function test() {
  const envPath = 'c:\\Projects\\Sun Glade\\Loan\\frontend\\.env.local';
  let apiKey = '';
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GROQ_API_KEY=(.*)/);
    if (match) apiKey = match[1];
  }
  
  if (!apiKey) {
    console.log("No API Key");
    return;
  }

  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const prompt = `Provide a comprehensive, real-world detailed profile for the university: "mit". 
    Location context: Any. Program interest: .
    
    CRITICAL: For the "websiteDomain" field, provide ONLY the real official domain of this university (e.g. "ed.ac.uk" for University of Edinburgh, "mit.edu" for MIT, "ox.ac.uk" for Oxford). Do NOT invent domains. This must be the actual domain students visit.

    Return a single JSON object with EXACTLY these fields:
    {
      "name": "Full Official Name of the University",
      "shortName": "Common Short Name",
      "loc": "City, State/Province",
      "country": "Country",
      "countryCode": "2-letter ISO country code",
      "websiteDomain": "the real official domain WITHOUT https:// (e.g. ed.ac.uk, mit.edu, stanford.edu, ox.ac.uk, tum.de)",
      "founded": 1900,
      "rank": 123,
      "rankBy": "QS World Rankings",
      "acceptanceRate": 15,
      "tuition": 35000,
      "currency": "USD",
      "description": "Rich 2-3 paragraph history and academic standing. Be detailed and accurate.",
      "programs": [
        { "name": "M.S. in Computer Science", "degree": "Master's", "duration": "2 Years", "tuition": "$35,000/year", "icon": "code" },
        { "name": "MBA", "degree": "Master's", "duration": "18 Months", "tuition": "$45,000/year", "icon": "payments" }
      ],
      "requirements": { "gpa": "3.5/4.0 or 8.0/10", "ielts": "7.0 (no band < 6.5)", "toefl": "100+", "gre": "Optional but 320+ recommended" },
      "stats": { "totalStudents": "25,000+", "internationalStudents": "22%", "facultyRatio": "14:1", "employmentRate": "94%", "researchOutput": "Very High", "avgSalary": "$110k" },
      "loan": true,
      "pros": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
      "facilities": [{ "name": "Robotics Lab", "icon": "smart_toy" }, { "name": "Olympic Pool", "icon": "pool" }],
      "funFacts": ["Fact 1", "Fact 2", "Fact 3"],
      "whyStudyHere": ["Reason 1", "Reason 2", "Reason 3"],
      "notableAlumni": [{ "name": "Full Name", "role": "Role description" }]
    }
    
    Respond ONLY with valid JSON. Data must be accurate and real.`;

  try {
    console.log("Fetching...");
    const groqResp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (groqResp.ok) {
      const data = await groqResp.json();
      console.log("Raw content:");
      console.log(data.choices[0].message.content);
      const parsed = JSON.parse(data.choices[0].message.content);
      console.log("Parsed keys:", Object.keys(parsed));
    } else {
      console.log("Error:", await groqResp.text());
    }
  } catch(e) {
    console.error(e);
  }
}

test();
