const fs = require('fs');

async function test() {
  const envPath = 'c:\\Projects\\Sun Glade\\Loan\\frontend\\.env.local';
  let apiKey = '';
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/OPENROUTER_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
  }
  
  if (!apiKey) {
    console.log("No API Key");
    return;
  }

  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const prompt = `Return a list of up to 15 real, well-known universities for Higher Education in USA. 
    User Profile:  degree, GPA 0, Target: .
    
    For each real university include ALL of these exact fields:
    - name: full official name of the university
    - loc: city, country (e.g. "Cambridge, United Kingdom")
    - country: country name
    - rank: global QS ranking (integer)
    - accept: acceptance rate percentage (integer)
    - tuition: annual tuition in USD (integer)
    - min_gpa: minimum GPA required (float, scale 0-10)
    - min_ielts: minimum IELTS score required (float)
    - min_toefl: minimum TOEFL iBT score required (integer)
    - courses: array of offered master's programs relevant to various fields
    - loan: true (boolean, as education loans are available)
    - slug: url-friendly name
    - website: official university URL
    
    Return ONLY a JSON object with a "universities" key containing the array.`;

  try {
    console.log("Fetching list...");
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vidyaloan.com',
        'X-Title': 'VidyaLoan',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log("Raw content:");
      console.log(data.choices[0].message.content);
      const parsed = JSON.parse(data.choices[0].message.content);
      console.log("Universities count:", parsed.universities.length);
      console.log("First uni slug:", parsed.universities[0].slug);
    } else {
      console.log("Error:", await resp.text());
    }
  } catch(e) {
    console.error(e);
  }
}

test();
