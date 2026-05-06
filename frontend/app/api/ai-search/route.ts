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
        prompt = `Provide a comprehensive, real-world detailed profile for the university: "${query || slug}". 
        Location context: ${country}. Program interest: ${course}.
        
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
      } else if (type === 'course') {
        prompt = `Search for courses/majors matching "${query || course}". 
        Return a JSON array of up to 15 specific course names.
        
        Respond ONLY with valid JSON array of strings.`;
      } else {
        prompt = `Return a list of up to 15 real, well-known universities for ${course || 'Higher Education'} in ${country}. 
        User Profile: ${bachelors} degree, GPA ${gpa}, Target: ${target_university}.
        
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
        - courses: array of offered master's programs relevant to ${course || 'various fields'}
        - loan: true (boolean, as education loans are available)
        - slug: url-friendly name
        - website: official university URL
        
        Return ONLY a JSON object with a "universities" key containing the array.`;
      }

      const groqResp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (groqResp.ok) {
        const data = await groqResp.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);

        if (type === 'university_detail') {
          // Derive real URLs from the domain the AI returned
          const domain = (parsed.websiteDomain || parsed.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

          // Official website from domain
          parsed.website = domain ? `https://www.${domain}` : '';

          // Real logo from Clearbit (uses the university domain — works for most .edu/.ac.uk domains)
          parsed.logo = domain ? `https://logo.clearbit.com/${domain}` : '';

          // Country-based curated campus images (Unsplash source API is deprecated)
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

          return NextResponse.json({ university: parsed });
        }
        if (type === 'course') return NextResponse.json({ results: Array.isArray(parsed) ? parsed : (parsed.courses || parsed.results || []) });
        return NextResponse.json({ universities: parsed.universities || parsed.results || [] });
      }
    }

    // Real universities map by country (used by both fallback detail and listing)
    const REAL_UNIVERSITIES: Record<string, any[]> = {
      USA: [
        { name: 'Massachusetts Institute of Technology', loc: 'Cambridge, MA, USA', rank: 1, accept: 4, tuition: 57986, min_gpa: 9.0, min_ielts: 7.0, min_toefl: 100, website: 'https://mit.edu', slug: 'mit' },
        { name: 'Stanford University', loc: 'Stanford, CA, USA', rank: 3, accept: 4, tuition: 58416, min_gpa: 8.5, min_ielts: 7.0, min_toefl: 100, website: 'https://stanford.edu', slug: 'stanford' },
        { name: 'Carnegie Mellon University', loc: 'Pittsburgh, PA, USA', rank: 52, accept: 15, tuition: 58000, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 100, website: 'https://cmu.edu', slug: 'cmu' },
        { name: 'University of California, Berkeley', loc: 'Berkeley, CA, USA', rank: 10, accept: 14, tuition: 44066, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 90, website: 'https://berkeley.edu', slug: 'uc-berkeley' },
        { name: 'University of Michigan', loc: 'Ann Arbor, MI, USA', rank: 23, accept: 20, tuition: 52000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 84, website: 'https://umich.edu', slug: 'michigan' },
        { name: 'Georgia Institute of Technology', loc: 'Atlanta, GA, USA', rank: 88, accept: 21, tuition: 32474, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 90, website: 'https://gatech.edu', slug: 'georgia-tech' },
        { name: 'University of Texas at Austin', loc: 'Austin, TX, USA', rank: 67, accept: 32, tuition: 40000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 79, website: 'https://utexas.edu', slug: 'ut-austin' },
        { name: 'Purdue University', loc: 'West Lafayette, IN, USA', rank: 109, accept: 67, tuition: 29682, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 77, website: 'https://purdue.edu', slug: 'purdue' },
        { name: 'University of Illinois Urbana-Champaign', loc: 'Urbana, IL, USA', rank: 35, accept: 59, tuition: 34000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 79, website: 'https://illinois.edu', slug: 'uiuc' },
        { name: 'Columbia University', loc: 'New York, NY, USA', rank: 22, accept: 4, tuition: 67000, min_gpa: 8.5, min_ielts: 7.0, min_toefl: 100, website: 'https://columbia.edu', slug: 'columbia' },
        { name: 'New York University', loc: 'New York, NY, USA', rank: 39, accept: 13, tuition: 58000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 90, website: 'https://nyu.edu', slug: 'nyu' },
        { name: 'University of Southern California', loc: 'Los Angeles, CA, USA', rank: 101, accept: 12, tuition: 63000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, website: 'https://usc.edu', slug: 'usc' },
      ],
      UK: [
        { name: 'University of Oxford', loc: 'Oxford, United Kingdom', rank: 4, accept: 17, tuition: 30000, min_gpa: 8.5, min_ielts: 7.5, min_toefl: 110, website: 'https://ox.ac.uk', slug: 'oxford' },
        { name: 'University of Cambridge', loc: 'Cambridge, United Kingdom', rank: 2, accept: 21, tuition: 32000, min_gpa: 8.5, min_ielts: 7.5, min_toefl: 110, website: 'https://cam.ac.uk', slug: 'cambridge' },
        { name: 'Imperial College London', loc: 'London, United Kingdom', rank: 6, accept: 14, tuition: 35000, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 100, website: 'https://imperial.ac.uk', slug: 'imperial' },
        { name: 'University College London (UCL)', loc: 'London, United Kingdom', rank: 9, accept: 16, tuition: 31000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 96, website: 'https://ucl.ac.uk', slug: 'ucl' },
        { name: 'London School of Economics', loc: 'London, United Kingdom', rank: 45, accept: 12, tuition: 28000, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 107, website: 'https://lse.ac.uk', slug: 'lse' },
        { name: 'University of Edinburgh', loc: 'Edinburgh, United Kingdom', rank: 27, accept: 15, tuition: 26000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 100, website: 'https://ed.ac.uk', slug: 'edinburgh' },
        { name: "King's College London", loc: 'London, United Kingdom', rank: 40, accept: 22, tuition: 26000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 92, website: 'https://kcl.ac.uk', slug: 'kcl' },
        { name: 'University of Manchester', loc: 'Manchester, United Kingdom', rank: 32, accept: 25, tuition: 24000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 90, website: 'https://manchester.ac.uk', slug: 'manchester' },
        { name: 'University of Warwick', loc: 'Coventry, United Kingdom', rank: 67, accept: 20, tuition: 27000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 88, website: 'https://warwick.ac.uk', slug: 'warwick' },
      ],
      Canada: [
        { name: 'University of Toronto', loc: 'Toronto, Ontario, Canada', rank: 21, accept: 43, tuition: 35000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 89, website: 'https://utoronto.ca', slug: 'u-toronto' },
        { name: 'University of British Columbia', loc: 'Vancouver, BC, Canada', rank: 34, accept: 52, tuition: 32000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, website: 'https://ubc.ca', slug: 'ubc' },
        { name: 'McGill University', loc: 'Montreal, Quebec, Canada', rank: 31, accept: 46, tuition: 28000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 86, website: 'https://mcgill.ca', slug: 'mcgill' },
        { name: 'University of Waterloo', loc: 'Waterloo, Ontario, Canada', rank: 112, accept: 53, tuition: 26000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 88, website: 'https://uwaterloo.ca', slug: 'waterloo' },
        { name: 'Simon Fraser University', loc: 'Burnaby, BC, Canada', rank: 231, accept: 60, tuition: 22000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 80, website: 'https://sfu.ca', slug: 'sfu' },
        { name: 'University of Alberta', loc: 'Edmonton, Alberta, Canada', rank: 110, accept: 60, tuition: 20000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 80, website: 'https://ualberta.ca', slug: 'u-alberta' },
      ],
      Australia: [
        { name: 'University of Melbourne', loc: 'Melbourne, Victoria, Australia', rank: 13, accept: 70, tuition: 42000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 79, website: 'https://unimelb.edu.au', slug: 'u-melbourne' },
        { name: 'University of Sydney', loc: 'Sydney, NSW, Australia', rank: 19, accept: 68, tuition: 40000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 85, website: 'https://sydney.edu.au', slug: 'u-sydney' },
        { name: 'Australian National University', loc: 'Canberra, ACT, Australia', rank: 30, accept: 35, tuition: 38000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 80, website: 'https://anu.edu.au', slug: 'anu' },
        { name: 'University of Queensland', loc: 'Brisbane, Queensland, Australia', rank: 40, accept: 70, tuition: 36000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 79, website: 'https://uq.edu.au', slug: 'uq' },
        { name: 'Monash University', loc: 'Clayton, Victoria, Australia', rank: 42, accept: 75, tuition: 35000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 80, website: 'https://monash.edu', slug: 'monash' },
        { name: 'UNSW Sydney', loc: 'Kensington, NSW, Australia', rank: 19, accept: 58, tuition: 38000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 85, website: 'https://unsw.edu.au', slug: 'unsw' },
      ],
      Germany: [
        { name: 'Technical University of Munich (TUM)', loc: 'Munich, Germany', rank: 37, accept: 8, tuition: 3000, min_gpa: 7.0, min_ielts: 7.0, min_toefl: 95, website: 'https://tum.de', slug: 'tum' },
        { name: 'Ludwig Maximilian University of Munich', loc: 'Munich, Germany', rank: 54, accept: 15, tuition: 2000, min_gpa: 7.0, min_ielts: 7.0, min_toefl: 90, website: 'https://lmu.de', slug: 'lmu' },
        { name: 'Heidelberg University', loc: 'Heidelberg, Germany', rank: 87, accept: 20, tuition: 3000, min_gpa: 7.0, min_ielts: 7.0, min_toefl: 90, website: 'https://uni-heidelberg.de', slug: 'heidelberg' },
        { name: 'RWTH Aachen University', loc: 'Aachen, Germany', rank: 106, accept: 22, tuition: 3000, min_gpa: 6.5, min_ielts: 6.5, min_toefl: 88, website: 'https://rwth-aachen.de', slug: 'rwth-aachen' },
        { name: 'Karlsruhe Institute of Technology', loc: 'Karlsruhe, Germany', rank: 119, accept: 25, tuition: 2500, min_gpa: 7.0, min_ielts: 7.0, min_toefl: 90, website: 'https://kit.edu', slug: 'kit' },
      ],
      Singapore: [
        { name: 'National University of Singapore', loc: 'Singapore', rank: 8, accept: 7, tuition: 26000, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 100, website: 'https://nus.edu.sg', slug: 'nus' },
        { name: 'Nanyang Technological University', loc: 'Singapore', rank: 26, accept: 10, tuition: 24000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, website: 'https://ntu.edu.sg', slug: 'ntu' },
        { name: 'Singapore Management University', loc: 'Singapore', rank: 511, accept: 25, tuition: 28000, min_gpa: 7.0, min_ielts: 7.0, min_toefl: 100, website: 'https://smu.edu.sg', slug: 'smu' },
      ],
      Ireland: [
        { name: 'Trinity College Dublin', loc: 'Dublin, Ireland', rank: 81, accept: 20, tuition: 16000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 88, website: 'https://tcd.ie', slug: 'trinity-dublin' },
        { name: 'University College Dublin', loc: 'Dublin, Ireland', rank: 181, accept: 40, tuition: 15000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 80, website: 'https://ucd.ie', slug: 'ucd' },
        { name: 'University College Cork', loc: 'Cork, Ireland', rank: 303, accept: 50, tuition: 13500, min_gpa: 6.5, min_ielts: 6.0, min_toefl: 79, website: 'https://ucc.ie', slug: 'ucc' },
      ],
      France: [
        { name: 'École Polytechnique', loc: 'Palaiseau, France', rank: 42, accept: 5, tuition: 15000, min_gpa: 8.0, min_ielts: 7.0, min_toefl: 100, website: 'https://polytechnique.edu', slug: 'ecole-polytechnique' },
        { name: 'HEC Paris', loc: 'Jouy-en-Josas, France', rank: 6, accept: 8, tuition: 40000, min_gpa: 8.0, min_ielts: 7.5, min_toefl: 105, website: 'https://hec.edu', slug: 'hec-paris' },
        { name: 'INSEAD', loc: 'Fontainebleau, France', rank: 11, accept: 25, tuition: 85000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 105, website: 'https://insead.edu', slug: 'insead' },
        { name: 'Sciences Po Paris', loc: 'Paris, France', rank: 225, accept: 25, tuition: 14000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 100, website: 'https://sciencespo.fr', slug: 'sciences-po' },
      ],
      UAE: [
        { name: 'Khalifa University', loc: 'Abu Dhabi, UAE', rank: 184, accept: 20, tuition: 18000, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 91, website: 'https://ku.ac.ae', slug: 'khalifa-u' },
        { name: 'University of Sharjah', loc: 'Sharjah, UAE', rank: 501, accept: 55, tuition: 12000, min_gpa: 7.0, min_ielts: 6.0, min_toefl: 80, website: 'https://sharjah.ac.ae', slug: 'u-sharjah' },
        { name: 'American University of Sharjah', loc: 'Sharjah, UAE', rank: 450, accept: 45, tuition: 22000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 88, website: 'https://aus.edu', slug: 'aus' },
      ],
      Spain: [
        { name: 'IE Business School', loc: 'Madrid, Spain', rank: 15, accept: 30, tuition: 35000, min_gpa: 7.5, min_ielts: 7.0, min_toefl: 100, website: 'https://ie.edu', slug: 'ie-business' },
        { name: 'IESE Business School', loc: 'Barcelona, Spain', rank: 8, accept: 20, tuition: 49000, min_gpa: 8.0, min_ielts: 7.5, min_toefl: 110, website: 'https://iese.edu', slug: 'iese' },
        { name: 'Universitat de Barcelona', loc: 'Barcelona, Spain', rank: 153, accept: 40, tuition: 8000, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 88, website: 'https://ub.edu', slug: 'u-barcelona' },
      ],
    };

    // ── Fallback: Real universities per country ──────────────────────────────
    if (type === 'university_detail') {
      // Try to find this university in our known database
      const allKnown = Object.values(REAL_UNIVERSITIES).flat();
      const matchSlug = (slug || '').toLowerCase();
      const matchQuery = (query || '').toLowerCase();
      const knownUni = allKnown.find(u =>
        (u.slug && u.slug === matchSlug) ||
        (u.name && u.name.toLowerCase().includes(matchQuery)) ||
        (matchQuery && u.name && matchQuery.includes(u.name.toLowerCase().split(' ')[0]))
      );

      if (knownUni) {
        const domain = (knownUni.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '');
        const nameForSearch = encodeURIComponent(knownUni.name.replace(/\s+/g, ' ').trim());
        return NextResponse.json({
          university: {
            name: knownUni.name,
            shortName: knownUni.name.split(' ')[0],
            loc: knownUni.loc, country: knownUni.loc?.split(', ').pop() || country, countryCode: (knownUni.loc?.split(', ').pop() || 'US').slice(0, 2).toLowerCase(),
            rank: knownUni.rank, rankBy: 'QS World Rankings', acceptanceRate: knownUni.accept, tuition: knownUni.tuition, currency: 'USD',
            description: `${knownUni.name}: A leading research institution offering advanced studies and world-class research opportunities for international students.`,
            programs: [
              { name: 'Data Science', degree: 'M.S.', duration: '2 Years', tuition: `$${(knownUni.tuition || 30000).toLocaleString()}`, icon: 'monitoring' },
              { name: 'Computer Science', degree: 'M.S.', duration: '2 Years', tuition: `$${(knownUni.tuition || 35000).toLocaleString()}`, icon: 'code' }
            ],
            loan: true, slug: knownUni.slug || slug || 'university',
            website: knownUni.website,
            logo: domain ? `https://logo.clearbit.com/${domain}` : '',
            heroImage: `https://source.unsplash.com/1600x900/?${nameForSearch}+campus+university`,
            campusImages: [
              `https://source.unsplash.com/800x600/?${nameForSearch}+campus`,
              `https://source.unsplash.com/800x600/?${nameForSearch}+university+building`,
              `https://source.unsplash.com/800x600/?${nameForSearch}+library`,
            ],
            pros: ['Global ranking', 'Industry research', 'Strong alumni network', 'Scholarship programs', 'Research opportunities'],
            requirements: { gpa: `${knownUni.min_gpa || 7.5}/10`, ielts: `${knownUni.min_ielts || 6.5}+`, toefl: `${knownUni.min_toefl || 95}+`, gre: 'Required' },
            stats: { totalStudents: '15,000+', internationalStudents: '20%', facultyRatio: '12:1', employmentRate: '92%', researchOutput: 'High', avgSalary: '$85,000' },
            funFacts: [`Founded and located in ${knownUni.loc}`],
            whyStudyHere: ['Excellent research facilities', 'Strong industry connections'],
          }
        });
      }

      // Complete fallback for truly unknown universities
      const fallbackName = query || slug?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'University';
      const nameForSearch = encodeURIComponent(fallbackName.replace(/\s+/g, ' ').trim());
      return NextResponse.json({
        university: {
          name: fallbackName,
          shortName: fallbackName.split(' ')[0],
          loc: country, country: country || 'United States', countryCode: (country || 'US').slice(0, 2).toLowerCase(),
          rank: 105, rankBy: 'QS World Rankings', acceptanceRate: 25, tuition: 30000, currency: 'USD',
          description: `${fallbackName}: A leading research institution offering advanced studies and world-class research opportunities for international students.`,
          programs: [
            { name: 'Data Science', degree: 'M.S.', duration: '2 Years', tuition: '$30,000', icon: 'monitoring' },
            { name: 'Computer Science', degree: 'M.S.', duration: '2 Years', tuition: '$35,000', icon: 'code' }
          ],
          loan: true, slug: slug || 'university',
          website: '',
          logo: '',
          heroImage: `https://source.unsplash.com/1600x900/?${nameForSearch}+campus+university`,
          campusImages: [`https://source.unsplash.com/800x600/?${nameForSearch}+campus`],
          pros: ['Global ranking', 'Industry research', 'Strong alumni network', 'Scholarship programs', 'Research opportunities'],
          requirements: { gpa: '7.5/10', ielts: '6.5+', toefl: '95+', gre: 'Required' },
          stats: { totalStudents: '15,000+', internationalStudents: '20%', facultyRatio: '12:1', employmentRate: '92%', researchOutput: 'High', avgSalary: '$85,000' },
          funFacts: ['Located in the heart of the city'],
          whyStudyHere: ['Excellent research facilities', 'Strong industry connections'],
        }
      });
    }

    const normalizeCountry = (c: string) => {
      const map: Record<string, string> = {
        'united states': 'USA', 'us': 'USA', 'usa': 'USA',
        'united kingdom': 'UK', 'gb': 'UK', 'uk': 'UK',
        'united arab emirates': 'UAE', 'ae': 'UAE',
        'sg': 'Singapore',
      };
      return map[(c || '').toLowerCase()] || c;
    };

    const normalizedCountry = normalizeCountry(country);
    const baseList = REAL_UNIVERSITIES[normalizedCountry] || REAL_UNIVERSITIES['USA'];
    const courseKeywords = (course || '').toLowerCase().split(/\s+/);

    const universities = baseList.map(u => ({
      ...u,
      country: country,
      courses: courseKeywords.filter(Boolean).length > 0
        ? [`M.S. in ${course}`, `Master of ${course}`, `M.Eng. in ${course}`, 'Master of Business Administration', 'Master of Science']
        : ['Master of Science', 'Master of Engineering', 'Master of Business Administration'],
      loan: true,
    }));

    return NextResponse.json({ universities });
  } catch (err: any) {
    console.error('API Search Route Error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
