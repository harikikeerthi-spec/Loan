import { universities as localUniversitiesMap } from './universityData';

export type ReqBody = {
  country?: string;
  course?: string;
  gpa?: number;
  bachelors?: string;
  target_university?: string;
  type?: string;
  query?: string;
  slug?: string;
};

const FALLBACK_UNIVERSITIES_BY_COUNTRY: Record<string, Array<{ name: string; loc: string; country: string; rank?: number }>> = {
  'usa': [
    { name: 'Massachusetts Institute of Technology (MIT)', loc: 'Cambridge, MA', country: 'USA', rank: 1 },
    { name: 'Harvard University', loc: 'Cambridge, MA', country: 'USA', rank: 4 },
    { name: 'Stanford University', loc: 'Stanford, CA', country: 'USA', rank: 5 },
    { name: 'California Institute of Technology (Caltech)', loc: 'Pasadena, CA', country: 'USA', rank: 6 },
    { name: 'University of California, Berkeley (UCB)', loc: 'Berkeley, CA', country: 'USA', rank: 10 },
    { name: 'University of Chicago', loc: 'Chicago, IL', country: 'USA', rank: 11 },
    { name: 'University of Pennsylvania (Penn)', loc: 'Philadelphia, PA', country: 'USA', rank: 12 },
    { name: 'Cornell University', loc: 'Ithaca, NY', country: 'USA', rank: 13 },
    { name: 'Yale University', loc: 'New Haven, CT', country: 'USA', rank: 16 },
    { name: 'Columbia University', loc: 'New York, NY', country: 'USA', rank: 23 },
    { name: 'Johns Hopkins University', loc: 'Baltimore, MD', country: 'USA', rank: 28 },
    { name: 'University of California, Los Angeles (UCLA)', loc: 'Los Angeles, CA', country: 'USA', rank: 29 },
    { name: 'University of Michigan-Ann Arbor', loc: 'Ann Arbor, MI', country: 'USA', rank: 33 },
    { name: 'New York University (NYU)', loc: 'New York, NY', country: 'USA', rank: 38 },
    { name: 'Northwestern University', loc: 'Evanston, IL', country: 'USA', rank: 47 },
    { name: 'Carnegie Mellon University (CMU)', loc: 'Pittsburgh, PA', country: 'USA', rank: 52 },
    { name: 'University of Texas at Austin', loc: 'Austin, TX', country: 'USA', rank: 58 },
    { name: 'Georgia Institute of Technology (Georgia Tech)', loc: 'Atlanta, GA', country: 'USA', rank: 97 },
    { name: 'University of Illinois Urbana-Champaign (UIUC)', loc: 'Urbana, IL', country: 'USA', rank: 64 },
    { name: 'Purdue University', loc: 'West Lafayette, IN', country: 'USA', rank: 99 },
    { name: 'University of Washington', loc: 'Seattle, WA', country: 'USA', rank: 63 },
    { name: 'University of Southern California (USC)', loc: 'Los Angeles, CA', country: 'USA', rank: 116 },
    { name: 'Northeastern University', loc: 'Boston, MA', country: 'USA', rank: 200 },
    { name: 'Arizona State University (ASU)', loc: 'Tempe, AZ', country: 'USA', rank: 179 },
  ],
  'united states': [
    { name: 'Massachusetts Institute of Technology (MIT)', loc: 'Cambridge, MA', country: 'USA', rank: 1 },
    { name: 'Harvard University', loc: 'Cambridge, MA', country: 'USA', rank: 4 },
    { name: 'Stanford University', loc: 'Stanford, CA', country: 'USA', rank: 5 },
    { name: 'California Institute of Technology (Caltech)', loc: 'Pasadena, CA', country: 'USA', rank: 6 },
    { name: 'University of California, Berkeley (UCB)', loc: 'Berkeley, CA', country: 'USA', rank: 10 },
    { name: 'University of Chicago', loc: 'Chicago, IL', country: 'USA', rank: 11 },
    { name: 'University of Pennsylvania (Penn)', loc: 'Philadelphia, PA', country: 'USA', rank: 12 },
    { name: 'Cornell University', loc: 'Ithaca, NY', country: 'USA', rank: 13 },
    { name: 'Columbia University', loc: 'New York, NY', country: 'USA', rank: 23 },
    { name: 'New York University (NYU)', loc: 'New York, NY', country: 'USA', rank: 38 },
  ],
  'uk': [
    { name: 'University of Cambridge', loc: 'Cambridge', country: 'UK', rank: 2 },
    { name: 'University of Oxford', loc: 'Oxford', country: 'UK', rank: 3 },
    { name: 'Imperial College London', loc: 'London', country: 'UK', rank: 6 },
    { name: 'University College London (UCL)', loc: 'London', country: 'UK', rank: 9 },
    { name: 'University of Edinburgh', loc: 'Edinburgh', country: 'UK', rank: 22 },
    { name: 'The University of Manchester', loc: 'Manchester', country: 'UK', rank: 32 },
    { name: 'King\'s College London (KCL)', loc: 'London', country: 'UK', rank: 40 },
    { name: 'London School of Economics (LSE)', loc: 'London', country: 'UK', rank: 45 },
    { name: 'University of Bristol', loc: 'Bristol', country: 'UK', rank: 55 },
    { name: 'The University of Warwick', loc: 'Coventry', country: 'UK', rank: 67 },
    { name: 'University of Glasgow', loc: 'Glasgow', country: 'UK', rank: 76 },
    { name: 'University of Birmingham', loc: 'Birmingham', country: 'UK', rank: 84 },
    { name: 'University of Southampton', loc: 'Southampton', country: 'UK', rank: 81 },
    { name: 'University of Leeds', loc: 'Leeds', country: 'UK', rank: 75 },
    { name: 'University of Sheffield', loc: 'Sheffield', country: 'UK', rank: 104 },
    { name: 'University of Nottingham', loc: 'Nottingham', country: 'UK', rank: 100 },
  ],
  'united kingdom': [
    { name: 'University of Cambridge', loc: 'Cambridge', country: 'UK', rank: 2 },
    { name: 'University of Oxford', loc: 'Oxford', country: 'UK', rank: 3 },
    { name: 'Imperial College London', loc: 'London', country: 'UK', rank: 6 },
    { name: 'University College London (UCL)', loc: 'London', country: 'UK', rank: 9 },
    { name: 'University of Edinburgh', loc: 'Edinburgh', country: 'UK', rank: 22 },
  ],
  'canada': [
    { name: 'University of Toronto', loc: 'Toronto, Ontario', country: 'Canada', rank: 21 },
    { name: 'McGill University', loc: 'Montreal, Quebec', country: 'Canada', rank: 30 },
    { name: 'University of British Columbia (UBC)', loc: 'Vancouver, BC', country: 'Canada', rank: 34 },
    { name: 'University of Alberta', loc: 'Edmonton, Alberta', country: 'Canada', rank: 111 },
    { name: 'University of Waterloo', loc: 'Waterloo, Ontario', country: 'Canada', rank: 112 },
    { name: 'Western University', loc: 'London, Ontario', country: 'Canada', rank: 114 },
    { name: 'Université de Montréal', loc: 'Montreal, Quebec', country: 'Canada', rank: 141 },
    { name: 'McMaster University', loc: 'Hamilton, Ontario', country: 'Canada', rank: 189 },
    { name: 'University of Calgary', loc: 'Calgary, Alberta', country: 'Canada', rank: 182 },
    { name: 'Queen\'s University at Kingston', loc: 'Kingston, Ontario', country: 'Canada', rank: 209 },
  ],
  'australia': [
    { name: 'The University of Melbourne', loc: 'Melbourne, Victoria', country: 'Australia', rank: 14 },
    { name: 'The University of New South Wales (UNSW)', loc: 'Sydney, NSW', country: 'Australia', rank: 19 },
    { name: 'The University of Sydney', loc: 'Sydney, NSW', country: 'Australia', rank: 19 },
    { name: 'Australian National University (ANU)', loc: 'Canberra', country: 'Australia', rank: 34 },
    { name: 'Monash University', loc: 'Melbourne, Victoria', country: 'Australia', rank: 42 },
    { name: 'The University of Queensland (UQ)', loc: 'Brisbane, Queensland', country: 'Australia', rank: 43 },
    { name: 'The University of Western Australia (UWA)', loc: 'Perth, WA', country: 'Australia', rank: 72 },
    { name: 'The University of Adelaide', loc: 'Adelaide, SA', country: 'Australia', rank: 89 },
    { name: 'UTS (University of Technology Sydney)', loc: 'Sydney, NSW', country: 'Australia', rank: 90 },
    { name: 'RMIT University', loc: 'Melbourne, Victoria', country: 'Australia', rank: 140 },
  ],
  'germany': [
    { name: 'Technical University of Munich (TUM)', loc: 'Munich', country: 'Germany', rank: 37 },
    { name: 'Ludwig-Maximilians-Universität München (LMU)', loc: 'Munich', country: 'Germany', rank: 54 },
    { name: 'Heidelberg University', loc: 'Heidelberg', country: 'Germany', rank: 87 },
    { name: 'Freie Universität Berlin', loc: 'Berlin', country: 'Germany', rank: 98 },
    { name: 'RWTH Aachen University', loc: 'Aachen', country: 'Germany', rank: 106 },
    { name: 'Humboldt-Universität zu Berlin', loc: 'Berlin', country: 'Germany', rank: 120 },
    { name: 'KIT, Karlsruher Institut für Technologie', loc: 'Karlsruhe', country: 'Germany', rank: 119 },
    { name: 'Technical University of Berlin (TU Berlin)', loc: 'Berlin', country: 'Germany', rank: 154 },
  ],
  'ireland': [
    { name: 'Trinity College Dublin (TCD)', loc: 'Dublin', country: 'Ireland', rank: 81 },
    { name: 'University College Dublin (UCD)', loc: 'Dublin', country: 'Ireland', rank: 171 },
    { name: 'University of Galway', loc: 'Galway', country: 'Ireland', rank: 289 },
    { name: 'University College Cork (UCC)', loc: 'Cork', country: 'Ireland', rank: 292 },
    { name: 'Dublin City University (DCU)', loc: 'Dublin', country: 'Ireland', rank: 436 },
    { name: 'University of Limerick (UL)', loc: 'Limerick', country: 'Ireland', rank: 421 },
  ],
  'new zealand': [
    { name: 'The University of Auckland', loc: 'Auckland', country: 'New Zealand', rank: 68 },
    { name: 'University of Otago', loc: 'Dunedin', country: 'New Zealand', rank: 206 },
    { name: 'Victoria University of Wellington', loc: 'Wellington', country: 'New Zealand', rank: 241 },
    { name: 'University of Canterbury', loc: 'Christchurch', country: 'New Zealand', rank: 256 },
    { name: 'Massey University', loc: 'Palmerston North', country: 'New Zealand', rank: 239 },
  ],
  'france': [
    { name: 'Université PSL', loc: 'Paris', country: 'France', rank: 24 },
    { name: 'Institut Polytechnique de Paris', loc: 'Palaiseau', country: 'France', rank: 38 },
    { name: 'Sorbonne University', loc: 'Paris', country: 'France', rank: 59 },
    { name: 'Université Paris-Saclay', loc: 'Gif-sur-Yvette', country: 'France', rank: 71 },
    { name: 'HEC Paris', loc: 'Jouy-en-Josas', country: 'France', rank: 10 },
  ],
  'singapore': [
    { name: 'National University of Singapore (NUS)', loc: 'Singapore', country: 'Singapore', rank: 8 },
    { name: 'Nanyang Technological University (NTU)', loc: 'Singapore', country: 'Singapore', rank: 26 },
    { name: 'Singapore Management University (SMU)', loc: 'Singapore', country: 'Singapore', rank: 540 },
  ],
};

