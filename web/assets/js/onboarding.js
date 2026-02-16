// Conversational Onboarding Flow
const API_BASE_URL = 'http://localhost:3000';

// Onboarding state
const onboardingData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    studyDestination: '',
    courseLevel: '',
    courseName: '',
    university: '',
    intakeYear: '',
    intakeSeason: '',
    estimatedCost: '',
    currentEducation: '',
    workExperience: ''
};

let currentStep = 0;
let totalSteps = 13;

// Conversation flow definition - Simplified approach
const conversationFlow = [
    {
        id: 'welcome',
        botMessage: "Welcome! 👋 Let's find the perfect education loan for you.",
        type: 'auto',
        action: () => {
            setTimeout(() => nextStep(), 1000);
        }
    },
    {
        id: 'goal',
        botMessage: "How can we support you with your study abroad plans?",
        type: 'options',
        field: 'goal',
        options: [
            { text: "📚 Help me plan my education", value: 'plan' },
            { text: "💰 Need help with an education loan", value: 'loan' },
            { text: "🎓 Evaluate my shortlisted universities", value: 'evaluate' }
        ]
    },
    {
        id: 'essentials',
        botMessage: "Great! Let's start with what's most important to you:",
        type: 'auto',
        action: () => {
            setTimeout(() => nextStep(), 800);
        }
    },
    {
        id: 'studyDestination',
        botMessage: "📍 Which country are you planning to study in?",
        type: 'quick-picks',
        field: 'studyDestination',
        quickPicks: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Ireland'],
        allowCustom: true,
        placeholder: "Or type another country..."
    },
    {
        id: 'courseLevel',
        botMessage: "🎓 What level of study?",
        type: 'options',
        field: 'courseLevel',
        options: [
            { text: "Bachelor's", value: 'Bachelors' },
            { text: "Master's", value: 'Masters' },
            { text: "MBA", value: 'MBA' },
            { text: "PhD", value: 'PhD' }
        ]
    },
    {
        id: 'courseName',
        botMessage: "📖 Field of study?",
        type: 'quick-picks',
        field: 'courseName',
        quickPicks: ['Computer Science', 'Business', 'Engineering', 'Data Science', 'Medicine', 'Law'],
        allowCustom: true,
        placeholder: "Type your field..."
    },
    {
        id: 'intakeSeason',
        botMessage: "📅 When are you planning to start?",
        type: 'options',
        field: 'intakeSeason',
        options: [
            { text: "Fall 2026", value: 'Fall 2026' },
            { text: "Spring 2027", value: 'Spring 2027' },
            { text: "Fall 2027", value: 'Fall 2027' },
            { text: "Not sure yet", value: 'Undecided' }
        ]
    },
    {
        id: 'contactInfo',
        botMessage: "Perfect! Just need your contact details to save your plan:",
        type: 'auto',
        action: () => {
            setTimeout(() => nextStep(), 800);
        }
    },
    {
        id: 'firstName',
        botMessage: "What's your name?",
        type: 'text',
        field: 'firstName',
        validation: (value) => value.length >= 2,
        errorMessage: "Please enter your name",
        placeholder: "Your first name"
    },
    {
        id: 'email',
        botMessage: "And your email?",
        type: 'text',
        field: 'email',
        validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        errorMessage: "Please enter a valid email",
        placeholder: "your.email@example.com"
    },
    {
        id: 'phone',
        botMessage: "Phone number? (We'll only send important updates)",
        type: 'text',
        field: 'phone',
        validation: (value) => /^[0-9]{10}$/.test(value.replace(/\D/g, '')),
        errorMessage: "Please enter a valid 10-digit number",
        placeholder: "1234567890"
    },
    {
        id: 'completion',
        botMessage: (data) => `Perfect, ${data.firstName}! 🎉 Let me analyze your profile and find the best loan options...`,
        type: 'auto',
        action: async () => {
            await saveOnboardingData();
            setTimeout(() => nextStep(), 1500);
        }
    },
    {
        id: 'aiAnalysis',
        botMessage: (data) => generateAIInsights(data),
        type: 'auto',
        action: () => {
            setTimeout(() => nextStep(), 3000);
        }
    },
    {
        id: 'recommendations',
        botMessage: (data) => {
            const loans = getRecommendedLoans(data);
            return formatLoanRecommendations(loans, data);
        },
        type: 'auto',
        action: () => {
            setTimeout(() => {
                showFinalOptions();
            }, 2000);
        }
    }
];

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const textInputWrapper = document.getElementById('textInputWrapper');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const optionsContainer = document.getElementById('optionsContainer');
const quickPicks = document.getElementById('quickPicks');
const typingIndicator = document.getElementById('typingIndicator');
const progressBar = document.getElementById('progressBar');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startOnboarding();
});

