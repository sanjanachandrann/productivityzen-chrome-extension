// ProductivityZen Background Service Worker

let activeTab = null;
let timeTracker = {};
let dailyGoals = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('ProductivityZen installed');
  initializeStorage();
  setupAlarms();
});

// Initialize storage with default values
async function initializeStorage() {
  const result = await chrome.storage.local.get(['timeTracker', 'dailyGoals', 'settings']);
  
  if (!result.timeTracker) {
    await chrome.storage.local.set({
      timeTracker: {},
      dailyGoals: {
        dailyHours: 6,
        focusTime: 4,
        breakTime: 1
      },
      settings: {
        theme: 'light',
        notifications: true,
        trackingEnabled: true
      }
    });
  }
}

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await handleTabSwitch(activeInfo.tabId);
});

// Track tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await handleTabSwitch(tabId);
  }
});

// Handle tab switching logic
async function handleTabSwitch(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // Stop tracking previous tab
    if (activeTab && activeTab.domain !== domain) {
      await stopTracking(activeTab.domain);
    }
    
    // Start tracking new tab
    if (isTrackableUrl(tab.url)) {
      activeTab = {
        domain: domain,
        startTime: Date.now(),
        title: tab.title
      };
      await startTracking(domain);
    }
  } catch (error) {
    console.error('Error handling tab switch:', error);
  }
}

// Check if URL should be tracked
function isTrackableUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

// Start tracking time for domain
async function startTracking(domain) {
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get(['timeTracker']);
  const tracker = result.timeTracker || {};
  
  if (!tracker[today]) {
    tracker[today] = {};
  }
  
  if (!tracker[today][domain]) {
    tracker[today][domain] = {
      totalTime: 0,
      sessions: [],
      firstVisit: Date.now()
    };
  }
  
  tracker[today][domain].currentSession = {
    startTime: Date.now(),
    active: true
  };
  
  await chrome.storage.local.set({ timeTracker: tracker });
}

// Stop tracking time for domain
async function stopTracking(domain) {
  if (!domain) return;
  
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get(['timeTracker']);
  const tracker = result.timeTracker || {};
  
  if (tracker[today] && tracker[today][domain] && tracker[today][domain].currentSession) {
    const session = tracker[today][domain].currentSession;
    const timeSpent = Date.now() - session.startTime;
    
    tracker[today][domain].totalTime += timeSpent;
    tracker[today][domain].sessions.push({
      startTime: session.startTime,
      endTime: Date.now(),
      duration: timeSpent
    });
    
    delete tracker[today][domain].currentSession;
    await chrome.storage.local.set({ timeTracker: tracker });
  }
}

// Setup periodic alarms
function setupAlarms() {
  chrome.alarms.create('updateTracking', { periodInMinutes: 1 });
  chrome.alarms.create('dailyReset', { when: getNextMidnight() });
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'updateTracking':
      updateCurrentTracking();
      break;
    case 'dailyReset':
      handleDailyReset();
      break;
  }
});

// Update current tracking session
async function updateCurrentTracking() {
  if (activeTab) {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['timeTracker']);
    const tracker = result.timeTracker || {};
    
    if (tracker[today] && tracker[today][activeTab.domain] && tracker[today][activeTab.domain].currentSession) {
      const session = tracker[today][activeTab.domain].currentSession;
      const timeSpent = Date.now() - session.startTime;
      
      // Update total time without ending session
      tracker[today][activeTab.domain].totalTime = 
        (tracker[today][activeTab.domain].totalTime || 0) - 
        (tracker[today][activeTab.domain].tempTime || 0) + timeSpent;
      
      tracker[today][activeTab.domain].tempTime = timeSpent;
      
      await chrome.storage.local.set({ timeTracker: tracker });
      
      // Check for productivity notifications
      await checkProductivityGoals(tracker[today]);
    }
  }
}

// Check productivity goals and send notifications
async function checkProductivityGoals(todayData) {
  const result = await chrome.storage.local.get(['dailyGoals', 'settings']);
  const goals = result.dailyGoals || {};
  const settings = result.settings || {};
  
  if (!settings.notifications) return;
  
  const totalTime = Object.values(todayData).reduce((sum, site) => sum + (site.totalTime || 0), 0);
  const totalHours = totalTime / (1000 * 60 * 60);
  
  // Notify if approaching daily goal
  if (totalHours >= goals.dailyHours * 0.8 && totalHours < goals.dailyHours) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'ProductivityZen',
      message: `You're close to your daily goal! ${(goals.dailyHours - totalHours).toFixed(1)} hours remaining.`
    });
  }
}

// Handle daily reset
async function handleDailyReset() {
  chrome.alarms.create('dailyReset', { when: getNextMidnight() });
  
  // Optional: Clean up old data (keep last 30 days)
  const result = await chrome.storage.local.get(['timeTracker']);
  const tracker = result.timeTracker || {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  Object.keys(tracker).forEach(date => {
    if (new Date(date) < thirtyDaysAgo) {
      delete tracker[date];
    }
  });
  
  await chrome.storage.local.set({ timeTracker: tracker });
}

// Get next midnight timestamp
function getNextMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getCurrentTab':
      getCurrentTabInfo().then(sendResponse);
      return true;
    case 'getTimeData':
      getTimeData().then(sendResponse);
      return true;
    case 'updateGoals':
      updateGoals(request.goals).then(sendResponse);
      return true;
  }
});

// Get current tab information
async function getCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    return {
      domain: url.hostname,
      title: tab.title,
      url: tab.url,
      isTrackable: isTrackableUrl(tab.url)
    };
  } catch (error) {
    return null;
  }
}

// Get time tracking data
async function getTimeData() {
  const result = await chrome.storage.local.get(['timeTracker', 'dailyGoals']);
  return {
    timeTracker: result.timeTracker || {},
    dailyGoals: result.dailyGoals || {}
  };
}

// Update daily goals
async function updateGoals(goals) {
  await chrome.storage.local.set({ dailyGoals: goals });
  return { success: true };
}
