// Loan Recommendations based on Onboarding Data
const API_BASE_URL = 'http://localhost:3000';

// Get onboarding data from localStorage
const onboardingData = JSON.parse(localStorage.getItem('onboardingData') || '{}');
const userData = {
    firstName: localStorage.getItem('firstName') || onboardingData.firstName || 'there',
    email: localStorage.getItem('userEmail') || onboardingData.email
};

// Loan database with detailed information
const loanDatabase = {
    USA: [
        {
            bank: 'Discover Student Loans',
            type: 'International Student Loan',
            interestRate: '7.99% - 14.99%',
            maxAmount: '$100,000/year',
            features: ['No fees', 'Competitive rates', 'Flexible repayment', '100% tuition coverage'],
            processingTime: '15-30 days',
            collateral: 'US Co-signer required',
            bestFor: ['Masters', 'MBA', 'PhD'],
            rating: 4.5,
            logo: '🏦'
        },
        {
            bank: 'Prodigy Finance',
            type: 'No Cosigner Loan',
            interestRate: '9.95% - 14.25%',
            maxAmount: '$150,000',
            features: ['No cosigner needed', 'No collateral', 'Based on future earning potential', 'Covers living expenses'],
            processingTime: '7-14 days',
            collateral: 'None',
            bestFor: ['MBA', 'Masters'],
            rating: 4.7,
            logo: '🌐'
        },
        {
            bank: 'MPower Financing',
            type: 'International Student Loan',
            interestRate: '10.48% - 12.99%',
            maxAmount: '$50,000/year',
            features: ['No cosigner', 'Path to US credit', 'Scholarship opportunities', 'Career support'],
            processingTime: '10-20 days',
            collateral: 'None',
            bestFor: ['Bachelors', 'Masters'],
            rating: 4.3,
            logo: '⚡'
        }
    ],
    UK: [
        {
            bank: 'Future Finance',
            type: 'Postgraduate Loan',
            interestRate: '9.9% - 11.9%',
            maxAmount: '£40,000',
            features: ['No UK guarantor needed', 'Study now, pay later', 'Income-based repayment', 'Quick approval'],
            processingTime: '5-10 days',
            collateral: 'None',
            bestFor: ['Masters', 'MBA', 'PhD'],
            rating: 4.6,
            logo: '🏦'
        },
        {
            bank: 'Prodigy Finance',
            type: 'No Cosigner Loan',
            interestRate: '9.50% - 13.75%',
            maxAmount: '£100,000',
            features: ['No guarantor', 'No collateral', 'Alumni-funded', 'Flexible terms'],
            processingTime: '7-14 days',
            collateral: 'None',
            bestFor: ['MBA', 'Masters'],
            rating: 4.7,
            logo: '🌐'
        },
        {
            bank: 'Lendwise',
            type: 'Postgraduate Loan',
            interestRate: '7.9% - 11.9%',
            maxAmount: '£25,000',
            features: ['Fast approval', 'Flexible repayment', 'No upfront fees', 'Dedicated support'],
            processingTime: '3-7 days',
            collateral: 'None',
            bestFor: ['Masters'],
            rating: 4.4,
            logo: '💡'
        }
    ],
    Canada: [
        {
            bank: 'CIBC International Student Loan',
            type: 'Student Line of Credit',
            interestRate: 'Prime + 1.00%',
            maxAmount: 'CAD 100,000',
            features: ['Competitive rates', 'Flexible withdrawal', 'Grace period', 'No prepayment penalty'],
            processingTime: '10-15 days',
            collateral: 'Canadian co-signer required',
            bestFor: ['Bachelors', 'Masters'],
            rating: 4.3,
            logo: '🏦'
        },
        {
            bank: 'MPower Financing',
            type: 'International Student Loan',
            interestRate: '10.48% - 12.99%',
            maxAmount: 'CAD 60,000/year',
            features: ['No cosigner', 'Path to credit', 'Scholarship access', 'Career resources'],
            processingTime: '10-20 days',
            collateral: 'None',
            bestFor: ['Bachelors', 'Masters'],
            rating: 4.3,
            logo: '⚡'
        }
    ],
    Australia: [
        {
            bank: 'Prodigy Finance',
            type: 'International Student Loan',
            interestRate: '9.75% - 14.00%',
            maxAmount: 'AUD 120,000',
            features: ['No local guarantor', 'Future earnings based', 'Flexible repayment', 'Alumni network'],
            processingTime: '7-14 days',
            collateral: 'None',
            bestFor: ['MBA', 'Masters'],
            rating: 4.7,
            logo: '🌐'
        }
    ],
    Germany: [
        {
            bank: 'Deutsche Bank Student Loan',
            type: 'Education Loan',
            interestRate: '4.5% - 6.5%',
            maxAmount: '€30,000',
            features: ['Low interest', 'EU friendly', 'Flexible terms', 'Student benefits'],
            processingTime: '15-30 days',
            collateral: 'May require guarantor',
            bestFor: ['Bachelors', 'Masters'],
            rating: 4.2,
            logo: '🏦'
        }
    ],
    Ireland: [
        {
            bank: 'Prodigy Finance',
            type: 'Postgraduate Loan',
            interestRate: '9.50% - 13.50%',
            maxAmount: '€80,000',
            features: ['No Irish guarantor', 'Quick decision', 'Competitive rates', 'Alumni funded'],
            processingTime: '7-14 days',
            collateral: 'None',
            bestFor: ['MBA', 'Masters'],
            rating: 4.6,
            logo: '🌐'
        }
    ]
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadRecommendations();
    }, 2000); // Show loading animation for 2 seconds
});