function startOnboarding() {
    // Add welcome message
    setTimeout(() => {
        showStep(currentStep);
    }, 500);
}

function showStep(stepIndex) {
    const step = conversationFlow[stepIndex];
    if (!step) return;

    updateProgress();

    // Show bot message
    if (typeof step.botMessage === 'function') {
        addBotMessage(step.botMessage(onboardingData));
    } else {
        addBotMessage(step.botMessage);
    }

    // Show appropriate input type
    setTimeout(() => {
        if (step.type === 'text') {
            showTextInput(step.placeholder || 'Type your answer...');
        } else if (step.type === 'options') {
            showOptions(step.options);
        } else if (step.type === 'quick-picks') {
            showQuickPicks(step.quickPicks, step.allowCustom, step.placeholder);
        } else if (step.type === 'auto') {
            if (step.action) {
                step.action();
            } else {
                nextStep();
            }
        }
    }, 1000);
}

function addBotMessage(text) {
    showTyping();

    setTimeout(() => {
        hideTyping();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <span class="material-symbols-rounded">smart_toy</span>
            </div>
            <div class="message-content">${text}</div>
        `;

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }, 1000 + Math.random() * 500);
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-content">${text}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTyping() {
    typingIndicator.classList.add('active');
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.classList.remove('active');
}

function showTextInput(placeholder = 'Type your answer...') {
    hideAllInputs();
    textInputWrapper.classList.add('active');
    textInput.placeholder = placeholder;
    textInput.value = '';
    textInput.focus();

    // Remove old event listeners
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    newSendBtn.addEventListener('click', handleTextSubmit);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleTextSubmit();
        }
    });
}

function showOptions(options) {
    hideAllInputs();
    optionsContainer.classList.add('active');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.text;
        btn.onclick = () => handleOptionSelect(option.value, option.text);
        optionsContainer.appendChild(btn);
    });
}

function showQuickPicks(picks, allowCustom = false, placeholder = 'Or type your own...') {
    hideAllInputs();
    quickPicks.classList.add('active');
    quickPicks.innerHTML = '';

    picks.forEach(pick => {
        const chip = document.createElement('button');
        chip.className = 'quick-pick-chip';
        chip.textContent = pick;
        chip.onclick = () => handleQuickPickSelect(pick);
        quickPicks.appendChild(chip);
    });

    if (allowCustom) {
        setTimeout(() => showTextInput(placeholder), 100);
    }
}

function handleTextSubmit() {
    const value = textInput.value.trim();
    const step = conversationFlow[currentStep];

    if (!value) return;

    // Validate
    if (step.validation && !step.validation(value)) {
        showError(step.errorMessage || 'Invalid input. Please try again.');
        return;
    }

    addUserMessage(value);

    if (step.field) {
        onboardingData[step.field] = value;
    }

    textInput.value = '';
    hideAllInputs();

    setTimeout(() => nextStep(), 500);
}

function handleOptionSelect(value, text) {
    const step = conversationFlow[currentStep];

    addUserMessage(text);

    if (step.field) {
        onboardingData[step.field] = value;
    }

    hideAllInputs();

    if (step.onSelect) {
        step.onSelect(value);
    } else {
        setTimeout(() => nextStep(), 500);
    }
}

function handleQuickPickSelect(value) {
    const step = conversationFlow[currentStep];

    addUserMessage(value);

    if (step.field) {
        onboardingData[step.field] = value;
    }

    hideAllInputs();
    setTimeout(() => nextStep(), 500);
}

function hideAllInputs() {
    textInputWrapper.classList.remove('active');
    optionsContainer.classList.remove('active');
    quickPicks.classList.remove('active');
}

function nextStep() {
    currentStep++;
    if (currentStep < conversationFlow.length) {
        setTimeout(() => showStep(currentStep), 800);
    }
}

function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    progressBar.style.width = progress + '%';
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot';
    errorDiv.innerHTML = `
        <div class="bot-avatar">
            <span class="material-symbols-rounded">error</span>
        </div>
        <div class="message-content" style="background: #fee; color: #c33;">
            ${message}
        </div>
    `;

    chatMessages.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
    scrollToBottom();
}

async function saveOnboardingData() {
    try {
        const token = localStorage.getItem('accessToken');

        // Save onboarding data to localStorage
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('firstName', onboardingData.firstName);

        const response = await fetch(`${API_BASE_URL}/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(onboardingData)
        });

        if (response.ok) {
            const result = await response.json();
            // Mark onboarding as complete
            localStorage.setItem('onboardingComplete', 'true');
            console.log('Onboarding data saved successfully');
        } else {
            console.warn('Failed to save to backend, but continuing with flow');
        }
    } catch (error) {
        console.error('Error saving onboarding:', error);
        // Still save to localStorage
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('firstName', onboardingData.firstName);
    }
    // Don't redirect - continue with AI analysis in the conversational flow
}