export function getFallbackUniversities(country?: string, query?: string): Array<{ name: string; loc: string; country: string; rank?: number }> {
  const cleanCountry = (country || '').trim().toLowerCase();
  const cleanQuery = (query || '').trim().toLowerCase();

  let pool: Array<{ name: string; loc: string; country: string; rank?: number }> = [];

  // 1. Gather matching country entries from FALLBACK_UNIVERSITIES_BY_COUNTRY
  if (cleanCountry && FALLBACK_UNIVERSITIES_BY_COUNTRY[cleanCountry]) {
    pool = [...FALLBACK_UNIVERSITIES_BY_COUNTRY[cleanCountry]];
  } else if (cleanCountry) {
    // Check partial country key match
    for (const key of Object.keys(FALLBACK_UNIVERSITIES_BY_COUNTRY)) {
      if (key.includes(cleanCountry) || cleanCountry.includes(key)) {
        pool.push(...FALLBACK_UNIVERSITIES_BY_COUNTRY[key]);
      }
    }
  }

  // 2. Also check localUniversitiesMap from universityData.ts
  if (localUniversitiesMap) {
    for (const uni of Object.values(localUniversitiesMap)) {
      if (!uni || !uni.name) continue;
      const uniCountry = (uni.country || '').toLowerCase();
      if (!cleanCountry || uniCountry.includes(cleanCountry) || cleanCountry.includes(uniCountry)) {
        if (!pool.some(p => p.name.toLowerCase() === uni.name.toLowerCase())) {
          pool.push({
            name: uni.name,
            loc: uni.location || uni.country || '',
            country: uni.country || country || '',
            rank: uni.rank
          });
        }
      }
    }
  }

  // 3. If pool is still empty, include all top general fallback universities
  if (pool.length === 0) {
    for (const key of Object.keys(FALLBACK_UNIVERSITIES_BY_COUNTRY)) {
      pool.push(...FALLBACK_UNIVERSITIES_BY_COUNTRY[key]);
    }
  }

  // 4. Filter by query search text if typed
  if (cleanQuery) {
    pool = pool.filter(u =>
      u.name.toLowerCase().includes(cleanQuery) ||
      u.loc.toLowerCase().includes(cleanQuery) ||
      u.country.toLowerCase().includes(cleanQuery)
    );
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniquePool: Array<{ name: string; loc: string; country: string; rank?: number }> = [];

  for (const u of pool) {
    const k = u.name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniquePool.push(u);
    }
  }

  return uniquePool.slice(0, 30);
}

