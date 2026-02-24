//  Sun Glade — AI-Powered Chat Onboarding 

const chatCol = document.getElementById('chatCol');
const progressBar = document.getElementById('progressBar');
const stickyCta = document.getElementById('stickyCta');
const resumeBtn = document.getElementById('resumeBtn');

let currentIdx = 0;
let answers = {};   // { stepId: { value, label } }
let aiUniversities = []; // populated by AI search step

// 
//   UNIVERSITY DATABASE (40+ universities)
// 
const UNIVERSITY_DB = [
  //  USA 
  { name: 'Massachusetts Institute of Technology', loc: 'Cambridge, USA', country: 'USA', rank: 1, accept: 7, min_gpa: 9.0, min_ielts: 7.0, min_toefl: 100, tuition: 57986, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'physics', 'mathematics', 'ai', 'robotics'], loan: true, tag: 'World #1' },
  { name: 'Stanford University', loc: 'Stanford, USA', country: 'USA', rank: 3, accept: 4, min_gpa: 9.2, min_ielts: 7.0, min_toefl: 100, tuition: 62484, courses: ['computer science', 'engineering', 'data science', 'ai', 'business', 'management', 'electrical', 'mechanical'], loan: true, tag: 'Silicon Valley' },
  { name: 'Carnegie Mellon University', loc: 'Pittsburgh, USA', country: 'USA', rank: 22, accept: 17, min_gpa: 8.5, min_ielts: 6.5, min_toefl: 94, tuition: 58924, courses: ['computer science', 'software engineering', 'data science', 'ai', 'machine learning', 'information systems', 'robotics', 'electrical'], loan: true, tag: 'CS Powerhouse' },
  { name: 'University of Southern California', loc: 'Los Angeles, USA', country: 'USA', rank: 25, accept: 16, min_gpa: 7.8, min_ielts: 6.5, min_toefl: 90, tuition: 64726, courses: ['computer science', 'engineering', 'data science', 'business', 'media', 'film', 'electrical', 'mechanical', 'biomedical'], loan: true, tag: 'LA Tech Hub' },
  { name: 'University of Texas at Austin', loc: 'Austin, USA', country: 'USA', rank: 38, accept: 31, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 79, tuition: 40032, courses: ['computer science', 'engineering', 'data science', 'business', 'petroleum', 'electrical', 'mechanical', 'chemical'], loan: true, tag: 'Best Value' },
  { name: 'Northeastern University', loc: 'Boston, USA', country: 'USA', rank: 49, accept: 20, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 92, tuition: 58176, courses: ['computer science', 'engineering', 'data science', 'business', 'electrical', 'mechanical', 'information systems'], loan: true, tag: 'Co-op Leader' },
  { name: 'University of Illinois Urbana–Champaign', loc: 'Champaign, USA', country: 'USA', rank: 35, accept: 59, min_gpa: 7.8, min_ielts: 6.5, min_toefl: 79, tuition: 34444, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'chemical', 'agriculture', 'business'], loan: true, tag: 'Big Ten' },
  { name: 'Arizona State University', loc: 'Tempe, USA', country: 'USA', rank: 117, accept: 88, min_gpa: 6.5, min_ielts: 6.0, min_toefl: 61, tuition: 31200, courses: ['computer science', 'engineering', 'data science', 'business', 'sustainability', 'electrical', 'mechanical', 'nursing'], loan: true, tag: 'High Acceptance' },
  { name: 'Rice University', loc: 'Houston, USA', country: 'USA', rank: 17, accept: 11, min_gpa: 8.8, min_ielts: 7.0, min_toefl: 100, tuition: 53216, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'chemical', 'physics', 'business'], loan: true, tag: 'Small & Elite' },
  { name: 'University of Michigan', loc: 'Ann Arbor, USA', country: 'USA', rank: 23, accept: 26, min_gpa: 8.0, min_ielts: 6.5, min_toefl: 84, tuition: 52266, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'chemical'], loan: true, tag: 'Top Public' },
  //  UK 
  { name: 'University of Oxford', loc: 'Oxford, UK', country: 'UK', rank: 1, accept: 17, min_gpa: 8.5, min_ielts: 7.0, min_toefl: 110, tuition: 30500, courses: ['computer science', 'engineering', 'data science', 'business', 'law', 'medicine', 'physics', 'mathematics', 'ai'], loan: false, tag: 'World #1 UK' },
  { name: 'University of Cambridge', loc: 'Cambridge, UK', country: 'UK', rank: 2, accept: 26, min_gpa: 8.5, min_ielts: 7.5, min_toefl: 110, tuition: 28500, courses: ['computer science', 'engineering', 'data science', 'mathematics', 'natural sciences', 'physics', 'economics'], loan: false, tag: 'Russell Group' },
  { name: 'Imperial College London', loc: 'London, UK', country: 'UK', rank: 6, accept: 14, min_gpa: 8.0, min_ielts: 6.5, min_toefl: 92, tuition: 36500, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'chemical', 'medicine', 'ai', 'biomedical'], loan: true, tag: 'STEM Leader' },
  { name: 'University College London', loc: 'London, UK', country: 'UK', rank: 8, accept: 65, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 92, tuition: 30000, courses: ['computer science', 'engineering', 'data science', 'architecture', 'arts', 'social science', 'medicine', 'law'], loan: true, tag: 'London Heart' },
  { name: 'University of Edinburgh', loc: 'Edinburgh, UK', country: 'UK', rank: 22, accept: 47, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 92, tuition: 24300, courses: ['computer science', 'engineering', 'data science', 'informatics', 'medicine', 'business', 'arts', 'social science'], loan: true, tag: 'Ancient & Modern' },
  { name: 'University of Manchester', loc: 'Manchester, UK', country: 'UK', rank: 28, accept: 54, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 90, tuition: 22000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'chemical', 'electrical', 'mechanical'], loan: true, tag: 'Red Brick' },
  //  Canada 
  { name: 'University of Toronto', loc: 'Toronto, Canada', country: 'Canada', rank: 18, accept: 43, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 93, tuition: 43000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'chemical', 'ai'], loan: true, tag: 'Canada #1' },
  { name: 'University of British Columbia', loc: 'Vancouver, Canada', country: 'Canada', rank: 34, accept: 52, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, tuition: 36000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'forestry', 'electrical', 'mechanical'], loan: true, tag: 'West Coast' },
  { name: 'McGill University', loc: 'Montreal, Canada', country: 'Canada', rank: 30, accept: 46, min_gpa: 7.8, min_ielts: 6.5, min_toefl: 90, tuition: 28000, courses: ['computer science', 'engineering', 'data science', 'medicine', 'law', 'business', 'electrical', 'chemical', 'physics'], loan: true, tag: 'Top QS Canada' },
  { name: 'University of Waterloo', loc: 'Waterloo, Canada', country: 'Canada', rank: 112, accept: 53, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, tuition: 38000, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'software engineering', 'mathematics', 'ai'], loan: true, tag: 'Co-op Nation' },
  { name: 'University of Alberta', loc: 'Edmonton, Canada', country: 'Canada', rank: 111, accept: 70, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 86, tuition: 23000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'petroleum', 'electrical', 'mechanical'], loan: true, tag: 'Great Plains' },
  //  Australia 
  { name: 'University of Melbourne', loc: 'Melbourne, Australia', country: 'Australia', rank: 33, accept: 70, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 79, tuition: 42000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'arts'], loan: true, tag: 'Go8 Elite' },
  { name: 'Australian National University', loc: 'Canberra, Australia', country: 'Australia', rank: 30, accept: 35, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 80, tuition: 40000, courses: ['computer science', 'engineering', 'data science', 'policy', 'medicine', 'physics', 'mathematics', 'environment'], loan: true, tag: 'Research Leader' },
  { name: 'University of Sydney', loc: 'Sydney, Australia', country: 'Australia', rank: 41, accept: 60, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 85, tuition: 43000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'law', 'arts', 'architecture'], loan: true, tag: 'Sandstone Uni' },
  { name: 'University of New South Wales', loc: 'Sydney, Australia', country: 'Australia', rank: 67, accept: 50, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 85, tuition: 41000, courses: ['computer science', 'engineering', 'data science', 'business', 'law', 'medicine', 'electrical', 'mechanical'], loan: true, tag: 'UNSW Leader' },
  //  Germany 
  { name: 'Technical University of Munich', loc: 'Munich, Germany', country: 'Germany', rank: 37, accept: 8, min_gpa: 8.0, min_ielts: 6.5, min_toefl: 88, tuition: 2600, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'chemical', 'robotics', 'ai', 'mathematics'], loan: false, tag: 'TU9 Elite' },
  { name: 'Heidelberg University', loc: 'Heidelberg, Germany', country: 'Germany', rank: 43, accept: 20, min_gpa: 7.5, min_ielts: 6.0, min_toefl: 80, tuition: 3000, courses: ['computer science', 'data science', 'physics', 'mathematics', 'medicine', 'natural sciences', 'chemistry'], loan: false, tag: 'Oldest German Uni' },
  { name: 'RWTH Aachen University', loc: 'Aachen, Germany', country: 'Germany', rank: 106, accept: 35, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 80, tuition: 2500, courses: ['computer science', 'engineering', 'electrical', 'mechanical', 'chemical', 'data science', 'robotics', 'mathematics'], loan: false, tag: 'Engineering Hub' },
  //  Ireland 
  { name: 'Trinity College Dublin', loc: 'Dublin, Ireland', country: 'Ireland', rank: 81, accept: 30, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, tuition: 22000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'law', 'arts', 'mathematics'], loan: true, tag: 'Oldest Irish Uni' },
  { name: 'University College Dublin', loc: 'Dublin, Ireland', country: 'Ireland', rank: 181, accept: 50, min_gpa: 7.0, min_ielts: 6.0, min_toefl: 80, tuition: 18000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'agriculture', 'electrical', 'mechanical'], loan: true, tag: 'Ireland Leader' },
  //  Singapore / Other 
  { name: 'National University of Singapore', loc: 'Singapore', country: 'Other', rank: 8, accept: 8, min_gpa: 8.5, min_ielts: 6.5, min_toefl: 85, tuition: 21000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'ai'], loan: false, tag: 'Asia #1' },
];

