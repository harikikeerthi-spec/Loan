// Application Progress Tracker System
// Enhanced visual timeline with estimated completion dates and actions

class ProgressTracker {
    constructor() {
        this.stages = [
            {
                id: 'step1',
                name: 'Application Submitted',
                icon: 'description',
                estimatedDays: 0,
                description: 'Your application has been received'
            },
            {
                id: 'step2',
                name: 'Documents Uploaded',
                icon: 'upload_file',
                estimatedDays: 3,
                description: 'All required documents submitted'
            },
            {
                id: 'step3',
                name: 'Under Review',
                icon: 'rate_review',
                estimatedDays: 7,
                description: 'Bank is reviewing your application'
            },
            {
                id: 'step4',
                name: 'Loan Sanctioned',
                icon: 'verified',
                estimatedDays: 14,
                description: 'Loan approved by the bank'
            },
            {
                id: 'step5',
                name: 'Amount Disbursed',
                icon: 'payments',
                estimatedDays: 21,
                description: 'Funds transferred successfully'
            }
        ];

        this.currentStage = 0;
        this.applicationDate = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadProgress());
        } else {
            this.loadProgress();
        }
    }

    loadProgress() {
        // Load from localStorage or application data
        const savedProgress = localStorage.getItem('applicationProgress');
        if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            this.currentStage = progressData.currentStage || 0;
            this.applicationDate = progressData.applicationDate || new Date().toISOString();
        } else {
            // Check if there are applications in dashboardData
            if (window.dashboardData && window.dashboardData.applications.length > 0) {
                const latestApp = window.dashboardData.applications[0];
                this.currentStage = this.getStageFromStatus(latestApp.status);
                this.applicationDate = latestApp.date || new Date().toISOString();
                this.saveProgress();
            }
        }

        this.render();
    }

    getStageFromStatus(status) {
        const statusMap = {
            'pending': 1,
            'processing': 2,
            'approved': 4,
            'rejected': 0,
            'disbursed': 5
        };
        return statusMap[status] || 0;
    }

    updateStage(stageIndex, saveToStorage = true) {
        this.currentStage = stageIndex;
        if (saveToStorage) {
            this.saveProgress();
        }
        this.render();
    }

    saveProgress() {
        const progressData = {
            currentStage: this.currentStage,
            applicationDate: this.applicationDate || new Date().toISOString()
        };
        localStorage.setItem('applicationProgress', JSON.stringify(progressData));
    }

    render() {
        this.updateProgressBar();
        this.updateSteps();
        this.updateStatusInfo();
        this.updatePercentage();
    }

    updateProgressBar() {
        const progressLine = document.getElementById('progressLine');
        if (!progressLine) return;

        const percentage = (this.currentStage / (this.stages.length - 1)) * 100;
        progressLine.style.width = `${percentage}%`;
    }

    updateSteps() {
        this.stages.forEach((stage, index) => {
            const stepElement = document.getElementById(stage.id);
            if (!stepElement) return;

            const circle = stepElement.querySelector('.step-circle');
            const label = stepElement.querySelector('span:last-child');

            if (index < this.currentStage) {
                // Completed steps
                circle.classList.remove('bg-gray-200', 'dark:bg-white/10', 'text-gray-400', 'dark:text-gray-500');
                circle.classList.add('bg-green-500', 'text-white');
                label.classList.remove('text-gray-500', 'dark:text-gray-400');
                label.classList.add('text-green-600', 'dark:text-green-400');
            } else if (index === this.currentStage) {
                // Current step
                circle.classList.remove('bg-gray-200', 'dark:bg-white/10', 'text-gray-400', 'dark:text-gray-500');
                circle.classList.add('bg-primary', 'text-white', 'animate-pulse');
                label.classList.remove('text-gray-500', 'dark:text-gray-400');
                label.classList.add('text-primary', 'font-bold');
            } else {
                // Future steps
                circle.classList.remove('bg-primary', 'bg-green-500', 'text-white', 'animate-pulse');
                circle.classList.add('bg-gray-200', 'dark:bg-white/10', 'text-gray-400', 'dark:text-gray-500');
                label.classList.remove('text-primary', 'text-green-600', 'dark:text-green-400', 'font-bold');
                label.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        });
    }

    updateStatusInfo() {
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        if (!currentStatusIcon || !currentStatusText || !currentStatusSubtext) return;

        if (this.currentStage === 0) {
            currentStatusIcon.textContent = 'hourglass_empty';
            currentStatusText.textContent = 'No active applications';
            currentStatusSubtext.textContent = 'Start a new application to track your progress';
            return;
        }

        const stage = this.stages[this.currentStage];
        currentStatusIcon.textContent = stage.icon;
        currentStatusText.textContent = stage.name;

        // Calculate estimated completion date
        const estimatedDate = this.getEstimatedDate(this.currentStage);
        currentStatusSubtext.textContent = `${stage.description} • Est. completion: ${estimatedDate}`;
    }

    updatePercentage() {
        const progressPercentage = document.getElementById('progressPercentage');
        if (!progressPercentage) return;

        const percentage = Math.round((this.currentStage / (this.stages.length - 1)) * 100);
        progressPercentage.textContent = `${percentage}%`;
    }

    getEstimatedDate(stageIndex) {
        if (!this.applicationDate || stageIndex === 0) return 'N/A';

        const applicationDate = new Date(this.applicationDate);
        const estimatedDays = this.stages[stageIndex].estimatedDays;
        const estimatedDate = new Date(applicationDate);
        estimatedDate.setDate(applicationDate.getDate() + estimatedDays);

        return estimatedDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    // Method to advance to next stage (for testing/demo purposes)
    advanceStage() {
        if (this.currentStage < this.stages.length - 1) {
            this.updateStage(this.currentStage + 1);
            console.log(`Advanced to stage ${this.currentStage}: ${this.stages[this.currentStage].name}`);
        }
    }

    // Method to reset progress
    reset() {
        this.currentStage = 0;
        this.applicationDate = new Date().toISOString();
        this.saveProgress();
        this.render();
    }
}

// Create singleton instance
const progressTracker = new ProgressTracker();

// Export for use in other scripts
window.progressTracker = progressTracker;