function loadRecommendations() {
    // Display user greeting
    displayUserGreeting();

    // Display study plan summary
    displayStudyPlan();

    // Generate AI insights
    generateAIInsights();

    // Get and display loan recommendations
    const loans = getRecommendedLoans();
    displayLoanOptions(loans);

    // Hide loading overlay
    document.getElementById('loadingOverlay').style.display = 'none';
}

function displayUserGreeting() {
    const greeting = document.getElementById('userGreeting');
    const destination = onboardingData.studyDestination || 'abroad';
    const level = onboardingData.courseLevel || 'your program';

    greeting.textContent = `Based on your ${level} plans in ${destination}, here are the best options for you`;
}

function displayStudyPlan() {
    const container = document.getElementById('studyPlanDetails');
    const details = [
        { icon: 'flag', label: 'Destination', value: onboardingData.studyDestination || 'Not specified' },
        { icon: 'school', label: 'Level', value: onboardingData.courseLevel || 'Not specified' },
        { icon: 'menu_book', label: 'Field of Study', value: onboardingData.courseName || 'Not specified' },
        { icon: 'calendar_month', label: 'Intake', value: onboardingData.intakeSeason || 'Not specified' },
        { icon: 'emoji_objects', label: 'Goal', value: formatGoal(onboardingData.goal) },
        { icon: 'email', label: 'Contact', value: onboardingData.email || userData.email || 'Not provided' }
    ];

    container.innerHTML = details.map(detail => `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span class="material-symbols-rounded text-primary">${detail.icon}</span>
            </div>
            <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${detail.label}</div>
                <div class="font-semibold text-gray-900 dark:text-white">${detail.value}</div>
            </div>
        </div>
    `).join('');
}

function formatGoal(goal) {
    const goals = {
        'plan': '📚 Plan Education',
        'loan': '💰 Get Education Loan',
        'evaluate': '🎓 Evaluate Universities'
    };
    return goals[goal] || goal || 'Not specified';
}

