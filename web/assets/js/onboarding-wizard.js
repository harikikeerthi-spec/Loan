// Modern Step-by-Step Onboarding Wizard
const API_BASE_URL = 'http://localhost:3000';

// Onboarding state
const onboardingData = {
    goal: '',
    studyDestination: '',
    courseLevel: '',
    courseName: '',
    intakeSeason: '',
    firstName: '',
    email: '',
    phone: ''
};

let currentStep = 1;
const totalSteps = 4;

// DOM Elements
const progressFill = document.getElementById('progressFill');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const stepContents = document.querySelectorAll('.step-content');
const stepDots = document.querySelectorAll('.step-dot');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});

// Navigation functions
function goNext() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateUI();

            // Special handling for final step
            if (currentStep === 4) {
                processResults();
            }
        }
    }
}

function goBack() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function updateUI() {
    // Update progress bar
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = progress + '%';

    // Update step indicators
    stepDots.forEach((dot, index) => {
        const stepNum = index + 1;
        dot.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            dot.classList.add('active');
        } else if (stepNum < currentStep) {
            dot.classList.add('completed');
        }
    });

    // Update step content
    stepContents.forEach((content, index) => {
        const stepNum = index + 1;
        content.classList.toggle('active', stepNum === currentStep);
    });

    // Update navigation buttons
    backBtn.style.display = currentStep > 1 ? 'flex' : 'none';

    if (currentStep === totalSteps) {
        nextBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
        nextBtn.disabled = true;
    } else {
        nextBtn.innerHTML = 'Continue <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>';
        nextBtn.disabled = false;
    }
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateGoal();
        case 2:
            return validateStudyDetails();
        case 3:
            return validateContactInfo();
        default:
            return true;
    }
}

function validateGoal() {
    return onboardingData.goal !== '';
}

function validateStudyDetails() {
    const required = ['studyDestination', 'courseLevel', 'courseName', 'intakeSeason'];
    return required.every(field => onboardingData[field] !== '');
}

function validateContactInfo() {
    const firstName = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    let isValid = true;

    // First name validation
    if (!firstName || firstName.length < 2) {
        showError('firstName', 'Please enter your first name');
        isValid = false;
    } else {
        hideError('firstName');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    } else {
        hideError('email');
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        showError('phone', 'Please enter a valid 10-digit phone number');
        isValid = false;
    } else {
        hideError('phone');
        document.getElementById('phone').value = cleanPhone;
    }

    if (isValid) {
        onboardingData.firstName = firstName;
        onboardingData.email = email;
        onboardingData.phone = cleanPhone;
    }

    return isValid;
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');

    field.classList.add('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');

    field.classList.remove('error');
    errorDiv.classList.remove('show');
}

// Selection handlers
function selectOption(card) {
    // Remove selected class from all cards in this group
    const cards = card.parentElement.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.remove('selected'));

    // Add selected class to clicked card
    card.classList.add('selected');

    // Store the value
    const value = card.dataset.value;
    onboardingData.goal = value;
}

function selectSingleOption(card, field) {
    // Remove selected class from all cards in this group
    const cards = card.parentElement.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.remove('selected'));

    // Add selected class to clicked card
    card.classList.add('selected');

    // Store the value
    const value = card.dataset.value;
    onboardingData[field] = value;
}

function selectQuickPick(button, field) {
    // Remove selected class from all buttons in this group
    const buttons = button.parentElement.querySelectorAll('.quick-pick');
    buttons.forEach(b => b.classList.remove('selected'));

    // Add selected class to clicked button
    button.classList.add('selected');

    // Store the value and clear custom input
    const value = button.textContent;
    onboardingData[field] = value;
    const customInput = document.getElementById(field);
    if (customInput) {
        customInput.value = '';
    }
}

function handleCustomInput(input, field) {
    if (input.value.trim()) {
        // Remove selected class from quick picks
        const buttons = input.previousElementSibling.querySelectorAll('.quick-pick');
        buttons.forEach(b => b.classList.remove('selected'));

        // Store the custom value
        onboardingData[field] = input.value.trim();
    }
}

// Results processing
async function processResults() {
    try {
        // Save to localStorage
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('firstName', onboardingData.firstName);
        localStorage.setItem('onboardingComplete', 'true');

        // Save to backend
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(onboardingData)
        });

        if (!response.ok) {
            console.warn('Failed to save to backend, but continuing with flow');
        }

        // Generate and display results
        await displayResults();

    } catch (error) {
        console.error('Error processing results:', error);
        // Still show results even if backend fails
        await displayResults();
    }
}

