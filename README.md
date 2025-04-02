# Project-TMS: Task Management System

A modern, feature-rich task management system built with HTML, CSS, and JavaScript. Project-TMS helps teams track projects, manage tasks, monitor time, and collaborate effectively - all within a beautiful and responsive interface.

## Features

- **Project Management**: Create, edit and organize multiple projects
- **Kanban Board**: Drag-and-drop task management with custom columns
- **Time Tracking**: Track time spent on individual tasks
- **Task Details**: Rich task information including descriptions, assignees, due dates, and status
- **Notes & Comments**: Add notes to tasks for better collaboration
- **Analytics**: Visualize project progress and team performance
- **Custom Themes**: Multiple theme options with customization settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Local Storage**: All data is stored in the browser's localStorage

## Getting Started

### Prerequisites

- Modern web browser with JavaScript enabled
- No server required - runs entirely in the browser

### Installation

1. Clone the repository or download the source code
2. Open `index.html` in your web browser
3. That's it! No build process or installation needed

```
git clone https://github.com/yourusername/project-tms.git
cd project-tms
open index.html
```

## Usage

### Creating a Project

1. Click "New Project" button
2. Fill in project details (name, description, dates)
3. Click "Save" to create the project

### Managing Tasks

1. Select a project from the dropdown
2. Click "New Task" to create a task
3. Drag tasks between columns to change status
4. Click on a task to view details or add notes

### Time Tracking

1. Create or edit a task with "In Progress" status
2. Use the Start/Pause button to track time
3. Time tracking data is saved automatically
4. View time reports in the Analytics section

### Customizing Themes

1. Go to Settings
2. Choose from available themes or customize colors
3. Toggle animations and visual effects
4. Save your preferences

## Project Structure

The project follows a modular structure to allow for easier maintenance and feature additions:

```
project-tms/
├── assets/             # Images and icons
├── css/                # Stylesheets
│   ├── components/     # Component-specific styles
│   ├── themes/         # Theme definitions
│   └── main.css        # Main stylesheet
├── js/                 # JavaScript files
│   ├── core/           # Core functionality
│   ├── components/     # UI components
│   ├── features/       # Feature modules
│   └── utils/          # Utility functions
├── views/              # HTML views
└── index.html          # Main entry point
```

## Key Components

- **Storage Manager**: Handles data persistence with localStorage
- **Event Bus**: Enables communication between components
- **Project Manager**: Handles project operations
- **Task Manager**: Manages tasks and the Kanban board
- **Time Tracker**: Tracks time spent on tasks
- **Theme Manager**: Manages theme settings
- **Analytics**: Generates charts and reports

## Customization

### Adding New Themes

1. Create a new theme CSS file in `css/themes/`
2. Define your theme variables
3. Register the theme in `js/components/ui/theme-switcher.js`

### Adding New Features

1. Create a new module in the appropriate directory
2. Register your feature with the app in `js/core/app.js`
3. Connect to existing components via the EventBus

## Browser Support

Project-TMS works in all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for styling inspiration
- [Chart.js](https://www.chartjs.org/) for analytics charts
- [FontAwesome](https://fontawesome.com/) for icons
- All the awesome contributors!

## Roadmap

- [ ] Add multi-user support
- [ ] Implement data export/import
- [ ] Add task filtering and search
- [ ] Create mobile app using capacitor
- [ ] Add offline sync capabilities