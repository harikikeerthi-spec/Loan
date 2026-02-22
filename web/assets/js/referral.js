/**
 * Referral Page Logic
 * Handles referral code display, sharing, stats, leaderboard, and invites
 */

(function () {
    'use strict';

    const API_URL = 'http://localhost:3000';
    let referralCode = '';
    let referralLink = '';

    // ── DOM Elements ──
    const codeDisplay = document.getElementById('referralCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const copyTooltip = document.getElementById('copyTooltip');
    const linkInput = document.getElementById('referralLinkInput');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const tierBadge = document.getElementById('tierBadge');
    const tierIcon = document.getElementById('tierIcon');
    const tierLabel = document.getElementById('tierLabel');
    const inviteForm = document.getElementById('inviteForm');
    const inviteEmailInput = document.getElementById('inviteEmailInput');
    const inviteBtn = document.getElementById('inviteBtn');
    const inviteStatus = document.getElementById('inviteStatus');
    const ctaCopyBtn = document.getElementById('ctaCopyBtn');

    // Stats Elements
    const statTotal = document.getElementById('statTotal');
    const statCompleted = document.getElementById('statCompleted');
    const statSignedUp = document.getElementById('statSignedUp');
    const statPending = document.getElementById('statPending');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const nextTierName = document.getElementById('nextTierName');
    const progressSection = document.getElementById('progressSection');
    const streakBadge = document.getElementById('streakBadge');
    const streakCount = document.getElementById('streakCount');

    // ── Auth Helper ──
    function getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    // ── Confetti Effect ──
    function launchConfetti() {
        const colors = ['#6605c7', '#e0c389', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.width = (Math.random() * 8 + 5) + 'px';
            confetti.style.height = (Math.random() * 8 + 5) + 'px';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    // ── Animate Counter ──
    function animateCount(element, target) {
        const duration = 1000;
        const start = parseInt(element.textContent) || 0;
        const diff = target - start;
        if (diff === 0) { element.textContent = target; return; }
        const startTime = performance.now();
        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            element.textContent = Math.round(start + diff * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ── Copy to Clipboard ──
    async function copyToClipboard(text, tooltipEl) {
        try {
            await navigator.clipboard.writeText(text);
            if (tooltipEl) {
                tooltipEl.classList.add('show');
                setTimeout(() => tooltipEl.classList.remove('show'), 2000);
            }
            return true;
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            if (tooltipEl) {
                tooltipEl.classList.add('show');
                setTimeout(() => tooltipEl.classList.remove('show'), 2000);
            }
            return true;
        }
    }

    // ── Tier Visuals ──
    const tierConfig = {
        starter: { icon: 'stars', gradient: 'from-gray-400 to-gray-500', label: 'Starter' },
        bronze: { icon: 'workspace_premium', gradient: 'from-amber-600 to-amber-800', label: 'Bronze' },
        silver: { icon: 'military_tech', gradient: 'from-gray-400 to-gray-600', label: 'Silver' },
        gold: { icon: 'diamond', gradient: 'from-yellow-400 to-yellow-600', label: 'Gold' },
        diamond: { icon: 'auto_awesome', gradient: 'from-cyan-300 to-blue-500', label: 'Diamond' },
    };

    function updateTierDisplay(tier) {
        const config = tierConfig[tier] || tierConfig.starter;
        tierIcon.textContent = config.icon;
        tierLabel.textContent = config.label;
        tierBadge.className = `tier-badge w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center relative`;

        // Update reward tier cards
        const tierOrder = ['starter', 'bronze', 'silver', 'gold', 'diamond'];
        const currentIdx = tierOrder.indexOf(tier);
        document.querySelectorAll('.reward-card').forEach(card => {
            const cardTier = card.dataset.tier;
            const cardIdx = tierOrder.indexOf(cardTier);
            if (cardIdx <= currentIdx) {
                card.classList.remove('locked');
                card.classList.add('unlocked');
                card.style.borderColor = '';
                const lockText = card.querySelector('.tier-lock-text');
                const lockIcon = card.querySelector('.tier-lock-text')?.previousElementSibling;
                if (lockText) lockText.textContent = 'Unlocked';
                if (lockIcon) lockIcon.textContent = 'lock_open';
            }
        });
    }

    // ── Fetch Referral Code ──
    async function fetchReferralCode() {
        // If user is not authenticated, prompt to sign in instead of calling the API
        const token = localStorage.getItem('accessToken');
        if (!token) {
            codeDisplay.innerHTML = `<a href="login.html" class="text-primary font-bold">Sign in to view your referral code</a>`;
            copyCodeBtn?.setAttribute('disabled', 'true');
            copyLinkBtn?.setAttribute('disabled', 'true');
            ctaCopyBtn?.setAttribute('disabled', 'true');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/referral/my-code`, { headers: getAuthHeaders() });

            if (res.status === 401) {
                // Session expired or invalid token
                codeDisplay.innerHTML = `<a href="login.html" class="text-primary font-bold">Session expired — sign in again</a>`;
                return;
            }

            if (!res.ok) {
                const errBody = await res.json().catch(() => null);
                const msg = errBody?.message || 'Could not generate code';
                codeDisplay.innerHTML = `<span class="text-red-400 text-base">${msg}</span>`;
                return;
            }

            const data = await res.json();
            if (data.success && data.referralCode) {
                referralCode = data.referralCode;
                referralLink = `${window.location.origin}/signup.html?ref=${referralCode}`;
                codeDisplay.innerHTML = `<span class="code-reveal">${referralCode}</span>`;
                linkInput.value = referralLink;
                copyCodeBtn?.removeAttribute('disabled');
                copyLinkBtn?.removeAttribute('disabled');
                ctaCopyBtn?.removeAttribute('disabled');
            } else {
                codeDisplay.innerHTML = '<span class="text-red-400 text-base">Could not generate code</span>';
            }
        } catch (err) {
            console.error('Failed to fetch referral code:', err);
            codeDisplay.innerHTML = '<span class="text-red-400 text-base">Error loading code</span>';
        }
    }

    // ── Fetch Stats ──
    async function fetchStats() {
        try {
            const res = await fetch(`${API_URL}/referral/stats`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                animateCount(statTotal, data.totalReferrals);
                animateCount(statCompleted, data.completedReferrals);
                animateCount(statSignedUp, data.signedUpReferrals);
                animateCount(statPending, data.pendingReferrals);

                // Update tier
                updateTierDisplay(data.tier);

                // Progress bar
                if (data.nextTierAt) {
                    const tierNames = { 3: 'Bronze', 5: 'Silver', 7: 'Gold', 10: 'Diamond' };
                    nextTierName.textContent = tierNames[data.nextTierAt] || 'Next Tier';
                    const prevTierAt = { 3: 0, 5: 3, 7: 5, 10: 7 }[data.nextTierAt] || 0;
                    const progress = ((data.completedReferrals - prevTierAt) / (data.nextTierAt - prevTierAt)) * 100;
                    progressBar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
                    progressText.textContent = `${data.completedReferrals} / ${data.nextTierAt} completed`;
                } else {
                    // Diamond tier - max
                    progressSection.innerHTML = `
                        <div class="flex items-center justify-center gap-3 py-4">
                            <span class="material-symbols-outlined text-2xl text-cyan-400">auto_awesome</span>
                            <span class="text-sm font-bold text-cyan-400">You've reached Diamond — the highest tier! 🎉</span>
                        </div>
                    `;
                }

                // Streak
                if (data.completedReferrals >= 2) {
                    streakBadge.classList.remove('hidden');
                    streakBadge.classList.add('flex');
                    streakCount.textContent = data.completedReferrals;
                }
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }

    // ── Fetch Referral List ──
    async function fetchReferralList() {
        const container = document.getElementById('referralsList');
        try {
            const res = await fetch(`${API_URL}/referral/list`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success && data.referrals.length > 0) {
                container.innerHTML = data.referrals.map((r, i) => {
                    const statusColors = {
                        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        signed_up: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    };
                    const statusLabels = {
                        pending: 'Pending',
                        signed_up: 'Signed Up',
                        completed: 'Completed',
                    };
                    const statusIcons = {
                        pending: 'schedule',
                        signed_up: 'how_to_reg',
                        completed: 'check_circle',
                    };
                    const date = new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                    return `
                        <div class="leaderboard-row flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" style="animation-delay: ${i * 0.08}s">
                            <div class="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-primary text-lg">${statusIcons[r.status]}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-bold truncate">${r.refereeName || r.refereeEmail || 'Invited friend'}</div>
                                <div class="text-xs text-gray-400">${date}</div>
                            </div>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusColors[r.status]}">
                                ${statusLabels[r.status]}
                            </span>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            console.error('Failed to fetch referral list:', err);
        }
    }

    // ── Fetch Leaderboard ──
    async function fetchLeaderboard() {
        const container = document.getElementById('leaderboardList');
        try {
            const res = await fetch(`${API_URL}/referral/leaderboard`);
            const data = await res.json();
            if (data.success && data.leaderboard.length > 0) {
                container.innerHTML = data.leaderboard.map((entry, i) => {
                    const rankIcons = ['🥇', '🥈', '🥉'];
                    const rankDisplay = i < 3 ? `<span class="text-xl">${rankIcons[i]}</span>` : `<span class="text-sm font-bold text-gray-400">#${entry.rank}</span>`;
                    const bgClass = i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30' :
                                    i === 1 ? 'bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/30' :
                                    i === 2 ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30' :
                                    'hover:bg-gray-50 dark:hover:bg-white/5';

                    return `
                        <div class="leaderboard-row flex items-center gap-4 p-3 rounded-xl ${bgClass} transition-colors" style="animation-delay: ${i * 0.1}s">
                            <div class="w-10 flex items-center justify-center flex-shrink-0">
                                ${rankDisplay}
                            </div>
                            <div class="flex-1">
                                <div class="text-sm font-bold">${entry.name}</div>
                            </div>
                            <div class="text-sm font-bold text-primary">${entry.count} <span class="text-xs text-gray-400 font-normal">referrals</span></div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div class="text-center text-gray-400 text-sm py-8">
                        <span class="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2 block">leaderboard</span>
                        No entries yet. Be the first!
                    </div>
                `;
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            container.innerHTML = '<div class="text-center text-gray-400 text-sm py-8">Could not load leaderboard</div>';
        }
    }

    // ── Share Handlers ──
    function getShareText() {
        return `Earn ₹3,000 when you apply using my VidhyaLoan referral code ${referralCode} — ₹1,500 at sanction + ₹1,500 at disbursal. Your friend gets ₹1,500 too! 🎓`;
    }

    function setupShareButtons() {
        document.getElementById('shareWhatsApp')?.addEventListener('click', () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(getShareText() + '\n' + referralLink)}`, '_blank');
        });

        document.getElementById('shareTwitter')?.addEventListener('click', () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(referralLink)}`, '_blank');
        });

        document.getElementById('shareTelegram')?.addEventListener('click', () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(getShareText())}`, '_blank');
        });

        document.getElementById('shareEmail')?.addEventListener('click', () => {
            const subject = encodeURIComponent('Join VidhyaLoan — We Both Get Rewards!');
            const body = encodeURIComponent(getShareText() + '\n\nSign up here: ' + referralLink);
            window.open(`mailto:?subject=${subject}&body=${body}`);
        });
    }

    // ── Copy Handlers ──
    function setupCopyHandlers() {
        copyCodeBtn?.addEventListener('click', () => {
            copyToClipboard(referralCode, copyTooltip);
        });

        codeDisplay?.addEventListener('click', () => {
            copyToClipboard(referralCode, copyTooltip);
        });

        copyLinkBtn?.addEventListener('click', () => {
            copyToClipboard(referralLink);
            const original = copyLinkBtn.textContent;
            copyLinkBtn.textContent = 'Copied!';
            copyLinkBtn.classList.add('text-green-500');
            setTimeout(() => {
                copyLinkBtn.textContent = original;
                copyLinkBtn.classList.remove('text-green-500');
            }, 2000);
        });

        ctaCopyBtn?.addEventListener('click', () => {
            copyToClipboard(referralCode);
            const originalHTML = ctaCopyBtn.innerHTML;
            ctaCopyBtn.innerHTML = '<span class="material-symbols-outlined text-xl">check</span> Copied!';
            launchConfetti();
            setTimeout(() => {
                ctaCopyBtn.innerHTML = originalHTML;
            }, 3000);
        });
    }

    // ── Invite Form ──
    function setupInviteForm() {
        inviteForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = inviteEmailInput.value.trim();
            if (!email) return;

            inviteBtn.disabled = true;
            inviteBtn.innerHTML = '<span class="material-symbols-outlined text-lg animate-spin">progress_activity</span> Sending...';

            try {
                const res = await fetch(`${API_URL}/referral/invite`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();

                if (data.success) {
                    inviteStatus.textContent = `Invite recorded for ${email}! 🎉`;
                    inviteStatus.className = 'text-sm mt-3 text-green-600 dark:text-green-400';
                    inviteStatus.classList.remove('hidden');
                    inviteEmailInput.value = '';
                    launchConfetti();
                    // Refresh referral list
                    setTimeout(fetchReferralList, 1000);
                } else {
                    inviteStatus.textContent = data.message || 'Failed to send invite';
                    inviteStatus.className = 'text-sm mt-3 text-red-500';
                    inviteStatus.classList.remove('hidden');
                }
            } catch (err) {
                inviteStatus.textContent = 'Network error. Please try again.';
                inviteStatus.className = 'text-sm mt-3 text-red-500';
                inviteStatus.classList.remove('hidden');
            } finally {
                inviteBtn.disabled = false;
                inviteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">person_add</span> Send Invite';
            }
        });
    }

    // ── Scroll Reveal ──
    function setupScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    }

    // ── Initialize ──
    document.addEventListener('DOMContentLoaded', async () => {
        setupCopyHandlers();
        setupShareButtons();
        setupInviteForm();
        setupScrollReveal();

        // Load data
        await fetchReferralCode();
        fetchStats();
        fetchReferralList();
        fetchLeaderboard();
    });

})();