async function displayResults() {
    const resultsContent = document.getElementById('resultsContent');

    // Show AI analysis
    const aiAnalysis = generateAIInsights(onboardingData);
    const recommendations = getRecommendedLoans(onboardingData);

    resultsContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; font-size: 20px;">🤖 AI Analysis Complete!</h3>
                <p style="margin: 0; opacity: 0.9;">${aiAnalysis}</p>
            </div>
        </div>

        <h3 style="text-align: center; margin-bottom: 24px; color: #333;">Top Loan Recommendations</h3>

        <div class="options-grid" style="margin-bottom: 32px;">
            ${recommendations.map((loan, index) => `
                <div class="option-card" style="text-align: left; position: relative;">
                    ${index === 0 ? '<div style="position: absolute; top: -8px; right: -8px; background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">RECOMMENDED</div>' : ''}
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">🏦</span>
                        <h4 style="margin: 0; color: #333;">${loan.name}</h4>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <div><strong>Amount:</strong> ${loan.amount}</div>
                        <div><strong>Rate:</strong> ${loan.rate}</div>
                        <div><strong>Processing:</strong> ${loan.time}</div>
                        <div><strong>Collateral:</strong> ${loan.collateral}</div>
                    </div>
                    <div style="color: #667eea; font-weight: 600;">✨ ${loan.highlight}</div>
                </div>
            `).join('')}
        </div>

        <div style="text-align: center;">
            <h4 style="margin-bottom: 16px; color: #333;">What would you like to do next?</h4>
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin: 0 auto;">
                <button onclick="applyForLoan()" style="padding: 16px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                    🚀 Apply for Recommended Loan
                </button>
                <button onclick="compareAllLoans()" style="padding: 16px 24px; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                    📊 Compare All Options
                </button>
                <button onclick="talkToExpert()" style="padding: 16px 24px; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                    👨‍💼 Talk to an Expert
                </button>
                <button onclick="saveToDashboard()" style="padding: 12px 24px; background: transparent; color: #666; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; text-decoration: underline;">
                    💾 Save and Continue Later
                </button>
            </div>
        </div>
    `;

    // Update navigation
    nextBtn.style.display = 'none';
    backBtn.innerHTML = 'Start Over';
    backBtn.onclick = () => location.reload();
}

// AI and loan functions (adapted from original)
function generateAIInsights(data) {
    const { studyDestination, courseLevel, courseName } = data;

    let insight = `For ${courseName || 'your field'} in ${studyDestination}, typical costs are $50,000-$80,000/year. `;

    if (studyDestination === 'USA') {
        insight += `Great news! You qualify for no-cosigner loans from top lenders. `;
    } else if (studyDestination === 'UK') {
        insight += `Multiple UK lenders offer loans without requiring a UK guarantor. `;
    } else if (studyDestination === 'Canada') {
        insight += `Both Canadian banks and international lenders have excellent options for you. `;
    }

    if (courseLevel === 'MBA') {
        insight += `MBA programs often qualify for up to $150,000 in financing. `;
    } else if (courseLevel === 'Masters') {
        insight += `Master's students typically get approved for $50,000-$100,000. `;
    }

    insight += `Based on your profile, I found 3 perfect matches!`;

    return insight;
}

function getRecommendedLoans(data) {
    const destination = data.studyDestination || 'USA';

    const loanDatabase = {
        'USA': [
            {
                name: 'Prodigy Finance',
                rate: '9.95% - 14.25%',
                amount: '$150,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'No cosigner needed'
            },
            {
                name: 'MPower Financing',
                rate: '10.48% - 12.99%',
                amount: '$50,000/year',
                time: '10-20 days',
                collateral: 'None',
                highlight: 'Build US credit score'
            },
            {
                name: 'Discover Student Loans',
                rate: '7.99% - 14.99%',
                amount: '$100,000/year',
                time: '15-30 days',
                collateral: 'US co-signer',
                highlight: 'Competitive rates'
            }
        ],
        'UK': [
            {
                name: 'Future Finance',
                rate: '9.9% - 11.9%',
                amount: '£40,000',
                time: '5-10 days',
                collateral: 'None',
                highlight: 'No UK guarantor needed'
            },
            {
                name: 'Prodigy Finance',
                rate: '9.50% - 13.75%',
                amount: '£100,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'Alumni-funded'
            }
        ],
        'Canada': [
            {
                name: 'CIBC Student Loan',
                rate: 'Prime + 1.00%',
                amount: 'CAD 100,000',
                time: '10-15 days',
                collateral: 'Canadian co-signer',
                highlight: 'Flexible withdrawal'
            },
            {
                name: 'MPower Financing',
                rate: '10.48% - 12.99%',
                amount: 'CAD 60,000/year',
                time: '10-20 days',
                collateral: 'None',
                highlight: 'No cosigner needed'
            }
        ],
        'Australia': [
            {
                name: 'Prodigy Finance',
                rate: '9.75% - 14.00%',
                amount: 'AUD 120,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'No local guarantor'
            }
        ]
    };

    return loanDatabase[destination] || loanDatabase['USA'];
}

// Action handlers
function applyForLoan() {
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    window.location.href = 'apply-loan.html';
}

function compareAllLoans() {
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    window.location.href = 'compare-loans.html';
}

function talkToExpert() {
    window.location.href = 'contact.html';
}

function saveToDashboard() {
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    localStorage.setItem('onboardingComplete', 'true');
    window.location.href = 'dashboard.html';
}

function skipOnboarding() {
    if (confirm('Are you sure you want to skip the onboarding? You can always complete it later.')) {
        localStorage.setItem('onboardingSkipped', 'true');
        window.location.href = 'index.html';
    }
}