// AI-Powered Recommendation Functions
function generateAIInsights(data) {
    const { studyDestination, courseLevel, courseName } = data;

    let insight = `🤖 **AI Analysis Complete!**\n\n`;

    // Destination-specific insights
    if (studyDestination === 'USA') {
        insight += `For ${courseName || 'your field'} in the USA, typical costs are $50,000-$80,000/year. `;
        insight += `Great news! You qualify for no-cosigner loans from top lenders. `;
    } else if (studyDestination === 'UK') {
        insight += `${courseLevel} programs in the UK typically cost £20,000-£35,000/year. `;
        insight += `Multiple UK lenders offer loans without requiring a UK guarantor. `;
    } else if (studyDestination === 'Canada') {
        insight += `Studying in Canada costs CAD 20,000-40,000/year. `;
        insight += `Both Canadian banks and international lenders have excellent options for you. `;
    } else {
        insight += `Studying ${courseName || 'your field'} abroad is a fantastic investment! `;
    }

    // Course level insights
    if (courseLevel === 'MBA') {
        insight += `MBA programs often qualify for up to $150,000 in financing. `;
    } else if (courseLevel === 'Masters') {
        insight += `Master's students typically get approved for $50,000-$100,000. `;
    }

    insight += `\n\nBased on your profile, I found 3 perfect matches! 🎯`;

    return insight;
}

