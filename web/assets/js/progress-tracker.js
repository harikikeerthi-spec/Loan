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
                estimatedDays: 1,
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

        this.currentStage = -1; // -1 means no active application
        this.applicationDate = null;
        this.init();
    }

    init() {
        // Initial dry run (might be empty if dashboard data isn't loaded yet)
        this.render();
    }

    // Called by dashboard.js when data is ready
    updateFromDashboardData(dashboardData) {
        if (!dashboardData || !dashboardData.applications || dashboardData.applications.length === 0) {
            this.currentStage = -1;
            this.render();
            return;
        }

        // Get the most recent active application
        // Filter out rejected ones if we only want to track progress of active ones
        // Or if the latest one is rejected, show that. 
        // For now, let's take the very latest application by date.
        const apps = [...dashboardData.applications].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestApp = apps[0];

        if (latestApp.status === 'rejected') {
            this.currentStage = -1; // Or handle rejected state specifically
            this.applicationDate = latestApp.date;
            this.renderRejected(latestApp); // Special render for rejected
            return;
        }

        this.applicationDate = latestApp.date;

        // Determine Stage
        let stage = 0; // Default: Application Submitted

        // Check Documents (If status is pending but docs are uploaded, move to stage 1)
        const docs = dashboardData.documents || {};
        const uploadedCount = Object.values(docs).filter(d => d.uploaded).length;
        const totalDocs = Object.keys(docs).length; // 6 documents

        // Logic:
        // 0: Pending status
        // 1: Pending status + >0 documents uploaded (or maybe >50%?) -> Let's say > 0 for now to show progress
        // 2: Processing status
        // 3: Approved status
        // 4: Disbursed status (custom status, or if approved + some flag?)

        if (latestApp.status === 'pending') {
            if (uploadedCount > 0) {
                stage = 1; // Documents Uploaded (Partial or Full)
            } else {
                stage = 0; // Application Submitted
            }
        } else if (latestApp.status === 'processing') {
            stage = 2; // Under Review
        } else if (latestApp.status === 'approved') {
            stage = 3; // Sanctioned
        } else if (latestApp.status === 'disbursed') {
            stage = 4; // Disbursed
        }

        this.currentStage = stage;
        this.render();
    }

    render() {
        if (this.currentStage === -1 && !document.getElementById('rejectedInfo')) {
            // No active application
            this.resetUI();
            return;
        }

        this.updateProgressBar();
        this.updateSteps();
        this.updateStatusInfo();
        this.updatePercentage();
    }

    resetUI() {
        const progressLine = document.getElementById('progressLine');
        const progressPercentage = document.getElementById('progressPercentage');
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        if (progressLine) progressLine.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';

        if (currentStatusIcon) currentStatusIcon.textContent = 'hourglass_empty';
        if (currentStatusText) currentStatusText.textContent = 'No active applications';
        if (currentStatusSubtext) currentStatusSubtext.textContent = 'Start a new application to track your progress';

        // Reset steps
        this.stages.forEach(stage => {
            const stepElement = document.getElementById(stage.id);
            if (stepElement) {
                const circle = stepElement.querySelector('.step-circle');
                const label = stepElement.querySelector('span:last-child');

                circle.className = 'step-circle w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 transition-all duration-300 z-10';
                label.className = 'mt-3 text-xs font-bold text-gray-500 dark:text-gray-400 text-center';
            }
        });
    }

    renderRejected(app) {
        this.resetUI();
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        if (currentStatusIcon) {
            currentStatusIcon.textContent = 'cancel';
            currentStatusIcon.classList.remove('text-primary');
            currentStatusIcon.classList.add('text-red-500');
        }
        if (currentStatusText) currentStatusText.textContent = 'Application Rejected';
        if (currentStatusSubtext) currentStatusSubtext.textContent = `Your application to ${app.bank} was rejected.`;
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

            // Reset base classes first
            circle.className = 'step-circle w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10';
            label.className = 'mt-3 text-xs font-bold text-center';

            if (index < this.currentStage) {
                // Completed steps
                circle.classList.add('bg-green-500', 'text-white');
                label.classList.add('text-green-600', 'dark:text-green-400');
            } else if (index === this.currentStage) {
                // Current step
                circle.classList.add('bg-primary', 'text-white', 'animate-pulse');
                label.classList.add('text-primary');
            } else {
                // Future steps
                circle.classList.add('bg-gray-200', 'dark:bg-white/10', 'text-gray-400', 'dark:text-gray-500');
                label.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        });
    }

    updateStatusInfo() {
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        if (!currentStatusIcon || !currentStatusText || !currentStatusSubtext) return;

        // Reset icon color
        currentStatusIcon.classList.remove('text-red-500');
        currentStatusIcon.classList.add('text-primary');

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
        if (!this.applicationDate || stageIndex === 0) return 'Soon';

        const applicationDate = new Date(this.applicationDate);
        const estimatedDays = this.stages[stageIndex].estimatedDays;
        const estimatedDate = new Date(applicationDate);
        estimatedDate.setDate(applicationDate.getDate() + estimatedDays);

        return estimatedDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    }
}

// Create singleton instance
const progressTracker = new ProgressTracker();

// Export for use in other scripts
window.progressTracker = progressTracker;

