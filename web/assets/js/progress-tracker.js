// Application Progress Tracker System
// Enhanced visual timeline with dynamic data injection

class ProgressTracker {
    constructor() {
        // Define stages matching backend application.service.ts
        this.stagesConfig = {
            application_submitted: { order: 1, label: 'Application<br>Submitted', icon: 'description', progress: 10 },
            document_verification: { order: 2, label: 'Document<br>Verification', icon: 'upload_file', progress: 30 },
            credit_check: { order: 3, label: 'Credit<br>Check', icon: 'analytics', progress: 50 },
            bank_review: { order: 4, label: 'Bank<br>Review', icon: 'rate_review', progress: 70 },
            sanction: { order: 5, label: 'Loan<br>Sanctioned', icon: 'verified', progress: 90 },
            disbursement: { order: 6, label: 'Amount<br>Disbursed', icon: 'payments', progress: 100 },
        };

        this.stages = Object.entries(this.stagesConfig)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, value]) => ({ id: key, ...value }));

        this.currentStageKey = null;
        this.applicationDate = null;
        this.init();
    }

    init() {
        this.renderSteps(); // Render the empty steps structure first
        this.updateUI();    // Update with default/empty state
    }

    // Called by dashboard.js when data is ready
    updateFromDashboardData(dashboardData) {
        if (!dashboardData || !dashboardData.applications || dashboardData.applications.length === 0) {
            this.currentStageKey = null;
            this.updateUI();
            return;
        }

        // Get the most recent active application
        const apps = [...dashboardData.applications].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestApp = apps[0];

        if (latestApp.status === 'rejected' || latestApp.status === 'cancelled') {
            this.currentStageKey = null;
            this.applicationDate = latestApp.date;
            this.renderRejected(latestApp);
            return;
        }

        this.applicationDate = latestApp.date;

        // Map backend stage to our keys
        // If stage is missing (legacy data), infer from status
        let stageKey = latestApp.stage;

        if (!stageKey || !this.stagesConfig[stageKey]) {
            stageKey = this.inferStageFromStatus(latestApp.status, dashboardData.documents);
        }

        this.currentStageKey = stageKey;
        this.updateUI();
    }

    inferStageFromStatus(status, documents) {
        // Fallback logic if 'stage' field is missing from API
        if (status === 'approved') return 'sanction';
        if (status === 'disbursed') return 'disbursement';

        // For processing, check documents
        const docs = documents || {};
        const uploadedCount = Object.values(docs).filter(d => d.uploaded).length;

        if (status === 'processing') return 'bank_review';

        if (uploadedCount > 0) return 'document_verification';

        return 'application_submitted';
    }

    renderSteps() {
        const container = document.getElementById('progressSteps');
        if (!container) return;

        const totalSteps = this.stages.length;

        container.innerHTML = this.stages.map((stage, index) => {
            // Only show labels for first, last, and current/active steps on small screens to avoid clutter
            // On md+ screens, show all
            return `
            <div class="flex flex-col items-center relative" id="step-${stage.id}" style="width: ${100 / totalSteps}%">
                <div class="step-circle w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 transition-all duration-300 z-10 relative group border-2 border-transparent">
                    <span class="material-symbols-outlined text-lg md:text-xl">${stage.icon}</span>
                    <!-- Tooltip -->
                    <div class="absolute bottom-full mb-2 bg-gray-800 text-white text-[10px] rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                        ${stage.label.replace('<br>', ' ')}
                    </div>
                </div>
                <span class="mt-2 md:mt-3 text-[9px] md:text-xs font-bold text-gray-500 dark:text-gray-400 text-center leading-tight">
                    ${stage.label}
                </span>
            </div>
        `}).join('');
    }

    updateUI() {
        // If no active stage, reset UI
        if (!this.currentStageKey) {
            // If checking for rejected handled in updateFromDashboardData, we might be here if no apps at all
            if (!document.getElementById('rejectedInfo')) {
                this.resetUI();
            }
            return;
        }

        this.updateProgressBar();
        this.updateStepStyles();
        this.updateStatusInfo();
        this.updatePercentage();
    }

    resetUI() {
        const progressLine = document.getElementById('progressLine');
        const progressPercentage = document.getElementById('progressPercentage');
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        // Reset Info Box style to default
        const infoDiv = document.getElementById('rejectedInfo') || document.getElementById('currentStatusInfo');
        if (infoDiv) {
            infoDiv.id = 'currentStatusInfo';
            infoDiv.className = 'mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center gap-4 transition-all hover:bg-primary/10';
        }

        if (progressLine) progressLine.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';

        if (currentStatusIcon) {
            currentStatusIcon.textContent = 'hourglass_empty';
            currentStatusIcon.className = 'material-symbols-outlined text-primary text-3xl';
        }
        if (currentStatusText) {
            currentStatusText.textContent = 'No active applications';
            currentStatusText.className = 'font-bold text-gray-900 dark:text-white';
        }
        if (currentStatusSubtext) currentStatusSubtext.textContent = 'Start a new application to track your progress';

        // Reset steps
        this.stages.forEach(stage => {
            const stepElement = document.getElementById(`step-${stage.id}`);
            if (stepElement) {
                const circle = stepElement.querySelector('.step-circle');
                const label = stepElement.querySelector('span:last-child');

                if (circle) circle.className = 'step-circle w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 transition-all duration-300 z-10 relative group border-2 border-transparent';
                if (label) label.className = 'mt-2 md:mt-3 text-[9px] md:text-xs font-bold text-gray-500 dark:text-gray-400 text-center leading-tight';
            }
        });
    }

    renderRejected(app) {
        this.resetUI(); // Clear active styles first

        const infoDiv = document.getElementById('currentStatusInfo');
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        if (infoDiv) {
            infoDiv.id = 'rejectedInfo'; // Mark as rejected state
            infoDiv.className = 'mt-8 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center gap-4 border border-red-100 dark:border-red-900/30';
        }

        if (currentStatusIcon) {
            currentStatusIcon.textContent = app.status === 'cancelled' ? 'cancel_schedule_send' : 'cancel';
            currentStatusIcon.className = 'material-symbols-outlined text-red-500 text-3xl scale-125';
        }

        if (currentStatusText) {
            currentStatusText.textContent = app.status === 'cancelled' ? 'Application Cancelled' : 'Application Rejected';
            currentStatusText.className = 'font-bold text-red-700 dark:text-red-400 text-lg';
        }

        if (currentStatusSubtext) {
            currentStatusSubtext.textContent = `Your ${app.bank} application was ${app.status}.`;
            currentStatusSubtext.className = 'text-sm text-red-600 dark:text-red-300';
        }
    }

    updateProgressBar() {
        const progressLine = document.getElementById('progressLine');
        if (!progressLine || !this.currentStageKey) return;

        const currentStageData = this.stagesConfig[this.currentStageKey];
        if (currentStageData) {
            // Animate width
            requestAnimationFrame(() => {
                progressLine.style.width = `${currentStageData.progress}%`;
            });
        }
    }

    updateStepStyles() {
        if (!this.currentStageKey) return;

        const currentOrder = this.stagesConfig[this.currentStageKey].order;

        this.stages.forEach(stage => {
            const stepElement = document.getElementById(`step-${stage.id}`);
            if (!stepElement) return;

            const circle = stepElement.querySelector('.step-circle');
            const label = stepElement.querySelector('span:last-child');
            const icon = stepElement.querySelector('.material-symbols-outlined');

            // Base classes
            let circleClass = 'step-circle w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10 relative group ';
            let labelClass = 'mt-2 md:mt-3 text-[9px] md:text-xs font-bold text-center leading-tight transition-colors duration-300 ';
            let iconClass = 'material-symbols-outlined text-lg md:text-xl transition-transform duration-300 ';

            if (stage.order < currentOrder) {
                // Completed steps
                circleClass += 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-100 border-2 border-green-400';
                labelClass += 'text-green-600 dark:text-green-400';
            } else if (stage.id === this.currentStageKey) {
                // Current step
                circleClass += 'bg-white dark:bg-zinc-800 text-primary border-2 border-primary shadow-[0_0_15px_rgba(102,5,199,0.4)] scale-110 z-20';
                labelClass += 'text-primary';
                iconClass += 'animate-pulse scale-110';
            } else {
                // Future steps
                circleClass += 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 border-2 border-transparent';
                labelClass += 'text-gray-300 dark:text-gray-600';
            }

            if (circle) circle.className = circleClass;
            if (label) label.className = labelClass;
            if (icon) icon.className = iconClass;
        });
    }

    updateStatusInfo() {
        const currentStatusIcon = document.getElementById('currentStatusIcon');
        const currentStatusText = document.getElementById('currentStatusText');
        const currentStatusSubtext = document.getElementById('currentStatusSubtext');

        // Handle recovery from rejected state
        const infoDiv = document.getElementById('rejectedInfo');
        if (infoDiv) {
            infoDiv.id = 'currentStatusInfo';
            infoDiv.className = 'mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center gap-4 transition-all hover:bg-primary/10';
        }

        if (!currentStatusIcon || !currentStatusText || !currentStatusSubtext) return;

        const stage = this.stagesConfig[this.currentStageKey];
        if (!stage) return;

        currentStatusIcon.textContent = stage.icon;
        currentStatusIcon.className = 'material-symbols-outlined text-primary text-3xl';

        currentStatusText.textContent = stage.label.replace('<br>', ' ');
        currentStatusText.className = 'font-bold text-gray-900 dark:text-white text-lg';

        // Calculate estimated completion date
        const estimatedDate = this.getEstimatedDate(stage.order);

        currentStatusSubtext.innerHTML = `
            <span class="block sm:inline">Current Stage: <span class="text-primary font-bold">${stage.label.replace('<br>', ' ')}</span></span>
            <span class="hidden sm:inline mx-2">•</span>
            <span class="block sm:inline text-xs mt-1 sm:mt-0 opacity-80">Est. Completion: ${estimatedDate}</span>
        `;
        currentStatusSubtext.className = 'text-sm text-gray-500 dark:text-gray-400';
    }

    updatePercentage() {
        const progressPercentage = document.getElementById('progressPercentage');
        if (!progressPercentage || !this.currentStageKey) return;

        const percentage = this.stagesConfig[this.currentStageKey].progress;

        // Animate the number
        const start = parseInt(progressPercentage.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (percentage - start) * ease);
            progressPercentage.textContent = `${current}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    getEstimatedDate(stageOrder) {
        if (!this.applicationDate) return 'Soon';

        // Date calculation
        const appDate = new Date(this.applicationDate);
        if (isNaN(appDate.getTime())) return 'Soon';

        // Add 14 days total roughly
        const totalDuration = 14;
        const date = new Date(appDate);
        date.setDate(appDate.getDate() + totalDuration);

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    }
}

// Create singleton instance
const progressTracker = new ProgressTracker();

// Export for use in other scripts
window.progressTracker = progressTracker;
