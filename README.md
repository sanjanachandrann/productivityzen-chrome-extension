# Productivity Tracker Chrome Extension

A powerful Chrome extension built with React to help you track and enhance your personal productivity. Monitor your browsing habits, set daily goals, and visualize your productivity trends.

## Features

- 📊 **Time Tracking**: Monitor time spent on specific websites
- 🎯 **Daily Goals**: Set and track daily productivity goals
- 📈 **Productivity Visualization**: View trends and analytics
- 🚫 **Website Blocking**: Block distracting websites during focus time
- ⏱️ **Pomodoro Timer**: Built-in focus timer
- 📱 **Responsive Design**: Clean, modern interface

## Screenshots

![Dashboard](screenshots/dashboard.png)
![Analytics](screenshots/analytics.png)

## Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/yourusername/productivity-tracker-extension.git
cd productivity-tracker-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development mode:
```bash
npm run dev
```

3. The extension will be built in the `dist` folder. Load it into Chrome as described above.

## Project Structure

```
productivity-tracker-extension/
├── public/
│   ├── manifest.json          # Extension manifest
│   ├── icons/                 # Extension icons
│   └── background.js          # Background script
├── src/
│   ├── components/            # React components
│   ├── pages/                 # Main pages (popup, options)
│   ├── utils/                 # Utility functions
│   ├── styles/               # CSS styles
│   └── content/              # Content scripts
├── dist/                     # Built extension
├── package.json
└── webpack.config.js
```

## Technologies Used

- **React 18** - Frontend framework
- **Chrome Extension APIs** - Browser integration
- **Chart.js** - Data visualization
- **Tailwind CSS** - Styling
- **Webpack** - Build tool
- **Local Storage** - Data persistence

## Chrome APIs Used

- `chrome.tabs` - Tab management and URL tracking
- `chrome.storage` - Data persistence
- `chrome.alarms` - Timer functionality
- `chrome.activeTab` - Current tab information
- `chrome.background` - Background processing

## Features Details

### Time Tracking
- Automatically tracks time spent on websites
- Categorizes websites (productive vs distracting)
- Real-time monitoring with minimal performance impact

### Goal Setting
- Set daily time limits for different website categories
- Track progress throughout the day
- Get notifications when approaching limits

### Analytics Dashboard
- Daily, weekly, and monthly productivity trends
- Website usage breakdown
- Time distribution charts
- Productivity score calculation

### Focus Mode
- Block distracting websites during focus sessions
- Pomodoro timer integration
- Customizable block lists

## Configuration

The extension can be configured through the options page:

1. Right-click the extension icon
2. Select "Options"
3. Configure your preferences:
   - Website categories
   - Daily goals
   - Blocked websites
   - Notification settings

## Data Privacy

- All data is stored locally on your device
- No data is sent to external servers
- You have full control over your productivity data

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Browser Support

- Chrome 88+
- Chromium-based browsers (Edge, Opera, Brave)


## Changelog

### v1.0.0
- Initial release
- Basic time tracking functionality
- Goal setting and monitoring
- Simple analytics dashboard

## Support

If you encounter any issues or have suggestions:

1. Check the [Issues](https://github.com/yourusername/productivity-tracker-extension/issues) page
2. Create a new issue with detailed description
3. Include browser version and extension version

## Roadmap

- [ ] Export data functionality
- [ ] Cloud sync option
- [ ] Team productivity features
- [ ] Advanced analytics
- [ ] Mobile companion app
- [ ] Integration with productivity tools

---

Made with ❤️ for better productivity
