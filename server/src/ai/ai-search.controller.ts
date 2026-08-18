import { Controller, Post, Body } from '@nestjs/common';
import { OpenRouterService } from './services/openrouter.service';

const FALLBACK_UNIVERSITIES_BY_COUNTRY: Record<string, Array<{ name: string; loc: string; country: string; rank?: number; accept?: number; tuition?: number; loan?: boolean; slug?: string; website?: string }>> = {
  'usa': [
    { name: 'Massachusetts Institute of Technology (MIT)', loc: 'Cambridge, MA', country: 'USA', rank: 1, accept: 4, tuition: 55000, loan: true, slug: 'mit', website: 'https://www.mit.edu' },
    { name: 'Harvard University', loc: 'Cambridge, MA', country: 'USA', rank: 4, accept: 3, tuition: 57000, loan: true, slug: 'harvard', website: 'https://www.harvard.edu' },
    { name: 'Stanford University', loc: 'Stanford, CA', country: 'USA', rank: 5, accept: 4, tuition: 56000, loan: true, slug: 'stanford', website: 'https://www.stanford.edu' },
    { name: 'California Institute of Technology (Caltech)', loc: 'Pasadena, CA', country: 'USA', rank: 6, accept: 3, tuition: 58000, loan: true, slug: 'caltech', website: 'https://www.caltech.edu' },
    { name: 'University of California, Berkeley (UCB)', loc: 'Berkeley, CA', country: 'USA', rank: 10, accept: 11, tuition: 44000, loan: true, slug: 'uc-berkeley', website: 'https://www.berkeley.edu' },
    { name: 'University of Pennsylvania (Penn)', loc: 'Philadelphia, PA', country: 'USA', rank: 12, accept: 6, tuition: 60000, loan: true, slug: 'upenn', website: 'https://www.upenn.edu' },
    { name: 'Cornell University', loc: 'Ithaca, NY', country: 'USA', rank: 13, accept: 7, tuition: 62000, loan: true, slug: 'cornell', website: 'https://www.cornell.edu' },
    { name: 'Yale University', loc: 'New Haven, CT', country: 'USA', rank: 16, accept: 5, tuition: 62000, loan: true, slug: 'yale', website: 'https://www.yale.edu' },
    { name: 'Columbia University', loc: 'New York, NY', country: 'USA', rank: 23, accept: 4, tuition: 65000, loan: true, slug: 'columbia', website: 'https://www.columbia.edu' },
    { name: 'Johns Hopkins University', loc: 'Baltimore, MD', country: 'USA', rank: 28, accept: 7, tuition: 60000, loan: true, slug: 'jhu', website: 'https://www.jhu.edu' },
    { name: 'University of California, Los Angeles (UCLA)', loc: 'Los Angeles, CA', country: 'USA', rank: 29, accept: 9, tuition: 44000, loan: true, slug: 'ucla', website: 'https://www.ucla.edu' },
    { name: 'University of Michigan-Ann Arbor', loc: 'Ann Arbor, MI', country: 'USA', rank: 33, accept: 18, tuition: 53000, loan: true, slug: 'umich', website: 'https://www.umich.edu' },
    { name: 'New York University (NYU)', loc: 'New York, NY', country: 'USA', rank: 38, accept: 8, tuition: 58000, loan: true, slug: 'nyu', website: 'https://www.nyu.edu' },
    { name: 'Carnegie Mellon University (CMU)', loc: 'Pittsburgh, PA', country: 'USA', rank: 52, accept: 11, tuition: 60000, loan: true, slug: 'cmu', website: 'https://www.cmu.edu' },
    { name: 'University of Texas at Austin', loc: 'Austin, TX', country: 'USA', rank: 58, accept: 29, tuition: 40000, loan: true, slug: 'ut-austin', website: 'https://www.utexas.edu' },
    { name: 'Georgia Institute of Technology (Georgia Tech)', loc: 'Atlanta, GA', country: 'USA', rank: 97, accept: 16, tuition: 33000, loan: true, slug: 'gatech', website: 'https://www.gatech.edu' },
    { name: 'University of Illinois Urbana-Champaign (UIUC)', loc: 'Urbana, IL', country: 'USA', rank: 64, accept: 45, tuition: 36000, loan: true, slug: 'uiuc', website: 'https://www.illinois.edu' },
    { name: 'Purdue University', loc: 'West Lafayette, IN', country: 'USA', rank: 99, accept: 53, tuition: 31000, loan: true, slug: 'purdue', website: 'https://www.purdue.edu' },
    { name: 'University of Washington', loc: 'Seattle, WA', country: 'USA', rank: 63, accept: 48, tuition: 40000, loan: true, slug: 'uwashington', website: 'https://www.washington.edu' },
    { name: 'University of Southern California (USC)', loc: 'Los Angeles, CA', country: 'USA', rank: 116, accept: 10, tuition: 63000, loan: true, slug: 'usc', website: 'https://www.usc.edu' },
    { name: 'Northeastern University', loc: 'Boston, MA', country: 'USA', rank: 200, accept: 6, tuition: 59000, loan: true, slug: 'northeastern', website: 'https://www.northeastern.edu' },
    { name: 'Arizona State University (ASU)', loc: 'Tempe, AZ', country: 'USA', rank: 179, accept: 88, tuition: 34000, loan: true, slug: 'asu', website: 'https://www.asu.edu' },
  ],
  'united states': [
    { name: 'Massachusetts Institute of Technology (MIT)', loc: 'Cambridge, MA', country: 'USA', rank: 1, accept: 4, tuition: 55000, loan: true, slug: 'mit', website: 'https://www.mit.edu' },
    { name: 'Harvard University', loc: 'Cambridge, MA', country: 'USA', rank: 4, accept: 3, tuition: 57000, loan: true, slug: 'harvard', website: 'https://www.harvard.edu' },
    { name: 'Stanford University', loc: 'Stanford, CA', country: 'USA', rank: 5, accept: 4, tuition: 56000, loan: true, slug: 'stanford', website: 'https://www.stanford.edu' },
    { name: 'University of California, Berkeley (UCB)', loc: 'Berkeley, CA', country: 'USA', rank: 10, accept: 11, tuition: 44000, loan: true, slug: 'uc-berkeley', website: 'https://www.berkeley.edu' },
    { name: 'Columbia University', loc: 'New York, NY', country: 'USA', rank: 23, accept: 4, tuition: 65000, loan: true, slug: 'columbia', website: 'https://www.columbia.edu' },
  ],
  'uk': [
    { name: 'University of Cambridge', loc: 'Cambridge', country: 'UK', rank: 2, accept: 18, tuition: 40000, loan: true, slug: 'cambridge', website: 'https://www.cam.ac.uk' },
    { name: 'University of Oxford', loc: 'Oxford', country: 'UK', rank: 3, accept: 14, tuition: 42000, loan: true, slug: 'oxford', website: 'https://www.ox.ac.uk' },
    { name: 'Imperial College London', loc: 'London', country: 'UK', rank: 6, accept: 11, tuition: 38000, loan: true, slug: 'imperial', website: 'https://www.imperial.ac.uk' },
    { name: 'University College London (UCL)', loc: 'London', country: 'UK', rank: 9, accept: 12, tuition: 35000, loan: true, slug: 'ucl', website: 'https://www.ucl.ac.uk' },
    { name: 'University of Edinburgh', loc: 'Edinburgh', country: 'UK', rank: 22, accept: 10, tuition: 32000, loan: true, slug: 'edinburgh', website: 'https://www.ed.ac.uk' },
    { name: 'The University of Manchester', loc: 'Manchester', country: 'UK', rank: 32, accept: 27, tuition: 30000, loan: true, slug: 'manchester', website: 'https://www.manchester.ac.uk' },
    { name: 'King\'s College London (KCL)', loc: 'London', country: 'UK', rank: 40, accept: 13, tuition: 33000, loan: true, slug: 'kcl', website: 'https://www.kcl.ac.uk' },
    { name: 'London School of Economics (LSE)', loc: 'London', country: 'UK', rank: 45, accept: 9, tuition: 30000, loan: true, slug: 'lse', website: 'https://www.lse.ac.uk' },
    { name: 'University of Bristol', loc: 'Bristol', country: 'UK', rank: 55, accept: 14, tuition: 29000, loan: true, slug: 'bristol', website: 'https://www.bristol.ac.uk' },
    { name: 'The University of Warwick', loc: 'Coventry', country: 'UK', rank: 67, accept: 14, tuition: 28000, loan: true, slug: 'warwick', website: 'https://www.warwick.ac.uk' },
    { name: 'University of Glasgow', loc: 'Glasgow', country: 'UK', rank: 76, accept: 20, tuition: 27000, loan: true, slug: 'glasgow', website: 'https://www.gla.ac.uk' },
    { name: 'University of Birmingham', loc: 'Birmingham', country: 'UK', rank: 84, accept: 15, tuition: 26000, loan: true, slug: 'birmingham', website: 'https://www.birmingham.ac.uk' },
  ],
  'united kingdom': [
    { name: 'University of Cambridge', loc: 'Cambridge', country: 'UK', rank: 2, accept: 18, tuition: 40000, loan: true, slug: 'cambridge', website: 'https://www.cam.ac.uk' },
    { name: 'University of Oxford', loc: 'Oxford', country: 'UK', rank: 3, accept: 14, tuition: 42000, loan: true, slug: 'oxford', website: 'https://www.ox.ac.uk' },
    { name: 'Imperial College London', loc: 'London', country: 'UK', rank: 6, accept: 11, tuition: 38000, loan: true, slug: 'imperial', website: 'https://www.imperial.ac.uk' },
    { name: 'University College London (UCL)', loc: 'London', country: 'UK', rank: 9, accept: 12, tuition: 35000, loan: true, slug: 'ucl', website: 'https://www.ucl.ac.uk' },
  ],
  'canada': [
    { name: 'University of Toronto', loc: 'Toronto, Ontario', country: 'Canada', rank: 21, accept: 43, tuition: 45000, loan: true, slug: 'utoronto', website: 'https://www.utoronto.ca' },
    { name: 'McGill University', loc: 'Montreal, Quebec', country: 'Canada', rank: 30, accept: 38, tuition: 35000, loan: true, slug: 'mcgill', website: 'https://www.mcgill.ca' },
    { name: 'University of British Columbia (UBC)', loc: 'Vancouver, BC', country: 'Canada', rank: 34, accept: 52, tuition: 38000, loan: true, slug: 'ubc', website: 'https://www.ubc.ca' },
    { name: 'University of Alberta', loc: 'Edmonton, Alberta', country: 'Canada', rank: 111, accept: 58, tuition: 28000, loan: true, slug: 'ualberta', website: 'https://www.ualberta.ca' },
    { name: 'University of Waterloo', loc: 'Waterloo, Ontario', country: 'Canada', rank: 112, accept: 53, tuition: 42000, loan: true, slug: 'uwaterloo', website: 'https://www.uwaterloo.ca' },
    { name: 'Western University', loc: 'London, Ontario', country: 'Canada', rank: 114, accept: 58, tuition: 32000, loan: true, slug: 'uwo', website: 'https://www.uwo.ca' },
    { name: 'McMaster University', loc: 'Hamilton, Ontario', country: 'Canada', rank: 189, accept: 59, tuition: 36000, loan: true, slug: 'mcmaster', website: 'https://www.mcmaster.ca' },
  ],
  'australia': [
    { name: 'The University of Melbourne', loc: 'Melbourne, Victoria', country: 'Australia', rank: 14, accept: 70, tuition: 38000, loan: true, slug: 'unimelb', website: 'https://www.unimelb.edu.au' },
    { name: 'The University of New South Wales (UNSW)', loc: 'Sydney, NSW', country: 'Australia', rank: 19, accept: 60, tuition: 37000, loan: true, slug: 'unsw', website: 'https://www.unsw.edu.au' },
    { name: 'The University of Sydney', loc: 'Sydney, NSW', country: 'Australia', rank: 19, accept: 30, tuition: 39000, loan: true, slug: 'usyd', website: 'https://www.sydney.edu.au' },
    { name: 'Australian National University (ANU)', loc: 'Canberra', country: 'Australia', rank: 34, accept: 35, tuition: 36000, loan: true, slug: 'anu', website: 'https://www.anu.edu.au' },
    { name: 'Monash University', loc: 'Melbourne, Victoria', country: 'Australia', rank: 42, accept: 40, tuition: 35000, loan: true, slug: 'monash', website: 'https://www.monash.edu' },
    { name: 'The University of Queensland (UQ)', loc: 'Brisbane, Queensland', country: 'Australia', rank: 43, accept: 40, tuition: 34000, loan: true, slug: 'uq', website: 'https://www.uq.edu.au' },
    { name: 'UTS (University of Technology Sydney)', loc: 'Sydney, NSW', country: 'Australia', rank: 90, accept: 19, tuition: 32000, loan: true, slug: 'uts', website: 'https://www.uts.edu.au' },
  ],
  'germany': [
    { name: 'Technical University of Munich (TUM)', loc: 'Munich', country: 'Germany', rank: 37, accept: 8, tuition: 4000, loan: true, slug: 'tum', website: 'https://www.tum.de' },
    { name: 'Ludwig-Maximilians-Universität München (LMU)', loc: 'Munich', country: 'Germany', rank: 54, accept: 15, tuition: 1500, loan: true, slug: 'lmu', website: 'https://www.lmu.de' },
    { name: 'Heidelberg University', loc: 'Heidelberg', country: 'Germany', rank: 87, accept: 17, tuition: 3000, loan: true, slug: 'heidelberg', website: 'https://www.uni-heidelberg.de' },
    { name: 'Freie Universität Berlin', loc: 'Berlin', country: 'Germany', rank: 98, accept: 15, tuition: 1500, loan: true, slug: 'fu-berlin', website: 'https://www.fu-berlin.de' },
    { name: 'RWTH Aachen University', loc: 'Aachen', country: 'Germany', rank: 106, accept: 10, tuition: 1500, loan: true, slug: 'rwth-aachen', website: 'https://www.rwth-aachen.de' },
  ],
  'ireland': [
    { name: 'Trinity College Dublin (TCD)', loc: 'Dublin', country: 'Ireland', rank: 81, accept: 33, tuition: 24000, loan: true, slug: 'tcd', website: 'https://www.tcd.ie' },
    { name: 'University College Dublin (UCD)', loc: 'Dublin', country: 'Ireland', rank: 171, accept: 38, tuition: 22000, loan: true, slug: 'ucd', website: 'https://www.ucd.ie' },
    { name: 'University of Galway', loc: 'Galway', country: 'Ireland', rank: 289, accept: 45, tuition: 18000, loan: true, slug: 'galway', website: 'https://www.universityofgalway.ie' },
    { name: 'University College Cork (UCC)', loc: 'Cork', country: 'Ireland', rank: 292, accept: 41, tuition: 19000, loan: true, slug: 'ucc', website: 'https://www.ucc.ie' },
    { name: 'Dublin City University (DCU)', loc: 'Dublin', country: 'Ireland', rank: 436, accept: 55, tuition: 16000, loan: true, slug: 'dcu', website: 'https://www.dcu.ie' },
  ],
  'new zealand': [
    { name: 'The University of Auckland', loc: 'Auckland', country: 'New Zealand', rank: 68, accept: 45, tuition: 30000, loan: true, slug: 'auckland', website: 'https://www.auckland.ac.nz' },
    { name: 'University of Otago', loc: 'Dunedin', country: 'New Zealand', rank: 206, accept: 58, tuition: 26000, loan: true, slug: 'otago', website: 'https://www.otago.ac.nz' },
    { name: 'Victoria University of Wellington', loc: 'Wellington', country: 'New Zealand', rank: 241, accept: 64, tuition: 25000, loan: true, slug: 'victoria-wellington', website: 'https://www.wgtn.ac.nz' },
  ],
};

