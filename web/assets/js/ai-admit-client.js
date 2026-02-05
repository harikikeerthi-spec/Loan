/**
 * AI Admission Predictor Client
 * Handles interactions for the Admit Predictor page
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admitPredictorForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect Form Data
            const formData = {
                targetUniversity: document.getElementById('targetUniversity').value,
                programLevel: document.getElementById('programLevel').value,
                gpa: parseFloat(document.getElementById('gpa').value),
                gpaScale: parseInt(document.getElementById('gpaScale').value),
                testScoreType: document.getElementById('testScoreType').value,
                testScore: parseFloat(document.getElementById('testScore').value) || 0,
                englishTestType: document.getElementById('englishTestType').value,
                englishTestScore: parseFloat(document.getElementById('englishTestScore').value) || 0,
                experienceYears: parseFloat(document.getElementById('experienceYears').value) || 0,
                researchPapers: parseInt(document.getElementById('researchPapers').value) || 0
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                // Set loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Analyzing...';

                // Call API
                const result = await AI_API.predictAdmission(formData);

                // Show Results
                displayResults(result);

            } catch (error) {
                console.error('Prediction failed:', error);
                alert('An error occurred while predicting admission chances. Please check console for details.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Dynamic field handling
    const testScoreType = document.getElementById('testScoreType');
    if (testScoreType) {
        testScoreType.addEventListener('change', (e) => {
            const input = document.getElementById('testScore');
            if (e.target.value === 'None') {
                input.disabled = true;
                input.value = '';
                input.placeholder = 'Not Required';
            } else {
                input.disabled = false;
                input.placeholder = `Enter ${e.target.value} Score`;
            }
        });
    }

    const englishTestType = document.getElementById('englishTestType');
    if (englishTestType) {
        englishTestType.addEventListener('change', (e) => {
            const input = document.getElementById('englishTestScore');
            if (e.target.value === 'None') {
                input.disabled = true;
                input.value = '';
                input.placeholder = 'Not Required';
            } else {
                input.disabled = false;
                input.placeholder = `Enter ${e.target.value} Score`;
            }
        });
    }
});

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const placeholder = document.getElementById('resultsPlaceholder');
    const probabilityText = document.getElementById('probabilityText');
    const probabilityRing = document.getElementById('probabilityRing');
    const uniNameResult = document.getElementById('uniNameResult');
    const feedbackList = document.getElementById('feedbackList');

    if (!data || !data.prediction) return;

    const prediction = data.prediction;

    // Toggle Visibility
    placeholder.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Update Text info
    uniNameResult.textContent = prediction.university;

    // Animate Ring
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    probabilityRing.style.strokeDasharray = `${circumference} ${circumference}`;

    // Reset to 0 first for animation effect
    probabilityRing.style.strokeDashoffset = circumference;
    probabilityText.textContent = '0%';

    // Trigger animation frame
    setTimeout(() => {
        const offset = circumference - (prediction.probability / 100) * circumference;
        probabilityRing.style.strokeDashoffset = offset;

        // Color coding
        if (prediction.probability >= 70) {
            probabilityRing.classList.remove('text-red-500', 'text-yellow-500');
            probabilityRing.classList.add('text-primary'); // Greenish/Purple
        } else if (prediction.probability >= 40) {
            probabilityRing.classList.remove('text-primary', 'text-red-500');
            probabilityRing.classList.add('text-yellow-500');
        } else {
            probabilityRing.classList.remove('text-primary', 'text-yellow-500');
            probabilityRing.classList.add('text-red-500');
        }

        // Animate counter
        let current = 0;
        const interval = setInterval(() => {
            if (current >= prediction.probability) {
                clearInterval(interval);
                probabilityText.textContent = `${prediction.probability}%`;
            } else {
                current++;
                probabilityText.textContent = `${current}%`;
            }
        }, 10);
    }, 100);

    // Populate feedback
    feedbackList.innerHTML = '';

    if (prediction.feedback && prediction.feedback.length > 0) {
        prediction.feedback.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2';
            li.innerHTML = `
                <span class="material-symbols-outlined text-base text-yellow-500 mt-0.5 flex-shrink-0">lightbulb</span>
                <span>${item}</span>
            `;
            feedbackList.appendChild(li);
        });
    } else {
        feedbackList.innerHTML = `<li class="text-green-600">Your profile is very competitive for this university!</li>`;
    }
}