function generateAIInsights() {
    const container = document.getElementById('aiInsights');
    const { studyDestination, courseLevel, courseName } = onboardingData;

    let insight = `Based on your profile, `;

    // Destination-specific insights
    if (studyDestination === 'USA') {
        insight += `studying ${courseName || 'your chosen field'} in the USA typically requires $50,000-$80,000 per year. `;
        insight += `You have excellent options including no-cosigner loans from Prodigy Finance and MPower Financing. `;
    } else if (studyDestination === 'UK') {
        insight += `pursuing ${courseLevel} in the UK costs around £20,000-£35,000 per year. `;
        insight += `Several UK lenders offer loans without requiring a UK guarantor, making it easier for international students. `;
    } else if (studyDestination === 'Canada') {
        insight += `studying in Canada costs approximately CAD 20,000-40,000 per year. `;
        insight += `You can explore both Canadian bank loans and international student financing options. `;
    } else {
        insight += `studying ${courseName || 'your field'} abroad is an excellent investment in your future. `;
    }

    // Course level insights
    if (courseLevel === 'MBA') {
        insight += `For MBA programs, lenders often offer higher loan amounts (up to $150,000) due to strong post-graduation earning potential. `;
    } else if (courseLevel === 'Masters') {
        insight += `Master's programs typically qualify for substantial education loans with flexible repayment options. `;
    }

    insight += `We recommend comparing at least 3 options below and applying early to secure the best rates.`;

    container.textContent = insight;
}

function getRecommendedLoans() {
    const destination = onboardingData.studyDestination || 'USA';
    const courseLevel = onboardingData.courseLevel || 'Masters';

    // Get loans for the destination
    let loans = loanDatabase[destination] || loanDatabase['USA'];

    // Filter and sort by suitability
    loans = loans.map(loan => {
        // Calculate suitability score
        let score = loan.rating;
        if (loan.bestFor.includes(courseLevel)) {
            score += 1;
        }
        if (loan.collateral === 'None') {
            score += 0.5; // Bonus for no collateral
        }

        return { ...loan, suitabilityScore: score };
    });

    // Sort by suitability score
    loans.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return loans.slice(0, 3); // Return top 3
}

function displayLoanOptions(loans) {
    const container = document.getElementById('loanOptions');

    container.innerHTML = loans.map((loan, index) => `
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 ${index === 0 ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            ${index === 0 ? `
                <div class="absolute top-0 right-0 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 rounded-bl-3xl font-bold text-sm">
                    ⭐ RECOMMENDED
                </div>
            ` : ''}
            
            <div class="flex items-start gap-6 mb-6">
                <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center text-4xl">
                    ${loan.logo}
                </div>
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${loan.bank}</h3>
                    <p class="text-gray-600 dark:text-gray-400">${loan.type}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <div class="flex">
                            ${generateStars(loan.rating)}
                        </div>
                        <span class="text-sm text-gray-500">(${loan.rating}/5.0)</span>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</div>
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${loan.interestRate}</div>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum Amount</div>
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${loan.maxAmount}</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Processing Time</div>
                    <div class="text-lg font-bold text-purple-600 dark:text-purple-400">${loan.processingTime}</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Collateral</div>
                    <div class="text-lg font-bold text-orange-600 dark:text-orange-400">${loan.collateral}</div>
                </div>
            </div>
            
            <div class="mb-6">
                <h4 class="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span class="material-symbols-rounded text-primary">check_circle</span>
                    Key Features
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${loan.features.map(feature => `
                        <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <span class="material-symbols-rounded text-green-500 text-sm">done</span>
                            <span class="text-sm">${feature}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="learnMore('${loan.bank}')" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">
                    Learn More
                </button>
                <button onclick="applyNow('${loan.bank}')" class="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
                    Apply Now
                </button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="material-symbols-rounded text-yellow-400 text-sm">star</span>';
    }
    if (hasHalfStar) {
        stars += '<span class="material-symbols-rounded text-yellow-400 text-sm">star_half</span>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="material-symbols-rounded text-gray-300 dark:text-gray-600 text-sm">star</span>';
    }

    return stars;
}

function learnMore(bank) {
    alert(`Learn more about ${bank}\n\nThis will redirect to detailed information page.`);
    // TODO: Implement detailed loan information page
}

function applyNow(bank) {
    // Save selection to localStorage
    localStorage.setItem('selectedLoan', bank);
    // Redirect to application
    window.location.href = 'apply-loan.html';
}

// Save recommendations to localStorage for later access
function saveRecommendations() {
    const loans = getRecommendedLoans();
    localStorage.setItem('savedRecommendations', JSON.stringify({
        timestamp: new Date().toISOString(),
        loans: loans,
        profile: onboardingData
    }));
}

// Auto-save recommendations
setTimeout(saveRecommendations, 3000);