const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-20b'
];

async function callGroqWithFallback(prompt: string, systemPrompt?: string) {
  const API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  if (!API_KEY) return null;

  const messages: any[] = [];
  messages.push({
    role: 'system',
    content: systemPrompt || 'You are a higher education database assistant. Output ONLY valid, strict JSON object. No markdown, no prose outside JSON.'
  });
  messages.push({ role: 'user', content: prompt });

  for (const model of GROQ_MODELS) {
    // 1st attempt: standard json_object response format
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      } else {
        const errText = await res.text();
        console.warn(`Groq model ${model} failed, trying next:`, errText);
      }
    } catch (e) {
      console.warn(`Groq model ${model} 1st attempt exception:`, e);
    }

    // 2nd attempt: plain text output with sanitization
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const sanitized = content
          .replace(/"([a-zA-Z0-9_]+)=\[/g, '"$1": [')
          .replace(/"([a-zA-Z0-9_]+)=\{/g, '"$1": {')
          .replace(/"([a-zA-Z0-9_]+)="([^"]*)"/g, '"$1": "$2"');

        const match = sanitized.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match) {
          return JSON.parse(match[0]);
        }
      }
    } catch (e) {
      console.warn(`Groq model ${model} 2nd attempt exception:`, e);
    }
  }

  return null;
}

