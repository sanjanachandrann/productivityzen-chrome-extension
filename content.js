// ProductivityZen Content Script

class ProductivityTracker {
    constructor() {
        this.isActive = true;
        this.lastActivity = Date.now();
        this.activityThreshold = 30000; // 30 seconds of inactivity
        this.init();
    }

    init() {
        this.setupActivityListeners();
        this.setupVisibilityListener();
        this.setupFocusListener();
        this.injectProductivityWidget();
    }

    setupActivityListeners() {
        // Track user activity
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                this.lastActivity = Date.now();
                this.isActive = true;
            }, { passive: true });
        });

        // Check for inactivity every 10 seconds
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastActivity > this.activityThreshold) {
                this.isActive = false;
            }
        }, 10000);
    }

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
            } else {
                this.isActive = true;
                this.lastActivity = Date.now();
            }
        });
    }

    setupFocusListener() {
        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
        });

        window.addEventListener('blur', () => {
            this.isActive = false;
        });
    }

    injectProductivityWidget() {
        // Only inject on specific domains or when requested
        if (this.shouldShowWidget()) {
            this.createFloatingWidget();
        }
    }

    shouldShowWidget() {
        const hostname = window.location.hostname;
        
        // Show widget on commonly distracting sites
        const distractingSites = [
            'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
            'reddit.com', 'tiktok.com', 'netflix.com', 'twitch.tv'
        ];

        return distractingSites.some(site => hostname.includes(site));
    }

    createFloatingWidget() {
        // Create a subtle floating widget
        const widget = document.createElement('div');
        widget.id = 'productivity-zen-widget';
        widget.innerHTML = `
            <div class="pz-widget">
                <div class="pz-icon">🧘</div>
                <div class="pz-content">
                    <div class="pz-time" id="pz-time">0m</div>
                    <div class="pz-label">on this site</div>
                </div>
                <div class="pz-actions">
                    <button class="pz-btn" id="pz-focus-btn" title="Take a break">🎯</button>
                    <button class="pz-btn" id="pz-close-btn" title="Hide widget">✕</button>
                </div>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                #productivity-zen-widget {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .pz-widget {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    max-width: 250px;
                }

                .pz-widget:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
                }

                .pz-icon {
                    font-size: 24px;
                    opacity: 0.8;
                }

                .pz-content {
                    flex: 1;
                }

                .pz-time {
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                }

                .pz-label {
                    font-size: 12px;
                    color: #666;
                    margin-top: 2px;
                }

                .pz-actions {
                    display: flex;
                    gap: 8px;
                }

                .pz-btn {
                    background: none;
                    border: none;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .pz-btn:hover {
                    background: rgba(0, 0, 0, 0.1);
                }

                .pz-widget.minimized {
                    padding: 8px;
                }

                .pz-widget.minimized .pz-content,
                .pz-widget.minimized .pz-actions {
                    display: none;
                }

                @media (max-width: 768px) {
                    #productivity-zen-widget {
                        top: 10px;
                        right: 10px;
                    }
                    
                    .pz-widget {
                        padding: 8px;
                        max-width: 200px;
                    }
                }
            </style>
        `;

        // Inject styles
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(widget);

        // Setup widget interactions
        this.setupWidgetEvents();
        this.startWidgetUpdates();
    }

    setupWidgetEvents() {
        const focusBtn = document.getElementById('pz-focus-btn');
        const closeBtn = document.getElementById('pz-close-btn');
        const widget = document.querySelector('.pz-widget');

        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.showFocusReminder();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const widgetElement = document.getElementById('productivity-zen-widget');
                if (widgetElement) {
                    widgetElement.style.display = 'none';
                }
            });
        }

        // Make widget draggable
        if (widget) {
            this.makeDraggable(widget.parentElement);
        }
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    startWidgetUpdates() {
        setInterval(() => {
            this.updateWidgetTime();
        }, 1000);
    }

    async updateWidgetTime() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTimeData' });
            const timeData = response.timeTracker || {};
            const today = new Date().toDateString();
            const currentDomain = window.location.hostname;
            
            const siteData = timeData[today]?.[currentDomain];
            const totalTime = siteData?.totalTime || 0;
            
            const timeElement = document.getElementById('pz-time');
            if (timeElement) {
                timeElement.textContent = this.formatTime(totalTime);
            }
        } catch (error) {
            console.error('Error updating widget time:', error);
        }
    }

    showFocusReminder() {
        const reminder = document.createElement('div');
        reminder.innerHTML = `
            <div class="pz-focus-reminder">
                <div class="pz-focus-content">
                    <h3>🎯 Focus Reminder</h3>
                    <p>You've been on this site for a while. Consider taking a break or switching to something productive!</p>
                    <div class="pz-focus-actions">
                        <button class="pz-focus-btn primary" id="pz-take-break">Take a 5-min break</button>
                        <button class="pz-focus-btn secondary" id="pz-continue">Continue</button>
                    </div>
                </div>
            </div>
        `;

        const reminderStyles = `
            <style>
                .pz-focus-reminder {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000000;
                    animation: fadeIn 0.3s ease;
                }

                .pz-focus-content {
                    background: white;
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }

                .pz-focus-content h3 {
                    margin: 0 0 15px 0;
                    font-size: 24px;
                    color: #333;
                }

                .pz-focus-content p {
                    margin: 0 0 25px 0;
                    color: #666;
                    line-height: 1.5;
                }

                .pz-focus-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .pz-focus-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .pz-focus-btn.primary {
                    background: #4facfe;
                    color: white;
                }

                .pz-focus-btn.secondary {
                    background: #f0f0f0;
                    color: #333;
                }

                .pz-focus-btn:hover {
                    transform: translateY(-2px);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', reminderStyles);
        document.body.appendChild(reminder);

        // Setup reminder events
        document.getElementById('pz-take-break').addEventListener('click', () => {
            this.startBreakTimer();
            reminder.remove();
        });

        document.getElementById('pz-continue').addEventListener('click', () => {
            reminder.remove();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                reminder.remove();
            }
        }, { once: true });
    }

    startBreakTimer() {
        // This could integrate with the extension's break timer
        chrome.runtime.sendMessage({ 
            action: 'startBreak', 
            duration: 5 * 60 * 1000 // 5 minutes
        });
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Report activity status to background script
    reportActivity() {
        chrome.runtime.sendMessage({
            action: 'reportActivity',
            isActive: this.isActive,
            url: window.location.href,
            timestamp: Date.now()
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductivityTracker();
    });
} else {
    new ProductivityTracker();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'checkActivity':
            sendResponse({ isActive: document.visibilityState === 'visible' });
            break;
        case 'showFocusReminder':
            if (window.productivityTracker) {
                window.productivityTracker.showFocusReminder();
            }
            break;
    }
});

// Export for global access
window.productivityTracker = new ProductivityTracker();