// Country  flag mapping
const COUNTRY_FLAGS = {
  'USA': '\uD83C\uDDFA\uD83C\uDDF8',
  'UK': '\uD83C\uDDEC\uD83C\uDDE7',
  'Canada': '\uD83C\uDDE8\uD83C\uDDE6',
  'Australia': '\uD83C\uDDE6\uD83C\uDDFA',
  'Germany': '\uD83C\uDDE9\uD83C\uDDEA',
  'Ireland': '\uD83C\uDDEE\uD83C\uDDEA',
  'Singapore': '\uD83C\uDDF8\uD83C\uDDEC',
  'Other': '\uD83C\uDF0D'
};

// Rich country data for visual cards
const COUNTRY_DATA = {
  'USA': { code: 'us', img: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=500&q=80', sub: 'Most Popular Destination' },
  'UK': { code: 'gb', img: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500&q=80', sub: 'Russell Group Universities' },
  'Canada': { code: 'ca', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=500&q=80', sub: 'Post-Study Work Visa' },
  'Australia': { code: 'au', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80', sub: 'Go8 World-Class Unis' },
  'Germany': { code: 'de', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500&q=80', sub: 'Low / No Tuition Fees' },
  'Ireland': { code: 'ie', img: 'https://images.unsplash.com/photo-1564959130747-897fb406b9af?w=500&q=80', sub: 'EU Tech Hub' },
};

// All countries for the search picker (name + ISO 3166-1 alpha-2 code)
const ALL_COUNTRIES = [
  { label: 'Afghanistan', code: 'af' },
  { label: 'Albania', code: 'al' },
  { label: 'Argentina', code: 'ar' },
  { label: 'Armenia', code: 'am' },
  { label: 'Australia', code: 'au' },
  { label: 'Austria', code: 'at' },
  { label: 'Azerbaijan', code: 'az' },
  { label: 'Bahrain', code: 'bh' },
  { label: 'Bangladesh', code: 'bd' },
  { label: 'Belgium', code: 'be' },
  { label: 'Brazil', code: 'br' },
  { label: 'Canada', code: 'ca' },
  { label: 'Chile', code: 'cl' },
  { label: 'China', code: 'cn' },
  { label: 'Colombia', code: 'co' },
  { label: 'Croatia', code: 'hr' },
  { label: 'Cyprus', code: 'cy' },
  { label: 'Czech Republic', code: 'cz' },
  { label: 'Denmark', code: 'dk' },
  { label: 'Egypt', code: 'eg' },
  { label: 'Estonia', code: 'ee' },
  { label: 'Finland', code: 'fi' },
  { label: 'France', code: 'fr' },
  { label: 'Georgia', code: 'ge' },
  { label: 'Germany', code: 'de' },
  { label: 'Greece', code: 'gr' },
  { label: 'Hong Kong', code: 'hk' },
  { label: 'Hungary', code: 'hu' },
  { label: 'India', code: 'in' },
  { label: 'Indonesia', code: 'id' },
  { label: 'Iran', code: 'ir' },
  { label: 'Ireland', code: 'ie' },
  { label: 'Israel', code: 'il' },
  { label: 'Italy', code: 'it' },
  { label: 'Japan', code: 'jp' },
  { label: 'Jordan', code: 'jo' },
  { label: 'Kazakhstan', code: 'kz' },
  { label: 'Kuwait', code: 'kw' },
  { label: 'Latvia', code: 'lv' },
  { label: 'Lithuania', code: 'lt' },
  { label: 'Luxembourg', code: 'lu' },
  { label: 'Malaysia', code: 'my' },
  { label: 'Malta', code: 'mt' },
  { label: 'Mexico', code: 'mx' },
  { label: 'Netherlands', code: 'nl' },
  { label: 'New Zealand', code: 'nz' },
  { label: 'Nigeria', code: 'ng' },
  { label: 'Norway', code: 'no' },
  { label: 'Oman', code: 'om' },
  { label: 'Pakistan', code: 'pk' },
  { label: 'Philippines', code: 'ph' },
  { label: 'Poland', code: 'pl' },
  { label: 'Portugal', code: 'pt' },
  { label: 'Qatar', code: 'qa' },
  { label: 'Romania', code: 'ro' },
  { label: 'Russia', code: 'ru' },
  { label: 'Saudi Arabia', code: 'sa' },
  { label: 'Singapore', code: 'sg' },
  { label: 'Slovakia', code: 'sk' },
  { label: 'South Africa', code: 'za' },
  { label: 'South Korea', code: 'kr' },
  { label: 'Spain', code: 'es' },
  { label: 'Sri Lanka', code: 'lk' },
  { label: 'Sweden', code: 'se' },
  { label: 'Switzerland', code: 'ch' },
  { label: 'Taiwan', code: 'tw' },
  { label: 'Thailand', code: 'th' },
  { label: 'Turkey', code: 'tr' },
  { label: 'UAE', code: 'ae' },
  { label: 'UK', code: 'gb' },
  { label: 'Ukraine', code: 'ua' },
  { label: 'USA', code: 'us' },
  { label: 'Vietnam', code: 'vn' },
];

// 
//   STEPS
// 
const steps = [
  {
    id: 'goal',
    header: "Looking for answers to your masters abroad questions?",
    q: "How can we support you with your master's?",
    type: 'goal_grid',
    options: [
      { value: 'plan', label: "Help me on my Master's plan", icon: '?', iconClass: 'icon-purple' },
      { value: 'loan', label: 'Need help with an education loan', icon: 'payments', iconClass: 'icon-green' },
      { value: 'compare', label: 'Evaluate my shortlisted universities', icon: 'menu_book', iconClass: 'icon-yellow' },
    ]
  },
  {
    id: 'welcome_transition',
    type: 'transition',
    title: "We got your back!",
    boxText: "We've helped over <strong>2.6 lakh students</strong> across <strong>18+ countries</strong> and <strong>18,000+ programs</strong>. Let's find the right program for you."
  },
  {
    id: 'country',
    q: "Where are you planning to do your master's?",
    type: 'countries',
    options: [
      { value: 'USA', label: 'USA' },
      { value: 'UK', label: 'UK' },
      { value: 'Canada', label: 'Canada' },
      { value: 'Australia', label: 'Australia' },
      { value: 'Germany', label: 'Germany' },
      { value: 'Ireland', label: 'Ireland' },
      { value: 'Other', label: 'Other' },
    ]
  },
  {
    id: 'course',
    q: "Which course are you going to pursue?",
    type: 'text',
    placeholder: 'e.g. Computer Science, Data Science, MBA'
  },
  {
    id: 'ai_search',
    type: 'ai_search'  // auto-runs — no user input
  },
  {
    id: 'admit_status',
    q: "Help me understand your admit status.",
    type: 'cards', cols: 2,
    options: [
      { value: 'received', label: 'Received Admit' },
      { value: 'awaiting', label: 'Awaiting Decision' },
      { value: 'waitlisted', label: 'Waitlisted' },
      { value: 'not_yet', label: 'Yet to Apply' },
      { value: 'on_campus', label: 'Already On Campus' },
    ]
  },
  {
    id: 'intake_month',
    q: "Please select your enrolling month for your masters.",
    type: 'months',
    year: new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0),
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    id: 'gpa',
    q: "What is your current academic score?",
    type: 'gpa_input'
  },
  {
    id: 'english_test',
    q: "Have you taken any English proficiency test?",
    type: 'cards', cols: 3,
    options: [
      { value: 'ielts', label: 'IELTS' },
      { value: 'toefl', label: 'TOEFL' },
      { value: 'pte', label: 'PTE' },
      { value: 'duolingo', label: 'Duolingo' },
      { value: 'none', label: 'Not Yet' },
    ]
  },
  {
    id: 'english_score',
    type: 'english_score'  // dynamic based on english_test answer
  },
  {
    id: 'loan_amount',
    qFn: () => 'How much loan amount do you need?',
    type: 'rupee',
    placeholder: '0'
  },
  {
    id: 'work_exp',
    q: "Enter your work experience (in months).",
    type: 'number',
    placeholder: '0'
  },
  {
    id: 'ai_match',
    type: 'ai_match'   // auto-runs — shows ranked results
  }
];

// 
//   INIT
// 
document.addEventListener('DOMContentLoaded', () => {
  renderStep(0);
  resumeBtn.addEventListener('click', saveAndRedirect);
});

function updateProgress(idx) {
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  progressBar.style.width = pct + '%';
}

// 
//   RENDER STEP
// 
function renderStep(idx) {
  if (idx >= steps.length) { showDone(); return; }

  currentIdx = idx;
  updateProgress(idx);

  const step = steps[idx];

  // Skip english_score if no test taken
  if (step.id === 'english_score' && answers.english_test && answers.english_test.value === 'none') {
    answers.english_score = { value: 'none', label: 'N/A' };
    renderStep(idx + 1);
    return;
  }

  // Auto-run AI steps
  if (step.type === 'ai_search') { runAISearch(idx); return; }
  if (step.type === 'ai_match') { runAIMatch(idx); return; }

  // Custom Transition Step (Image 2)
  if (step.type === 'transition') {
    renderTransitionStep(idx);
    return;
  }

  const qText = step.qFn ? step.qFn() : step.q;

  const wrapper = document.createElement('div');
  wrapper.id = 'step-' + idx;
  wrapper.className = 'fade-in';

  // Question
  if (step.header) {
    wrapper.innerHTML += `<div class="text-center mb-8 fade-in"><h1 class="text-3xl font-bold text-gray-800">${escHtml(step.header)}</h1></div>`;
  }
  wrapper.innerHTML += `<div class="q-row"><p class="q-text">${escHtml(qText)}</p></div>`;

  // Interaction area
  const ia = document.createElement('div');
  ia.className = 'ia-wrap'; ia.id = 'ia-' + idx;
  ia.innerHTML = buildIA(step, idx);
  wrapper.appendChild(ia);

  // Answer bubble (hidden)
  const ar = document.createElement('div');
  ar.className = 'ans-row'; ar.id = 'ans-' + idx; ar.style.display = 'none';
  ar.innerHTML = `
    <div class="ans-bubble" id="ans-bubble-${idx}"></div>
    <span class="ans-edit" onclick="editStep(${idx})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Edit
    </span>`;
  wrapper.appendChild(ar);

  chatCol.appendChild(wrapper);
  bindEvents(step, idx);
  setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}

// 
//   BUILD INTERACTION HTML
// 
function buildIA(step, idx) {

  if (step.type === 'cards') {
    const cls = step.cols === 3 ? 'opts-3' : 'opts-2';
    return `<div class="opts-grid ${cls}">` +
      step.options.map(o =>
        `<button class="opt-card" data-value="${o.value}" data-label="${escHtml(o.label)}">${escHtml(o.label)}</button>`
      ).join('') + '</div>';
  }

  if (step.type === 'countries') {
    const featureCards = step.options
      .filter(o => o.value !== 'Other')
      .map(o => {
        const d = COUNTRY_DATA[o.value] || { code: '', img: '', sub: '' };
        const flagUrl = d.code ? `https://flagcdn.com/w80/${d.code}.png` : '';
        return `<button class="country-img-card" data-value="${o.value}" data-label="${escHtml(o.label)}"
          style="--bg:url('${d.img}')">
          <div class="cic-overlay"></div>
          <div class="cic-flag">${flagUrl ? `<img src="${flagUrl}" alt="${escHtml(o.label)}" class="cic-flag-img" onerror="this.style.display='none'">` : ''}</div>
          <div class="cic-name">${escHtml(o.label)}</div>
          <div class="cic-sub">${escHtml(d.sub)}</div>
        </button>`;
      }).join('');

    return `<div class="country-img-grid">${featureCards}</div>
      <div class="country-search-wrap" id="cswrap-${idx}">
        <div class="country-search-trigger" id="cstrigger-${idx}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
          <span>Search other countries&hellip;</span>
          <span class="cst-arrow">&#8964;</span>
        </div>
        <div class="country-search-box" id="csbox-${idx}" style="display:none">
          <input class="country-search-input" id="csinput-${idx}" placeholder="Type a country name&hellip;" autocomplete="off" />
          <div class="country-search-results" id="csresults-${idx}"></div>
        </div>
      </div>`;
  }

  if (step.type === 'months') {
    return `<div class="months-wrap">
      <div class="year-label">THIS YEAR — ${step.year}</div>
      <div class="chips-row">` +
      step.months.map(m =>
        `<button class="month-chip" data-value="${m}-${step.year}" data-label="${m} ${step.year}">${m}</button>`
      ).join('') +
      `</div></div>`;
  }

  if (step.type === 'text') {
    return `<div class="input-group">
        <input class="chat-input" id="inp-${idx}" type="text" placeholder="${escHtml(step.placeholder)}" />
      </div>
      <button class="chat-submit" id="sub-${idx}">Continue </button>`;
  }

  if (step.type === 'rupee') {
    return `<div class="input-group">
        <span class="input-prefix">₹</span>
        <input class="chat-input with-prefix" id="inp-${idx}" type="text" placeholder="${escHtml(step.placeholder)}" oninput="fmtRupee(this)" />
      </div>
      <button class="chat-submit" id="sub-${idx}">Continue </button>`;
  }

  if (step.type === 'number') {
    return `<div class="input-group">
        <input class="chat-input" id="inp-${idx}" type="number" min="0" placeholder="${escHtml(step.placeholder)}" />
      </div>
      <button class="chat-submit" id="sub-${idx}">Continue </button>`;
  }

  if (step.type === 'gpa_input') {
    return `<div style="margin-top:10px">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button class="gpa-mode-btn active" data-mode="cgpa" id="mode-cgpa-${idx}" onclick="switchGPAMode(${idx},'cgpa')">CGPA (10)</button>
          <button class="gpa-mode-btn" data-mode="pct" id="mode-pct-${idx}" onclick="switchGPAMode(${idx},'pct')">Percentage (%)</button>
        </div>
        <div class="input-group">
          <input class="chat-input" id="inp-${idx}" type="number" step="0.1" min="0" max="10" placeholder="e.g. 8.5" data-mode="cgpa" />
          <span class="input-prefix" id="gpa-suffix-${idx}" style="left:auto;right:14px;font-size:12px;color:#aaa">/10</span>
        </div>
        <p id="gpa-hint-${idx}" style="font-size:11px;color:#aaa;margin-top:6px">Enter your CGPA out of 10</p>
      </div>
      <button class="chat-submit" id="sub-${idx}">Continue </button>
      <style>
        .gpa-mode-btn{padding:6px 14px;border-radius:9999px;border:1.5px solid #e5e7eb;background:#fff;
          font-size:12px;font-weight:600;color:#555;cursor:pointer;transition:all .15s}
        .gpa-mode-btn.active{background:#6605c7;color:#fff;border-color:#6605c7}
      </style>`;
  }

  if (step.type === 'english_score') {
    const test = (answers.english_test && answers.english_test.value) || 'ielts';
    const meta = {
      ielts: { label: 'IELTS', min: 0, max: 9, step: 0.5, placeholder: 'e.g. 7.0', hint: 'Band score (0–9)' },
      toefl: { label: 'TOEFL', min: 0, max: 120, step: 1, placeholder: 'e.g. 100', hint: 'Score out of 120' },
      pte: { label: 'PTE', min: 10, max: 90, step: 1, placeholder: 'e.g. 65', hint: 'Score out of 90' },
      duolingo: { label: 'Duolingo', min: 10, max: 160, step: 1, placeholder: 'e.g. 120', hint: 'Score out of 160' },
    }[test] || { label: 'Test', min: 0, max: 120, step: 1, placeholder: 'Score', hint: '' };
    return `<div class="q-row" style="margin-bottom:4px"><p class="q-text">What is your ${meta.label} score?</p></div>
      <div class="input-group">
        <input class="chat-input" id="inp-${idx}" type="number" step="${meta.step}" min="${meta.min}" max="${meta.max}" placeholder="${meta.placeholder}" />
      </div>
      <p style="font-size:11px;color:#aaa;margin-top:6px">${meta.hint}</p>
      <button class="chat-submit" id="sub-${idx}">Continue </button>`;
  }

  if (step.id === 'goal') {
    step.options[0].icon = 'help'; // Using 'help' material symbol instead of literal '?'
  }

  if (step.type === 'goal_grid') {
    const o = step.options;
    // Map to specific structure in Image 1
    // Large left: o[0], top right: o[1], bottom right: o[2]
    return `
      <div class="goal-grid">
        <div class="goal-card-large" data-value="${o[0].value}" data-label="${escHtml(o[0].label)}">
            <div class="icon-box ${o[0].iconClass}"><span class="material-symbols-outlined text-3xl">${o[0].icon}</span></div>
            <p class="font-bold text-gray-700">${escHtml(o[0].label)}</p>
        </div>
        <div class="goal-card-small" data-value="${o[1].value}" data-label="${escHtml(o[1].label)}">
            <div class="icon-box ${o[1].iconClass} text-2xl"><span class="material-symbols-outlined">${o[1].icon}</span></div>
            <p class="text-sm font-semibold text-gray-600">${escHtml(o[1].label)}</p>
        </div>
        <div class="goal-card-small" data-value="${o[2].value}" data-label="${escHtml(o[2].label)}">
            <div class="icon-box ${o[2].iconClass} text-2xl"><span class="material-symbols-outlined">${o[2].icon}</span></div>
            <p class="text-sm font-semibold text-gray-600">${escHtml(o[2].label)}</p>
        </div>
      </div>
    `;
  }

  return '';
}

function renderTransitionStep(idx) {
  const step = steps[idx];
  const wrapper = document.createElement('div');
  wrapper.className = 'transition-screen';
  wrapper.innerHTML = `
    <h1 class="transition-title">${step.title}</h1>
    <div class="transition-box">
        ${step.boxText}
    </div>
    <div class="blob-mascot">
        <img src="assets/img/mascot_ai.png" alt="Mascot" class="mascot-img" 
             onload="this.parentElement.classList.add('img-loaded')"
             onerror="this.parentElement.classList.add('img-failed')">
        <div class="mascot-body">
            <div class="mascot-eye"></div>
            <div class="mascot-eye"></div>
            <div class="mascot-mouth"></div>
        </div>
    </div>
    <button class="begin-btn" id="begin-btn-${idx}">Let's begin</button>
  `;
  chatCol.appendChild(wrapper);
  wrapper.scrollIntoView({ behavior: 'smooth' });

  document.getElementById(`begin-btn-${idx}`).onclick = () => {
    wrapper.classList.add('opacity-0');
    setTimeout(() => {
      wrapper.remove();
      renderStep(idx + 1);
    }, 400);
  };
}

// 
//   BIND EVENTS
// 
function bindEvents(step, idx) {
  const ia = document.getElementById('ia-' + idx);
  if (!ia) return;

  if (step.type === 'cards' || step.type === 'goal_grid') {
    ia.querySelectorAll('[data-value]').forEach(b =>
      b.addEventListener('click', () => submitAnswer(idx, b.dataset.value, b.dataset.label))
    );
    return;
  }

  if (step.type === 'countries') {
    // Main image cards
    ia.querySelectorAll('.country-img-card').forEach(b =>
      b.addEventListener('click', () => submitAnswer(idx, b.dataset.value, b.dataset.label))
    );
    // Other countries search
    const trigger = document.getElementById('cstrigger-' + idx);
    const box = document.getElementById('csbox-' + idx);
    const input = document.getElementById('csinput-' + idx);
    const results = document.getElementById('csresults-' + idx);
    if (!trigger || !box || !input || !results) return;
    function renderResults(q) {
      const filtered = ALL_COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 60);
      results.innerHTML = filtered.length
        ? filtered.map(c => {
          const flagImg = c.code
            ? `<img src="https://flagcdn.com/w40/${c.code}.png" alt="" class="csr-flag-img" onerror="this.style.display='none'">`
            : '';
          return `<div class="csr-item" data-value="${c.label}" data-label="${c.label}">${flagImg}${c.label}</div>`;
        }).join('')
        : '<div class="csr-empty">No country found</div>';
      results.querySelectorAll('.csr-item').forEach(el =>
        el.addEventListener('click', () => submitAnswer(idx, el.dataset.value, el.dataset.label))
      );
    }
    trigger.addEventListener('click', () => {
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      trigger.classList.toggle('open', !open);
      if (!open) { input.focus(); renderResults(''); }
    });
    input.addEventListener('input', () => renderResults(input.value));
    return;
  }

  if (step.type === 'months') {
    ia.querySelectorAll('.month-chip').forEach(b =>
      b.addEventListener('click', () => submitAnswer(idx, b.dataset.value, b.dataset.label))
    );
    return;
  }

  const sub = ia.querySelector('#sub-' + idx);
  const inp = ia.querySelector('#inp-' + idx);
  if (!sub || !inp) return;

  if (step.type === 'text') {
    sub.onclick = () => {
      const v = inp.value.trim();
      if (!v) { inp.style.borderColor = '#e74c3c'; return; }
      submitAnswer(idx, v, v);
    };
    inp.onkeypress = e => { if (e.key === 'Enter') sub.click(); };
    return;
  }

  if (step.type === 'rupee') {
    sub.onclick = () => {
      const raw = inp.value.replace(/[^0-9]/g, '');
      if (!raw) { inp.style.borderColor = '#e74c3c'; return; }
      const lbl = '₹' + parseInt(raw, 10).toLocaleString('en-IN');
      submitAnswer(idx, raw, lbl);
    };
    inp.onkeypress = e => { if (e.key === 'Enter') sub.click(); };
    return;
  }

  if (step.type === 'number') {
    sub.onclick = () => {
      const v = inp.value.trim();
      if (v === '' || isNaN(v)) { inp.style.borderColor = '#e74c3c'; return; }
      submitAnswer(idx, v, v + ' months');
    };
    inp.onkeypress = e => { if (e.key === 'Enter') sub.click(); };
    return;
  }

  if (step.type === 'gpa_input') {
    sub.onclick = () => {
      const v = parseFloat(inp.value);
      const mode = inp.dataset.mode || 'cgpa';
      if (isNaN(v) || v < 0) { inp.style.borderColor = '#e74c3c'; return; }
      let out10 = v;
      if (mode === 'pct') out10 = parseFloat((v / 10).toFixed(2));
      const lbl = mode === 'cgpa' ? (v + ' / 10') : (v + '%');
      submitAnswer(idx, String(out10), lbl);
    };
    inp.onkeypress = e => { if (e.key === 'Enter') sub.click(); };
    return;
  }

  if (step.type === 'english_score') {
    sub.onclick = () => {
      const v = inp.value.trim();
      const test = (answers.english_test && answers.english_test.label) || 'Test';
      if (v === '' || isNaN(v)) { inp.style.borderColor = '#e74c3c'; return; }
      submitAnswer(idx, v, test + ' ' + v);
    };
    inp.onkeypress = e => { if (e.key === 'Enter') sub.click(); };
    return;
  }
}

// GPA mode switcher
window.switchGPAMode = function (idx, mode) {
  const ia = document.getElementById('ia-' + idx);
  ia.querySelectorAll('.gpa-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  const inp = ia.querySelector('#inp-' + idx);
  const suffix = ia.querySelector('#gpa-suffix-' + idx);
  const hint = ia.querySelector('#gpa-hint-' + idx);
  inp.dataset.mode = mode;
  if (mode === 'cgpa') {
    inp.max = 10; inp.step = 0.1; inp.placeholder = 'e.g. 8.5';
    suffix.textContent = '/10';
    hint.textContent = 'Enter your CGPA out of 10';
  } else {
    inp.max = 100; inp.step = 0.1; inp.placeholder = 'e.g. 78';
    suffix.textContent = '%';
    hint.textContent = 'Enter your percentage (0–100)';
  }
  inp.value = '';
};

// 
//   SUBMIT ANSWER
// 
function submitAnswer(idx, value, label) {
  const step = steps[idx];
  answers[step.id] = { value, label };

  const ia = document.getElementById('ia-' + idx);
  const ar = document.getElementById('ans-' + idx);
  const bub = document.getElementById('ans-bubble-' + idx);

  ia.style.transition = 'opacity .2s, transform .2s';
  ia.style.opacity = '0';
  ia.style.transform = 'scale(0.95)';

  setTimeout(() => {
    ia.style.display = 'none';
    bub.textContent = label;
    ar.style.display = 'flex';
    setTimeout(() => renderStep(idx + 1), 480);
  }, 200);
}

// 
//   AI SEARCH (step 3 — finds universities)
// 
function runAISearch(idx) {
  const country = (answers.country && answers.country.value) || 'USA';
  const course = (answers.course && answers.course.value) || '';

  // AI thinking bubble
  const bubble = addAIBubble(idx, `
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `, false);

  setTimeout(() => {
    // Filter universities by country
    let pool = UNIVERSITY_DB.filter(u => u.country === country);
    if (pool.length === 0) pool = UNIVERSITY_DB; // fallback: all

    // Score by course relevance (preliminary)
    const kw = course.toLowerCase().replace(/[^a-z ]/g, '').trim();
    const keywords = kw.split(/\s+/).filter(Boolean);
    pool = pool.map(u => {
      let rel = 0;
      keywords.forEach(k => {
        if (u.courses.some(c => c.includes(k) || k.includes(c.split(' ')[0]))) rel++;
      });
      return { ...u, _rel: rel };
    }).sort((a, b) => b._rel - a._rel || a.rank - b.rank);

    aiUniversities = pool.slice(0, 10); // keep top 10 for later scoring

    const count = pool.length;
    const flag = COUNTRY_FLAGS[country] || '';

    bubble.innerHTML = `
      Searching <strong>${count} universities</strong> in ${flag} <strong>${country}</strong>
      for <strong>${escHtml(course) || 'your course'}</strong>...
    `;

    setTimeout(() => {
      bubble.innerHTML = `
         Found <span class="ai-stat">${count}+</span> universities in ${flag} <strong>${country}</strong>
        offering <strong>${escHtml(course) || 'this course'}</strong>.<br>
        <span style="font-size:12px;color:#888;margin-top:4px;display:block">
          Here are the top matches. Continue to refine your loan eligibility.
        </span>
      `;

      // ── Render university cards for this country + course ──
      const resultsWrapper = document.createElement('div');
      resultsWrapper.className = 'fade-in';
      resultsWrapper.id = 'ai-search-results-' + idx;

      const topUnivs = pool.slice(0, 8); // show up to 8 universities
      const sectionLabel = `<div class="section-label">Universities in ${flag} ${escHtml(country)} for ${escHtml(course || 'your course')}</div>`;
      const cards = topUnivs.map((u, i) => buildAISearchCard(u, i + 1)).join('');

      resultsWrapper.innerHTML = sectionLabel + `<div class="univ-results-grid">${cards}</div>`;

      // Continue button
      const contBtn = document.createElement('button');
      contBtn.className = 'chat-submit';
      contBtn.style.cssText = 'margin-top:18px;width:100%;';
      contBtn.textContent = 'Continue to check your eligibility ›';
      contBtn.onclick = () => {
        contBtn.disabled = true;
        contBtn.style.opacity = '0.6';
        renderStep(idx + 1);
      };
      resultsWrapper.appendChild(contBtn);

      chatCol.appendChild(resultsWrapper);
      setTimeout(() => resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 2000);
  }, 1400);
}

// Build a compact university card for the AI Search step
function buildAISearchCard(u, pos) {
  const relBadge = u._rel > 0
    ? `<span class="tag tag-accept">Course Match</span>`
    : '';
  const tuition = u.country === 'Germany'
    ? `€${u.tuition.toLocaleString()}/yr`
    : '$' + u.tuition.toLocaleString() + '/yr';

  return `
    <div class="univ-card" style="cursor:default">
      <div class="univ-rank-badge">#${pos}</div>
      <div class="univ-card-body">
        <div class="univ-card-name">${escHtml(u.name)}</div>
        <div class="univ-card-location">${escHtml(u.loc)}</div>
        <div class="univ-card-tags">
          <span class="tag tag-rank">Global #${u.rank}</span>
          <span class="tag tag-tuition">${tuition}</span>
          <span class="tag tag-accept">${u.accept}% accept</span>
          ${u.loan ? '<span class="tag tag-loan">Loan Ready</span>' : ''}
          ${relBadge}
        </div>
      </div>
    </div>`;
}

// 
//   AI MATCH (last step — scores + displays)
// 
function runAIMatch(idx) {
  const country = (answers.country && answers.country.value) || 'USA';
  const course = (answers.course && answers.course.value) || '';
  const gpa = parseFloat(answers.gpa && answers.gpa.value) || 6.5;
  const engTest = (answers.english_test && answers.english_test.value) || 'none';
  const engScore = parseFloat(answers.english_score && answers.english_score.value) || 0;
  const loanAmt = parseInt(answers.loan_amount && answers.loan_amount.value, 10) || 0;
  const workExp = parseInt(answers.work_exp && answers.work_exp.value, 10) || 0;

  const bubble = addAIBubble(idx, `
    <div class="typing-dots">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>
  `, false);

  setTimeout(() => {
    bubble.innerHTML = `Analyzing your profile — GPA <strong>${gpa}/10</strong>, ${engTest !== 'none' ? engTest.toUpperCase() + ' <strong>' + engScore + '</strong>' : 'no English test'}, <strong>${workExp} months</strong> experience...`;
  }, 800);

  setTimeout(() => {
    // Score each university
    const pool = aiUniversities.length > 0
      ? aiUniversities
      : UNIVERSITY_DB.filter(u => u.country === country).slice(0, 10);

    const scored = pool.map(u => {
      let score = 0;

      // GPA (35 pts)
      const gapGPA = gpa - u.min_gpa;
      if (gapGPA >= 1.0) score += 35;
      else if (gapGPA >= 0.3) score += 30;
      else if (gapGPA >= 0) score += 24;
      else if (gapGPA >= -0.5) score += 14;
      else if (gapGPA >= -1.0) score += 6;

      // English (25 pts)
      if (engTest !== 'none' && engScore > 0) {
        let minReq = u.min_ielts;
        let userScore = engScore;
        if (engTest === 'toefl') { minReq = u.min_toefl; }
        else if (engTest === 'pte') { minReq = Math.round(u.min_ielts * 9 + 10); userScore = engScore; }
        else if (engTest === 'duolingo') { minReq = 100; }
        const gap = userScore - minReq;
        if (gap >= 5) score += 25;
        else if (gap >= 0) score += 20;
        else if (gap >= -3) score += 12;
        else score += 5;
      } else {
        score += 12; // neutral
      }

      // Course relevance (20 pts)
      const kws = course.toLowerCase().split(/\s+/);
      const hasMatch = u.courses.some(c => kws.some(k => c.includes(k) || k.includes(c.split(' ')[0])));
      score += hasMatch ? 20 : 8;

      // Acceptance rate (15 pts)
      if (u.accept >= 50) score += 15;
      else if (u.accept >= 25) score += 10;
      else if (u.accept >= 10) score += 5;

      // Loan availability bonus (5 pts)
      if (u.loan && loanAmt > 0) score += 5;

      // Work experience small bonus (up to 3 pts)
      if (workExp >= 12) score += 3;
      else if (workExp >= 6) score += 1;

      return { ...u, _score: Math.min(score, 100) };
    }).sort((a, b) => b._score - a._score).slice(0, 5);

    bubble.innerHTML = `
       Matched <strong>${scored.length} top universities</strong> based on your profile!<br>
      <span style="font-size:12px;color:#888;margin-top:4px;display:block">Ranked by compatibility with your GPA, test scores, and preferences.</span>
    `;

    // Render results
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'fade-in';
    resultsDiv.id = 'step-' + idx;

    const sectionLabel = `<div class="section-label">Your Top Universities</div>`;
    const cards = scored.map((u, i) => buildUniCard(u, i + 1)).join('');

    resultsDiv.innerHTML = sectionLabel + `<div class="univ-results-grid">${cards}</div>`;
    chatCol.appendChild(resultsDiv);
    setTimeout(() => resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    // Show sticky CTA after a moment
    setTimeout(() => {
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      localStorage.setItem('onboardingComplete', 'true');
      stickyCta.classList.add('show');
    }, 1000);
  }, 3000);
}

// Build a university result card HTML
function buildUniCard(u, pos) {
  const pct = u._score;
  const cls = pct >= 70 ? 'match-high' : pct >= 45 ? 'match-mid' : 'match-low';
  const stroke = pct >= 70 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#a78bfa';
  const circ = 2 * Math.PI * 22;   // r=22
  const dash = circ - (pct / 100) * circ;

  const tuition = u.country === 'Germany'
    ? `${u.tuition.toLocaleString()}/yr`
    : '$' + u.tuition.toLocaleString() + '/yr';

  return `
    <div class="univ-card" onclick="openUniModal(${JSON.stringify(JSON.stringify(u))})">
      <div class="univ-rank-badge">#${pos}</div>
      <div class="univ-card-body">
        <div class="univ-card-name">${escHtml(u.name)}</div>
        <div class="univ-card-location">${escHtml(u.loc)}</div>
        <div class="univ-card-tags">
          <span class="tag tag-rank">Rank #${u.rank}</span>
          <span class="tag tag-tuition">${tuition}</span>
          <span class="tag tag-accept">${u.accept}% accept</span>
          ${u.loan ? '<span class="tag tag-loan">Loan Ready</span>' : ''}
        </div>
      </div>
      <div class="match-col">
        <div class="match-ring ${cls}">
          <svg viewBox="0 0 52 52">
            <circle class="ring-bg"   cx="26" cy="26" r="22"/>
            <circle class="ring-fill" cx="26" cy="26" r="22"
              stroke="${stroke}"
              stroke-dasharray="${circ.toFixed(1)}"
              stroke-dashoffset="${dash.toFixed(1)}"/>
          </svg>
          <span class="ring-text">${pct}%</span>
        </div>
        <button class="univ-apply-btn">Details</button>
      </div>
    </div>`;
}

// 
//   ADD AI BUBBLE (left-aligned bot msg)
// 
function addAIBubble(stepIdx, html, addToStep) {
  const row = document.createElement('div');
  row.className = 'ai-bubble-row fade-in';
  row.innerHTML = `
    <div class="ai-avatar blob-mascot" style="width:32px; height:32px; margin:0;">
        <img src="assets/img/mascot_ai.png" alt="AI Mascot" class="mascot-img rounded-full"
             onload="this.parentElement.classList.add('img-loaded')"
             onerror="this.parentElement.classList.add('img-failed')">
        <div class="mascot-body" style="width:100%; height:100%; gap:2px;">
            <div class="mascot-eye" style="width:6px; height:6px;"></div>
            <div class="mascot-eye" style="width:6px; height:6px;"></div>
        </div>
    </div>
    <div class="ai-bubble" id="ai-bubble-${stepIdx}">${html}</div>`;
  chatCol.appendChild(row);
  setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  return document.getElementById('ai-bubble-' + stepIdx);
}

// 
//   EDIT STEP
// 
window.editStep = function (idx) {
  // Remove all steps from idx onward (including AI bubbles)
  chatCol.querySelectorAll('[id^="step-"]').forEach(el => {
    const n = parseInt(el.id.replace('step-', ''));
    if (n >= idx) el.remove();
  });
  chatCol.querySelectorAll('.ai-bubble-row').forEach(el => {
    // Remove AI bubbles that appear after the edited step
    // heuristic: just remove the last ones
    el.remove();
  });

  answers[steps[idx].id] = undefined;
  currentIdx = idx;
  updateProgress(idx);
  stickyCta.classList.remove('show');
  renderStep(idx);
};

// 
//   DONE
// 
function showDone() {
  localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
  stickyCta.classList.add('show');
}

function saveAndRedirect() {
  localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
  localStorage.setItem('onboardingComplete', 'true');
  window.location.href = 'dashboard.html';
}

// 
//   UNIVERSITY DETAIL MODAL
// 
window.openUniModal = function (uStr) {
  const u = JSON.parse(JSON.parse(uStr));
  const pct = u._score;
  const tuition = u.country === 'Germany'
    ? '' + u.tuition.toLocaleString() + '/yr'
    : '$' + u.tuition.toLocaleString() + '/yr';
  const course = (answers.course && answers.course.value) || 'your course';

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:#fff;width:100%;max-width:680px;border-radius:24px 24px 0 0;padding:28px 24px 40px;max-height:85vh;overflow-y:auto;animation:slideUp .35s cubic-bezier(.4,0,.2,1)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
        <div>
          <div style="font-size:12px;font-weight:700;color:#6605c7;margin-bottom:4px">Rank #${u.rank} Globally</div>
          <div style="font-size:20px;font-weight:800;color:#1a1a2e;line-height:1.2">${escHtml(u.name)}</div>
          <div style="font-size:13px;color:#888;margin-top:3px">${escHtml(u.loc)}</div>
        </div>
        <button onclick="this.closest('[style]').remove()" style="background:#f5f5f5;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px;color:#555;flex-shrink:0"></button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px">
        <div style="padding:14px;border:1.5px solid #f0f0f0;border-radius:12px">
          <div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:4px">TUITION</div>
          <div style="font-size:16px;font-weight:800;color:#1a1a2e">${tuition}</div>
        </div>
        <div style="padding:14px;border:1.5px solid #f0f0f0;border-radius:12px">
          <div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:4px">ACCEPTANCE RATE</div>
          <div style="font-size:16px;font-weight:800;color:${u.accept < 20 ? '#dc2626' : u.accept < 50 ? '#d97706' : '#16a34a'}">${u.accept}%</div>
        </div>
        <div style="padding:14px;border:1.5px solid #f0f0f0;border-radius:12px">
          <div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:4px">MIN. IELTS</div>
          <div style="font-size:16px;font-weight:800;color:#1a1a2e">${u.min_ielts}</div>
        </div>
        <div style="padding:14px;border:1.5px solid #f0f0f0;border-radius:12px">
          <div style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:4px">MIN. CGPA</div>
          <div style="font-size:16px;font-weight:800;color:#1a1a2e">${u.min_gpa}/10</div>
        </div>
      </div>

      <div style="background:#f9f5ff;border:1.5px solid #ede9fe;border-radius:12px;padding:14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:12px;font-weight:700;color:#6605c7">Your Match Score</div>
          <div style="font-size:24px;font-weight:800;color:#6605c7">${pct}%</div>
          <div style="font-size:11px;color:#888">${pct >= 70 ? 'High Match — Strongly recommended' : pct >= 45 ? 'Good Match — Worth applying' : 'Possible — Consider improving profile'}</div>
        </div>
        <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#6605c7);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:800">${pct}%</div>
      </div>

      ${u.loan ? '<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#166534"> Education loan available for Indian students</div>' : ''}

      <div style="display:flex;gap:10px">
        <button onclick="this.closest('[style]').remove()" style="flex:1;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:#fff;color:#555">Close</button>
        <button onclick="window.location.href='apply-loan.html'" style="flex:2;padding:14px;background:linear-gradient(135deg,#7c3aed,#6605c7);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer">Apply for Loan </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

// Slide-up animation for modal
const _s = document.createElement('style');
_s.textContent = '@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}';
document.head.appendChild(_s);

// 
//   HELPERS
// 
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

window.fmtRupee = function (el) {
  const raw = el.value.replace(/[^0-9]/g, '');
  if (!raw) { el.value = ''; return; }
  el.value = parseInt(raw, 10).toLocaleString('en-IN');
};