export async function fetchUniversityData(body: ReqBody) {
  const { country = 'Any', course = '', gpa = 0, bachelors = '', target_university = '', type = '', query = '', slug = '' } = body;

  let prompt = '';
  let systemPrompt = 'You are a higher education database assistant. Output ONLY valid, strict, clean JSON object.';

  if (type === 'university_detail') {
    prompt = `Provide a comprehensive, real-world detailed profile for the university: "${query || slug}". 
    Location context: ${country}. Program interest: ${course}.
    
    CRITICAL: For the "websiteDomain" field, provide ONLY the real official domain of this university (e.g. "ed.ac.uk" for University of Edinburgh, "mit.edu" for MIT, "ox.ac.uk" for Oxford). Do NOT invent domains.

    Return a single JSON object with EXACTLY these key-value pairs (use double quotes for all keys and strings, and standard colons between key and value):
    {
      "name": "Full Official Name of the University",
      "shortName": "Common Short Name",
      "loc": "City, State/Province",
      "country": "Country",
      "countryCode": "2-letter ISO country code",
      "websiteDomain": "ed.ac.uk",
      "founded": 1900,
      "rank": 123,
      "rankBy": "QS World Rankings",
      "acceptanceRate": 15,
      "tuition": 35000,
      "currency": "USD",
      "description": "Rich history and academic standing.",
      "programs": [
        { "name": "M.S. in Computer Science", "degree": "Master's", "duration": "2 Years", "tuition": "$35,000/year", "icon": "code" }
      ],
      "requirements": { "gpa": "3.5/4.0 or 8.0/10", "ielts": "7.0", "toefl": "100+", "gre": "Optional" },
      "stats": { "totalStudents": "25,000+", "internationalStudents": "22%", "facultyRatio": "14:1", "employmentRate": "94%", "researchOutput": "Very High", "avgSalary": "$110k" },
      "loan": true,
      "pros": ["Top faculty", "Great campus"],
      "facilities": [{ "name": "Robotics Lab", "icon": "smart_toy" }],
      "funFacts": ["Fact 1", "Fact 2"],
      "whyStudyHere": ["Reason 1", "Reason 2"],
      "notableAlumni": [{ "name": "Full Name", "role": "Role description" }]
    }`;
  } else if (type === 'course') {
    systemPrompt = 'You are a course database assistant. Output ONLY a valid JSON object with a "courses" array.';
    prompt = `Search for courses/majors matching "${query || course}". 
    Return a JSON object: { "courses": ["Course 1", "Course 2"] }`;
  } else {
    if (query && query.trim().length > 0) {
      prompt = `Return a JSON object { "universities": [...] } with up to 30 real, accredited universities matching "${query}" located in ${country && country !== 'Any' ? country : 'the world'}.
      For each university, return:
      - name: Full official name of the university (do not abbreviate)
      - loc: City, State/Province
      - country: Country Name
      - rank: approximate global QS ranking (integer)
      - accept: acceptance rate percentage (integer)
      - tuition: approximate annual tuition in USD (integer)
      - loan: true
      - slug: url-friendly slug
      - website: official website domain`;
    } else {
      prompt = `Return a JSON object { "universities": [...] } with 30 real, accredited universities located in ${country}.
      Include a comprehensive list of top-tier, mid-tier, and popular accredited public and private universities in ${country}.
      For each university, return:
      - name: Full official name of the university (do not abbreviate)
      - loc: City, State/Province
      - country: "${country}"
      - rank: approximate global QS ranking (integer)
      - accept: acceptance rate percentage (integer)
      - tuition: approximate annual tuition in USD (integer)
      - loan: true
      - slug: url-friendly slug
      - website: official website domain`;
    }
  }

  const parsed = await callGroqWithFallback(prompt, systemPrompt);

  if (parsed) {
    if (type === 'university_detail') {
      const domain = (parsed.websiteDomain || parsed.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

      parsed.website = domain ? `https://www.${domain}` : (parsed.website || '');
      parsed.logo = domain ? `https://logo.clearbit.com/${domain}` : (parsed.logo || '');

      const countryKey = (parsed.country || country || '').toLowerCase();
      const HERO_IMAGES: Record<string, string> = {
        'united kingdom': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
        'uk': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
        'usa': 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80',
        'united states': 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80',
        'canada': 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=1600&q=80',
        'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80',
        'germany': 'https://images.unsplash.com/photo-1597672890275-702a4953ff1f?w=1600&q=80',
        'ireland': 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=1600&q=80',
        'france': 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=1600&q=80',
        'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80',
      };
      const CAMPUS_IMAGES: Record<string, string[]> = {
        'united kingdom': [
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
          'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&q=80',
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        ],
        'uk': [
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
          'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&q=80',
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        ],
        'usa': [
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
          'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        ],
        'united states': [
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
          'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        ],
      };
      const defaultHero = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80';
      const defaultCampus = [
        'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      ];

      parsed.heroImage = parsed.heroImage || HERO_IMAGES[countryKey] || defaultHero;
      parsed.campusImages = (parsed.campusImages && parsed.campusImages.length > 0)
        ? parsed.campusImages
        : (CAMPUS_IMAGES[countryKey] || defaultCampus);

      // Ensure pros is an array
      if (typeof parsed.pros === 'string') {
        parsed.pros = [parsed.pros];
      }

      return { university: parsed };
    }
    if (type === 'course') return { results: Array.isArray(parsed) ? parsed : (parsed.courses || parsed.results || []) };

    const aiUnis = parsed.universities || parsed.results || [];
    if (Array.isArray(aiUnis) && aiUnis.length > 0) {
      return { universities: aiUnis };
    }
  }

  // Fail-Safe Fallback: When AI fails or GROQ_API_KEY is not set on AWS server, return dataset
  if (type === 'university_detail') {
    const slugKey = (slug || query || '').toLowerCase();
    const found = localUniversitiesMap[slugKey] || Object.values(localUniversitiesMap).find(u => u.name.toLowerCase().includes(slugKey));
    return { university: found || null };
  }
  if (type === 'course') return { results: ['B.Tech/B.E.', 'MS/M.Tech', 'MBA/PGDM', 'MBBS/Medicine', 'Data Science', 'Computer Science', 'Business Analytics'] };

  const fallbackUnis = getFallbackUniversities(country, query);
  return { universities: fallbackUnis };
}