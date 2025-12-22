# 📅 Dollarama Shift Scheduler

An automated employee shift scheduling system with a **fully interactive web interface** — runs entirely in your browser!

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Full Interactive UI**: Add/edit/delete employees and shifts directly on the website
- **In-Browser Scheduling**: JavaScript constraint solver — no Python or backend needed
- **Role-Based Assignments**: Supports ATL (managers), FullTime, and PartTime roles
- **Availability Grid**: Visual 7×24 hour picker for employee availability
- **Target Hour Optimization**: Schedules employees close to their preferred hours
- **Dark Mode**: Toggle between light and dark themes
- **Import/Export**: Backup and restore your data as JSON
- **Mobile Friendly**: Responsive design works on any device

## 🚀 Try It Now

**[Open the Live Scheduler →](https://uzair-aftab.github.io/dollarama-scheduler/)**

No installation required — works in any modern browser!

## 📸 Screenshots

### Schedule View
Generate optimal schedules with one click.

### Employee Management
Add employees with visual availability picker.

### Shift Configuration
Configure shift templates for your store.

## 💻 Local Development

### Clone and Run

```bash
git clone https://github.com/uzair-aftab/dollarama-scheduler.git
cd dollarama-scheduler

# For Jupyter notebook (optional backend)
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
jupyter lab
```

### Project Structure

```
dollarama-scheduler/
├── docs/                    # GitHub Pages site
│   ├── index.html           # Main application
│   ├── style.css            # Styles with dark mode
│   ├── app.js               # UI logic & event handlers
│   ├── scheduler.js         # Constraint-based scheduler
│   └── storage.js           # LocalStorage persistence
├── scheduler.ipynb          # Jupyter notebook (optional)
├── employees.json           # Sample employee data
├── requirements.txt         # Python dependencies
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

- ✅ Role matching (ATL shifts → ATL employees)
- ✅ Availability windows (respects start/end times)
- ✅ One shift per day per employee
- ✅ Maximum weekly hours per employee

## 📊 Data Persistence

All data is stored in your browser's localStorage:
- **Employees**: Names, roles, availability, hour targets
- **Shifts**: Templates applied to each day
- **Schedule**: Last generated schedule

Use **Export** to backup your data as JSON, and **Import** to restore.

## 🛠️ Customization

### Adding Employees
1. Go to **Employees** tab
2. Click **+ Add Employee**
3. Fill in name, role, hours
4. Click on the grid to set availability
5. Save

### Configuring Shifts
1. Go to **Shifts** tab
2. Click **+ Add Shift**
3. Set name, times, and required role
4. Save

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

## 📝 License

MIT License — feel free to use and modify!

---

Made with ☕ by [Uzair Aftab](https://github.com/uzair-aftab)