function getFallbackUniversities(country?: string, query?: string): Array<{ name: string; loc: string; country: string; rank?: number; accept?: number; tuition?: number; loan?: boolean; slug?: string; website?: string }> {
  const cleanCountry = (country || '').trim().toLowerCase();
  const cleanQuery = (query || '').trim().toLowerCase();

  let pool: Array<{ name: string; loc: string; country: string; rank?: number; accept?: number; tuition?: number; loan?: boolean; slug?: string; website?: string }> = [];

  if (cleanCountry && FALLBACK_UNIVERSITIES_BY_COUNTRY[cleanCountry]) {
    pool = [...FALLBACK_UNIVERSITIES_BY_COUNTRY[cleanCountry]];
  } else if (cleanCountry) {
    for (const key of Object.keys(FALLBACK_UNIVERSITIES_BY_COUNTRY)) {
      if (key.includes(cleanCountry) || cleanCountry.includes(key)) {
        pool.push(...FALLBACK_UNIVERSITIES_BY_COUNTRY[key]);
      }
    }
  }

  if (pool.length === 0) {
    for (const key of Object.keys(FALLBACK_UNIVERSITIES_BY_COUNTRY)) {
      pool.push(...FALLBACK_UNIVERSITIES_BY_COUNTRY[key]);
    }
  }

  if (cleanQuery) {
    pool = pool.filter(u =>
      u.name.toLowerCase().includes(cleanQuery) ||
      u.loc.toLowerCase().includes(cleanQuery) ||
      u.country.toLowerCase().includes(cleanQuery)
    );
  }

  const seen = new Set<string>();
  const uniquePool: Array<{ name: string; loc: string; country: string; rank?: number; accept?: number; tuition?: number; loan?: boolean; slug?: string; website?: string }> = [];

  for (const u of pool) {
    const k = u.name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniquePool.push(u);
    }
  }

  return uniquePool.slice(0, 30);
}

