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
let totalSteps = 11;

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
        botMessage: (data) => `All set, ${data.firstName}! 🎉 Let me find the best loan options for you...`,
        type: 'auto',
        action: async () => {
            await saveOnboardingData();
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

        // Save onboarding data to localStorage for recommendations page
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

            // Show success message
            addBotMessage("Perfect! 🎉 Let me show you the best loan options...");

            setTimeout(() => {
                window.location.href = 'loan-recommendations.html';
            }, 2000);
        } else {
            throw new Error('Failed to save onboarding data');
        }
    } catch (error) {
        console.error('Error saving onboarding:', error);
        // Still save to localStorage and show recommendations
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('firstName', onboardingData.firstName);

        addBotMessage("Got it! Let me show you personalized loan options...");
        setTimeout(() => {
            window.location.href = 'loan-recommendations.html';
        }, 2000);
    }
}

function skipOnboarding() {
    if (confirm('Are you sure you want to skip the onboarding? You can always complete it later.')) {
        localStorage.setItem('onboardingSkipped', 'true');
        window.location.href = 'index.html';
    }
}
