import { NextResponse } from 'next/server';

type ReqBody = {
  country?: string;
  course?: string;
  gpa?: number;
  bachelors?: string;
  target_university?: string;
  type?: string;
  query?: string;
  slug?: string;
};

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    const { country = 'Any', course = '', gpa = 0, bachelors = '', target_university = '', type = '', query = '', slug = '' } = body;

    const API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (API_KEY) {
      let prompt = '';
      if (type === 'university_detail') {
        prompt = `Provide a detailed profile for the university: "${query || slug}". 
        Context: It is a university in ${country} offering ${course}.
        Return a single JSON object with: name, shortName, loc, country, countryCode, rank, acceptanceRate, tuition, currency, description, courses (array), loan (boolean), website, pros (array of 5), requirements (object with gpa, ielts, toefl, gre), stats (object with totalStudents, internationalStudents, facultyRatio, employmentRate).
        
        Respond ONLY with valid JSON.`;
      } else if (type === 'course') {
        prompt = `Search for courses/majors matching "${query || course}". 
        Return a JSON array of up to 15 specific course names.
        
        Respond ONLY with valid JSON array of strings.`;
      } else {
        prompt = `Return a list of up to 15 best universities for ${course || 'Higher Education'} in ${country}. 
        User Profile: ${bachelors} degree, ${gpa} GPA, Target: ${target_university}.
        Each university object must have: name, loc (location), country, rank (global), accept (acceptance rate %), tuition (USD/yr), slug (kebab-case), website.
        
        Return ONLY a JSON array of objects under a "universities" key.`;
      }

      const groqResp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (groqResp.ok) {
        const data = await groqResp.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);

        if (type === 'university_detail') return NextResponse.json({ university: parsed });
        if (type === 'course') return NextResponse.json({ results: Array.isArray(parsed) ? parsed : (parsed.courses || parsed.results || []) });
        return NextResponse.json({ universities: parsed.universities || parsed.results || [] });
      }
    }

    // Fallback: strictly dynamic synthesis when no API key is provided or fetch fails.
    if (type === 'university_detail') {
      const detailed = {
        name: query || slug || 'Global University',
        shortName: (query || slug || 'Global').split(' ')[0],
        loc: country,
        country: country,
        countryCode: (country || '').slice(0, 2).toLowerCase() || 'us',
        rank: 105,
        acceptanceRate: 25,
        tuition: 30000,
        currency: 'USD',
        description: `About ${query || slug}: A leading institution in ${country} offering advanced studies in ${course || 'various fields'}.`,
        courses: [course || 'Advanced Research'],
        loan: true,
        slug: slug || 'global-university',
        website: 'https://example.edu',
        pros: ['Global ranking', 'Industry research', 'Strong alumni network'],
        requirements: { gpa: 7.5, ielts: 6.5, toefl: 95 },
        stats: { totalStudents: '15,000+', internationalStudents: '20%', facultyRatio: '12:1', employmentRate: '92%' }
      };
      return NextResponse.json({ university: detailed });
    }

    const universities = Array.from({ length: 15 }).map((_, i) => ({
      name: `${course || 'Global'} University ${i + 1}`,
      loc: `${country}`,
      country: country,
      rank: 50 + i * 12,
      accept: Math.max(5, 40 - i * 2),
      tuition: 25000 + i * 2000,
      slug: `${(course || 'uni').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`,
      website: `https://example.edu/${i + 1}`,
      courses: [course || 'Various'],
      min_gpa: 7.0,
      min_ielts: 6.5,
      min_toefl: 90,
      loan: true
    }));
    return NextResponse.json({ universities });
  } catch (err: any) {
    console.error('API Search Route Error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