@Controller('ai-search')
export class AiSearchController {
  constructor(private readonly openRouterService: OpenRouterService) {}

  @Post()
  async search(@Body() body: any) {
    const { country = 'Any', course = '', gpa = 0, bachelors = '', target_university = '', type = '', query = '', slug = '' } = body;

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
      Return a JSON object with a "courses" array of up to 15 specific course names.`;
    } else {
      if (query && query.trim().length > 0) {
        prompt = `You are a university database. The user is searching for a university named: "${query}".
        Country context: ${country || 'any country'}.

        TASK: Return up to 25 REAL universities in ${country || 'the world'} whose name contains or closely matches "${query}".
        IMPORTANT: Return actual real universities that exist in ${country || 'the world'}.
        
        For each university return these exact fields:
        - name: full official name of the university (MUST be accurate and real)
        - loc: "City, State/Region" (e.g. "Toronto, Ontario")
        - country: country name (e.g. "Canada")
        - rank: approximate global QS or US News ranking (integer, use 0 if unranked)
        - accept: acceptance rate percentage (integer)
        - tuition: approximate annual tuition in USD (integer)
        - loan: true
        - slug: url-friendly name (lowercase, hyphens)
        - website: official university URL
        
        Return ONLY a JSON object: { "universities": [...] }`;
      } else {
        prompt = `Return a list of 25 real universities located in ${country}.
        Include a diverse mix: top-ranked, mid-tier, and regional accredited universities in ${country}.
        
        For each real university include ALL of these exact fields:
        - name: full official name of the university
        - loc: city, state/region (e.g. "Toronto, Ontario" or "Vancouver, BC")
        - country: "${country}"
        - rank: global QS ranking (integer, 0 if unranked)
        - accept: acceptance rate percentage (integer)
        - tuition: annual tuition in USD (integer)
        - min_gpa: minimum GPA required (float, scale 0-10)
        - min_ielts: minimum IELTS score required (float)
        - min_toefl: minimum TOEFL iBT score required (integer)
        - courses: array of offered master's programs relevant to ${course || 'various fields'}
        - loan: true
        - slug: url-friendly name
        - website: official university URL
        
        Return ONLY a JSON object with a "universities" key containing the array.`;
      }
    }

    try {
      const parsed: any = await this.openRouterService.getJson<any>(prompt);

      if (type === 'university_detail') {
        const domain = (parsed.websiteDomain || parsed.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        parsed.website = domain ? `https://www.${domain}` : '';
        parsed.logo = domain ? `https://logo.clearbit.com/${domain}` : '';

        const countryKey = (parsed.country || country || '').toLowerCase();
        const HERO_IMAGES: Record<string, string> = {
          'united kingdom': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
          'uk': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
          'usa': 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80',
          'united states': 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80',
          'canada': 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&q=80',
          'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80',
          'germany': 'https://images.unsplash.com/photo-1597672890275-702a4953ff1f?w=1600&q=80',
          'ireland': 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=1600&q=80',
          'france': 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=1600&q=80',
          'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80',
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
          : defaultCampus;

        return { success: true, university: parsed };
      }
      if (type === 'course') {
        return { success: true, results: Array.isArray(parsed) ? parsed : (parsed.courses || parsed.results || []) };
      }
      const unis = parsed?.universities || parsed?.results || (Array.isArray(parsed) ? parsed : []);
      if (Array.isArray(unis) && unis.length > 0) {
        return { success: true, universities: unis };
      }
      const fallbackList = getFallbackUniversities(country, query);
      return { success: true, universities: fallbackList };
    } catch (e: any) {
      console.warn('OpenRouter search encountered issue, using fallback dataset:', e?.message || e);
      if (type === 'course') {
        return { success: true, results: ['B.Tech/B.E.', 'MS/M.Tech', 'MBA/PGDM', 'MBBS/Medicine', 'Data Science', 'Computer Science', 'Business Analytics'] };
      }
      const fallbackList = getFallbackUniversities(country, query);
      return { success: true, universities: fallbackList };
    }
  }
}
