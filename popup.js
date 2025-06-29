// ProductivityZen Popup Script

class ProductivityPopup {
    constructor() {
        this.currentTab = 'dashboard';
        this.timeData = {};
        this.goals = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.updateDisplay();
        this.startLiveUpdates();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Goals
        document.getElementById('saveGoals').addEventListener('click', () => {
            this.saveGoals();
        });

        // Zen mode
        document.getElementById('zenModeBtn').addEventListener('click', () => {
            this.toggleZenMode();
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.updateDisplay();
    }

    async loadData() {
        try {
            // Load from background script
            const response = await chrome.runtime.sendMessage({ action: 'getTimeData' });
            this.timeData = response.timeTracker || {};
            this.goals = response.dailyGoals || { dailyHours: 6, focusTime: 4 };

            // Load current tab info
            const currentTab = await chrome.runtime.sendMessage({ action: 'getCurrentTab' });
            this.currentTabInfo = currentTab;

        } catch (error) {
            console.error('Error loading data:', error);
            this.timeData = {};
            this.goals = { dailyHours: 6, focusTime: 4 };
        }
    }

    updateDisplay() {
        switch (this.currentTab) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'goals':
                this.updateGoals();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
        }
    }

    updateDashboard() {
        const today = new Date().toDateString();
        const todayData = this.timeData[today] || {};

        // Calculate today's total time
        const totalTime = Object.values(todayData).reduce((sum, site) => {
            return sum + (site.totalTime || 0);
        }, 0);

        // Update today's time display
        document.getElementById('todayTime').textContent = this.formatTime(totalTime);

        // Calculate productivity score
        const productivityScore = this.calculateProductivityScore(todayData);
        document.getElementById('productivityScore').textContent = `${productivityScore}%`;

        // Update current site info
        this.updateCurrentSite();

        // Update daily progress
        const dailyGoalMs = this.goals.dailyHours * 60 * 60 * 1000;
        const progressPercent = Math.min((totalTime / dailyGoalMs) * 100, 100);
        document.getElementById('dailyProgress').style.width = `${progressPercent}%`;
    }

    updateCurrentSite() {
        const currentSiteDiv = document.getElementById('currentSite');
        
        if (this.currentTabInfo && this.currentTabInfo.isTrackable) {
            const today = new Date().toDateString();
            const siteData = this.timeData[today]?.[this.currentTabInfo.domain] || { totalTime: 0 };
            
            currentSiteDiv.innerHTML = `
                <div class="site-info">
                    <div class="site-icon">🌐</div>
                    <div class="site-details">
                        <h3>${this.currentTabInfo.domain}</h3>
                        <p>Time today: ${this.formatTime(siteData.totalTime)}</p>
                    </div>
                </div>
            `;
        } else {
            currentSiteDiv.innerHTML = `
                <div class="site-info">
                    <div class="site-icon">⏸️</div>
                    <div class="site-details">
                        <h3>Not tracking</h3>
                        <p>Current site is not being tracked</p>
                    </div>
                </div>
            `;
        }
    }

    updateGoals() {
        document.getElementById('dailyHours').value = this.goals.dailyHours || 6;
        document.getElementById('focusTime').value = this.goals.focusTime || 4;
    }

    updateAnalytics() {
        const today = new Date().toDateString();
        const todayData = this.timeData[today] || {};

        // Calculate week average
        const weekAverage = this.calculateWeekAverage();
        document.getElementById('weekAverage').textContent = this.formatTime(weekAverage);

        // Find top site
        const topSite = this.findTopSite(todayData);
        document.getElementById('topSiteTime').textContent = topSite ? this.formatTime(topSite.time) : '0m';

        // Update top sites list
        this.updateTopSitesList(todayData);
    }

    calculateProductivityScore(todayData) {
        // Simple productivity score based on time distribution
        const totalTime = Object.values(todayData).reduce((sum, site) => sum + (site.totalTime || 0), 0);
        
        if (totalTime === 0) return 100;

        // Define productive domains (you can expand this list)
        const productiveDomains = [
            'github.com', 'stackoverflow.com', 'docs.google.com', 
            'notion.so', 'trello.com', 'slack.com', 'figma.com',
            'codepen.io', 'developer.mozilla.org', 'w3schools.com'
        ];

        const productiveTime = Object.entries(todayData).reduce((sum, [domain, data]) => {
            return productiveDomains.some(prod => domain.includes(prod)) ? 
                sum + (data.totalTime || 0) : sum;
        }, 0);

        return Math.round((productiveTime / totalTime) * 100);
    }

    calculateWeekAverage() {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        let totalTime = 0;
        let days = 0;

        Object.entries(this.timeData).forEach(([date, dayData]) => {
            if (new Date(date) >= oneWeekAgo) {
                const dayTotal = Object.values(dayData).reduce((sum, site) => sum + (site.totalTime || 0), 0);
                totalTime += dayTotal;
                days++;
            }
        });

        return days > 0 ? totalTime / days : 0;
    }

    findTopSite(todayData) {
        let topSite = null;
        let maxTime = 0;

        Object.entries(todayData).forEach(([domain, data]) => {
            if (data.totalTime > maxTime) {
                maxTime = data.totalTime;
                topSite = { domain, time: data.totalTime };
            }
        });

        return topSite;
    }

    updateTopSitesList(todayData) {
        const topSitesDiv = document.getElementById('topSites');
        const sites = Object.entries(todayData)
            .map(([domain, data]) => ({ domain, time: data.totalTime || 0 }))
            .sort((a, b) => b.time - a.time)
            .slice(0, 5);

        if (sites.length === 0) {
            topSitesDiv.innerHTML = '<div class="loading">No data for today</div>';
            return;
        }

        topSitesDiv.innerHTML = sites.map(site => `
            <div class="site-item">
                <div class="site-name">${site.domain}</div>
                <div class="site-time">${this.formatTime(site.time)}</div>
            </div>
        `).join('');
    }

    async saveGoals() {
        const dailyHours = parseInt(document.getElementById('dailyHours').value) || 6;
        const focusTime = parseInt(document.getElementById('focusTime').value) || 4;

        const newGoals = {
            dailyHours,
            focusTime,
            breakTime: Math.ceil(dailyHours / 4) // Auto-calculate break time
        };

        try {
            await chrome.runtime.sendMessage({ 
                action: 'updateGoals', 
                goals: newGoals 
            });
            this.goals = newGoals;
            this.showNotification('Goals saved successfully!');
        } catch (error) {
            console.error('Error saving goals:', error);
            this.showNotification('Error saving goals', 'error');
        }
    }

    toggleZenMode() {
        // This would integrate with a focus mode feature
        this.showNotification('Zen Mode activated! Focus time begins now.');
        // You could implement blocking of distracting sites here
    }

    exportData() {
        const dataToExport = {
            timeData: this.timeData,
            goals: this.goals,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!');
    }

    formatTime(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    showNotification(message, type = 'success') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff6b6b' : '#4facfe'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startLiveUpdates() {
        // Update every 30 seconds
        setInterval(async () => {
            await this.loadData();
            this.updateDisplay();
        }, 30000);
    }
}

// Quick goal functions
window.setQuickGoal = function(hours) {
    document.getElementById('dailyHours').value = hours;
    document.getElementById('focusTime').value = Math.ceil(hours / 2);
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductivityPopup();
});

// Add slide-in animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