function getRecommendedLoans(data) {
    const destination = data.studyDestination || 'USA';
    const courseLevel = data.courseLevel || 'Masters';

    const loanDatabase = {
        'USA': [
            {
                name: 'Prodigy Finance',
                rate: '9.95% - 14.25%',
                amount: '$150,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'No cosigner needed',
                score: 4.7
            },
            {
                name: 'MPower Financing',
                rate: '10.48% - 12.99%',
                amount: '$50,000/year',
                time: '10-20 days',
                collateral: 'None',
                highlight: 'Build US credit score',
                score: 4.3
            },
            {
                name: 'Discover Student Loans',
                rate: '7.99% - 14.99%',
                amount: '$100,000/year',
                time: '15-30 days',
                collateral: 'US co-signer',
                highlight: 'Competitive rates',
                score: 4.5
            }
        ],
        'UK': [
            {
                name: 'Future Finance',
                rate: '9.9% - 11.9%',
                amount: '£40,000',
                time: '5-10 days',
                collateral: 'None',
                highlight: 'No UK guarantor needed',
                score: 4.6
            },
            {
                name: 'Prodigy Finance',
                rate: '9.50% - 13.75%',
                amount: '£100,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'Alumni-funded',
                score: 4.7
            },
            {
                name: 'Lendwise',
                rate: '7.9% - 11.9%',
                amount: '£25,000',
                time: '3-7 days',
                collateral: 'None',
                highlight: 'Fast approval',
                score: 4.4
            }
        ],
        'Canada': [
            {
                name: 'CIBC Student Loan',
                rate: 'Prime + 1.00%',
                amount: 'CAD 100,000',
                time: '10-15 days',
                collateral: 'Canadian co-signer',
                highlight: 'Flexible withdrawal',
                score: 4.3
            },
            {
                name: 'MPower Financing',
                rate: '10.48% - 12.99%',
                amount: 'CAD 60,000/year',
                time: '10-20 days',
                collateral: 'None',
                highlight: 'No cosigner needed',
                score: 4.3
            }
        ],
        'Australia': [
            {
                name: 'Prodigy Finance',
                rate: '9.75% - 14.00%',
                amount: 'AUD 120,000',
                time: '7-14 days',
                collateral: 'None',
                highlight: 'No local guarantor',
                score: 4.7
            }
        ]
    };

    let loans = loanDatabase[destination] || loanDatabase['USA'];

    // Score loans based on suitability
    loans = loans.map(loan => ({
        ...loan,
        suitability: loan.score + (loan.collateral === 'None' ? 0.5 : 0)
    }));

    loans.sort((a, b) => b.suitability - a.suitability);
    return loans.slice(0, 3);
}

function formatLoanRecommendations(loans, data) {
    let message = `📊 **Top 3 Loan Recommendations for You:**\n\n`;

    loans.forEach((loan, index) => {
        const stars = '⭐'.repeat(Math.floor(loan.score));
        message += `**${index + 1}. ${loan.name}** ${index === 0 ? '✨ RECOMMENDED' : ''}\n`;
        message += `${stars} (${loan.score}/5.0)\n`;
        message += `💰 Amount: ${loan.amount}\n`;
        message += `📈 Interest: ${loan.rate}\n`;
        message += `⏱️ Processing: ${loan.time}\n`;
        message += `🔒 Collateral: ${loan.collateral}\n`;
        message += `✨ ${loan.highlight}\n\n`;
    });

    message += `\n💡 **What would you like to do next?**`;
    return message;
}

function showFinalOptions() {
    hideAllInputs();

    const optionsHtml = `
        <div class="final-options" style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
            <button onclick="applyForLoan()" class="option-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 12px; font-weight: bold; border: none; cursor: pointer;">
                🚀 Apply for Recommended Loan
            </button>
            <button onclick="compareAllLoans()" class="option-btn" style="background: white; color: #667eea; padding: 16px; border-radius: 12px; font-weight: bold; border: 2px solid #667eea; cursor: pointer;">
                📊 Compare All Options
            </button>
            <button onclick="talkToExpert()" class="option-btn" style="background: white; color: #667eea; padding: 16px; border-radius: 12px; font-weight: bold; border: 2px solid #667eea; cursor: pointer;">
                👨‍💼 Talk to an Expert
            </button>
            <button onclick="saveToDashboard()" class="option-btn" style="background: transparent; color: #666; padding: 12px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; text-decoration: underline;">
                💾 Save and Continue Later
            </button>
        </div>
    `;

    optionsContainer.innerHTML = optionsHtml;
    optionsContainer.classList.add('active');
    scrollToBottom();
}

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
