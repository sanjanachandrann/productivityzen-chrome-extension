// ProductivityZen Options Page Logic
class ProductivityOptions {
    constructor() {
        this.settings = {};
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadStats();
        this.setupEventListeners();
        this.renderSettings();
        this.renderStats();
    }

    async loadSettings() {
        const data = await chrome.storage.sync.get(['settings']);
        this.settings = data.settings || {
            notifications: true,
            darkMode: false,
            idleTime: 30,
            dailyGoal: 480, // 8 hours in minutes
            workingHours: {
                start: '09:00',
                end: '17:00'
            },
            blockedSites: [],
            productiveSites: []
        };
    }

    async loadStats() {
        const data = await chrome.storage.local.get(['timeTracking', 'dailyGoals']);
        const timeData = data.timeTracking || {};
        const goals = data.dailyGoals || {};
        
        this.calculateStats(timeData, goals);
    }

    calculateStats(timeData, goals) {
        const today = new Date().toDateString();
        const thisWeek = this.getWeekDates();
        const thisMonth = this.getMonthDates();

        // Calculate total time stats
        let totalTimeToday = 0;
        let totalTimeWeek = 0;
        let totalTimeMonth = 0;
        let mostVisitedSites = {};

        // Process time data
        Object.keys(timeData).forEach(date => {
            const dayData = timeData[date];
            const dayTotal = Object.values(dayData).reduce((sum, time) => sum + time, 0);

            if (date === today) {
                totalTimeToday = dayTotal;
            }
            
            if (thisWeek.includes(date)) {
                totalTimeWeek += dayTotal;
                Object.keys(dayData).forEach(site => {
                    mostVisitedSites[site] = (mostVisitedSites[site] || 0) + dayData[site];
                });
            }
            
            if (thisMonth.includes(date)) {
                totalTimeMonth += dayTotal;
            }
        });

        // Calculate goals achieved
        const goalsToday = goals[today] || {};
        const goalsAchieved = Object.values(goalsToday).filter(goal => goal.achieved).length;
        const totalGoals = Object.keys(goalsToday).length;

        this.stats = {
            timeToday: this.formatTime(totalTimeToday),
            timeWeek: this.formatTime(totalTimeWeek),
            timeMonth: this.formatTime(totalTimeMonth),
            goalsAchieved: `${goalsAchieved}/${totalGoals}`,
            mostVisitedSites: Object.entries(mostVisitedSites)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([site, time]) => ({ site, time: this.formatTime(time) }))
        };
    }

    getWeekDates() {
        const dates = [];
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date.toDateString());
        }
        return dates;
    }

    getMonthDates() {
        const dates = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            dates.push(date.toDateString());
        }
        return dates;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    setupEventListeners() {
        // Toggle switches
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const setting = e.target.dataset.setting;
                this.toggleSetting(setting);
            });
        });

        // Input fields
        document.querySelectorAll('.input-field').forEach(input => {
            input.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                this.updateSetting(setting, e.target.value);
            });
        });

        // Buttons
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearData();
        });

        // Add blocked site
        document.getElementById('addBlockedSite').addEventListener('click', () => {
            this.addBlockedSite();
        });

        // Add productive site
        document.getElementById('addProductiveSite').addEventListener('click', () => {
            this.addProductiveSite();
        });
    }

    renderSettings() {
        // Notifications toggle
        document.getElementById('notificationsToggle').classList.toggle('active', this.settings.notifications);
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').classList.toggle('active', this.settings.darkMode);
        
        // Idle time input
        document.getElementById('idleTime').value = this.settings.idleTime;
        
        // Daily goal input
        document.getElementById('dailyGoal').value = this.settings.dailyGoal;
        
        // Working hours
        document.getElementById('workStart').value = this.settings.workingHours.start;
        document.getElementById('workEnd').value = this.settings.workingHours.end;
        
        // Render site lists
        this.renderSiteList('blockedSites', this.settings.blockedSites);
        this.renderSiteList('productiveSites', this.settings.productiveSites);
    }

    renderStats() {
        document.getElementById('timeToday').textContent = this.stats.timeToday;
        document.getElementById('timeWeek').textContent = this.stats.timeWeek;
        document.getElementById('timeMonth').textContent = this.stats.timeMonth;
        document.getElementById('goalsAchieved').textContent = this.stats.goalsAchieved;
        
        // Render most visited sites
        const sitesList = document.getElementById('mostVisitedSites');
        sitesList.innerHTML = '';
        
        this.stats.mostVisitedSites.forEach(({ site, time }) => {
            const item = document.createElement('div');
            item.className = 'website-item';
            item.innerHTML = `
                <span>${site}</span>
                <span>${time}</span>
            `;
            sitesList.appendChild(item);
        });
    }

    renderSiteList(containerId, sites) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        sites.forEach((site, index) => {
            const item = document.createElement('div');
            item.className = 'website-item';
            item.innerHTML = `
                <span>${site}</span>
                <button class="btn btn-danger btn-sm" onclick="options.removeSite('${containerId}', ${index})">Remove</button>
            `;
            container.appendChild(item);
        });
    }

    toggleSetting(setting) {
        this.settings[setting] = !this.settings[setting];
        document.getElementById(`${setting}Toggle`).classList.toggle('active', this.settings[setting]);
    }

    updateSetting(setting, value) {
        if (setting.includes('.')) {
            const [parent, child] = setting.split('.');
            this.settings[parent][child] = value;
        } else {
            this.settings[setting] = parseInt(value) || value;
        }
    }

    addBlockedSite() {
        const input = document.getElementById('newBlockedSite');
        const site = input.value.trim();
        
        if (site && !this.settings.blockedSites.includes(site)) {
            this.settings.blockedSites.push(site);
            this.renderSiteList('blockedSites', this.settings.blockedSites);
            input.value = '';
        }
    }

    addProductiveSite() {
        const input = document.getElementById('newProductiveSite');
        const site = input.value.trim();
        
        if (site && !this.settings.productiveSites.includes(site)) {
            this.settings.productiveSites.push(site);
            this.renderSiteList('productiveSites', this.settings.productiveSites);
            input.value = '';
        }
    }

    removeSite(listType, index) {
        const key = listType === 'blockedSites' ? 'blockedSites' : 'productiveSites';
        this.settings[key].splice(index, 1);
        this.renderSiteList(listType, this.settings[key]);
    }

    async saveSettings() {
        await chrome.storage.sync.set({ settings: this.settings });
        this.showNotification('Settings saved successfully!');
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings?')) {
            await chrome.storage.sync.clear();
            await this.loadSettings();
            this.renderSettings();
            this.showNotification('Settings reset successfully!');
        }
    }

    async exportData() {
        const data = await chrome.storage.local.get();
        const exportData = {
            timeTracking: data.timeTracking || {},
            dailyGoals: data.dailyGoals || {},
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivityzen-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!');
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
            await chrome.storage.local.clear();
            await this.loadStats();
            this.renderStats();
            this.showNotification('Data cleared successfully!');
        }
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize options page
const options = new ProductivityOptions();

// Make functions available globally for onclick handlers
window.options = options;
