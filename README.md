# 📅 Shift Scheduler v5.1

[![Live Demo](https://img.shields.io/badge/🚀_Try_It_Now-Live_Demo-003F24?style=for-the-badge)](https://uzair-aftab.github.io/dollarama-scheduler/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-FEE60E?style=for-the-badge&logo=github&logoColor=black)](https://github.com/uzair-aftab/dollarama-scheduler)

> **Inspired by Dollarama** — An automated employee shift scheduling system with a **fully interactive web interface** that runs entirely in your browser!

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live-003F24)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ⚠️ Disclaimer

This tool was created by **Uzair Aftab** as a personal portfolio project, inspired by his 3-month experience working at Dollarama. **It is not affiliated with, endorsed by, or connected to Dollarama in any way.** This project is for educational and demonstration purposes only.

---

## ✨ Features

### Core Scheduling
- **Full Interactive UI**: Add/edit/delete employees and shifts directly on the website
- **In-Browser Scheduling**: JavaScript constraint solver — no Python or backend needed
- **Role-Based Assignments**: Store Manager, Team Leader (TL), Assistant Team Leader (ATL), FullTime, and PartTime roles
- **Availability Grid**: Visual 7×24 hour picker for employee availability
- **Target Hour Optimization**: Schedules employees close to their preferred hours

### Employment Law Compliance 🇨🇦
- **International Student Hours**: 24hr/week cap during school term, 40hr/week during scheduled breaks
- **Ontario Break Law**: 30-minute unpaid break after 4 hours of work
- **Minimum Shift Length**: Configurable minimum (default 4 hours)
- **Min Rest Between Shifts**: Ensure adequate rest time (default 10 hours)
- **Max Consecutive Days**: Prevent burnout (default 5 days)

### Schedule Grid with Totals
- **Employee Weekly Totals**: See gross and paid hours per employee
- **Daily Totals Row**: Total hours scheduled per day
- **Budget Comparison**: Compare scheduled hours vs store weekly budget
- **Break Indicators**: Visual display of which shifts include breaks

### User Experience
- **Premium Typography**: Inter variable font with professional styling
- **Dark Mode**: Toggle between light and dark themes (Dollarama green color scheme!)
- **Intro Splash Screen**: Animated welcome screen with mouse-tracking effects
- **Form Validation**: Clear feedback for required fields
- **Import/Export**: Backup and restore your data as JSON
- **Mobile Friendly**: Responsive design works on any device

## 🚀 Try It Now

**[👉 Open the Live Scheduler](https://uzair-aftab.github.io/dollarama-scheduler/)**

No installation required — works in any modern browser!

## 💻 Local Development

### Clone and Run

```bash
git clone https://github.com/uzair-aftab/dollarama-scheduler.git
cd dollarama-scheduler

# Simply open docs/index.html in your browser
# Or use a local server:
npx serve docs
```

### Project Structure

```
dollarama-scheduler/
├── docs/                    # GitHub Pages site
│   ├── index.html           # Main application
│   ├── style.css            # Styles with Dollarama colors
│   ├── app.js               # UI logic & event handlers
│   ├── scheduler.js         # Constraint-based scheduler
│   └── storage.js           # LocalStorage persistence
├── scheduler.ipynb          # Original Jupyter notebook (legacy)
├── requirements.txt         # Python deps (legacy)
└── README.md
```

## 🔧 How It Works

### Scheduling Algorithm

The JavaScript scheduler uses a **greedy assignment with backtracking**:

1. **Build feasibility matrix**: Determine which employees can work which shifts
2. **Sort by difficulty**: Process shifts with fewest candidates first
3. **Assign greedily**: Prioritize employees furthest from their target hours
4. **Backtrack if stuck**: Try alternative assignments when constraints conflict

### Constraints Enforced

- ✅ Role matching (ATL shifts → ATL employees, TL shifts → TL employees, etc.)
- ✅ Availability windows (respects start/end times)
- ✅ One shift per day per employee
- ✅ Maximum weekly hours per employee
- ✅ International student 24hr/40hr cap (depending on break status)
- ✅ Minimum rest hours between shifts
- ✅ Maximum consecutive working days
- ✅ Ontario 30-minute unpaid break after 4 hours

## 📊 Data Persistence

All data is stored in your browser's localStorage:
- **Employees**: Names, roles, employment status, availability, hour targets
- **Shifts**: Templates applied to each day
- **Roles**: Customizable role definitions with colors
- **Settings**: Scheduling constraints and compliance settings
- **Schedule**: Last generated schedule with all metadata

Use **Export** to backup your data as JSON, and **Import** to restore.

## 🎨 Dollarama-Inspired Design

The app features Dollarama's signature color scheme:
- **Kaitoke Green** (`#003F24`) — Primary color
- **Lemon Yellow** (`#FEE60E`) — Accent color

### Role Colors
| Role | Color | Description |
|------|-------|-------------|
| Store Manager | 🔴 Red | Top-level manager |
| Team Leader (TL) | 🟠 Orange | Supervises team |
| ATL | 🟣 Purple | Assistant team leader |
| Full Time | 🟢 Green | Regular full-time |
| Part Time | 🔵 Cyan | Part-time/casual |

## 🛠️ Customization

### Adding Employees
1. Go to **Employees** tab
2. Click **+ Add Employee**
3. Fill in name, role, employment status
4. For international students, check "On Scheduled Break" during winter/summer breaks
5. Click on the grid to set availability
6. Save

### Configuring Shifts
1. Go to **Shifts** tab
2. Click **+ Add Shift**
3. Set name, times, and required role
4. Save

### Adjusting Settings
1. Go to **Settings** tab
2. Configure:
   - Store weekly hours budget
   - Minimum rest hours between shifts
   - Maximum consecutive days
   - Minimum shift length
   - Break settings (after how many hours, duration)
   - International student max hours
3. Click **Save Settings**

### Managing Roles
1. Go to **Settings** tab → Role Management
2. Add custom roles with colors
3. Roles can be used for employees and shift templates

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between form fields |
| `Enter` | Submit forms |
| `Escape` | Close modals |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

## 📝 Changelog

### v5.1 (Current)
- Typography upgrade (Inter variable font)
- Role modal improvements with helper text
- International student "On Scheduled Break" toggle
- Schedule grid with totals row/column and budget comparison
- Fixed warning hint colors for better readability
- Code cleanup and bug fixes

### v5.0
- Employment law compliance (breaks, student hours)
- Store Manager and Team Leader roles
- New settings panel for scheduling constraints
- Employment status for employees

### v4.0
- Role management system
- Dynamic role colors
- Import/export functionality

### v3.0
- Intro splash screen
- Dark mode toggle
- Modern UI overhaul

## 📄 License

MIT License — feel free to use and modify!

---

Made with ☕ by [Uzair Aftab](https://github.com/uzair-aftab)

*This is a personal project for portfolio/educational purposes. Not affiliated with Dollarama.*
