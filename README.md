# Potluck Signup Sheet App

A simple web app for organizing potlucks. Anyone can create a new potluck, edit the menu, sign up as a guest, and view the total guest list to help plan quantities.

## Features
- 🎉 Create new potluck events with name and date
- 📝 Edit menu items for each potluck
- 👥 Sign up guests with dish assignments and quantities
- 📋 View total guest list and menu for planning
- 💾 SQLite database for data persistence

## Tech Stack
- **Backend**: Node.js (Express), SQLite
- **Frontend**: React, Axios
- **Hosting**: Vercel/Netlify (frontend), Render/Railway (backend)

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Running Locally

1. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd potluck-signup
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   node index.js
   ```
   Backend runs on http://localhost:3001

3. **Frontend Setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on http://localhost:3000

### Quick Development
```bash
npm install
npm run dev  # Runs both backend and frontend concurrently
```

## Usage

1. **Create a Potluck**: Enter name and date, click "Create"
2. **Add Menu Items**: Select a potluck, add dishes to the menu
3. **Sign Up Guests**: Enter your name, select a dish, specify quantity
4. **View Guest List**: See who's bringing what and total attendees

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Frontend deployment (Vercel/Netlify)
- Backend deployment (Render/Railway)
- Environment variables setup
- Cost estimates

## Project Structure
```
potluck-signup/
├── backend/           # Node.js API server
│   ├── index.js      # Express server with SQLite
│   └── package.json
├── frontend/          # React app
│   ├── src/
│   │   ├── App.js    # Main component
│   │   └── index.js
│   └── package.json
├── DEPLOYMENT.md      # Deployment guide
└── README.md
```

## Database Schema

**potlucks** table:
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- date (TEXT)

**menu_items** table:
- id (INTEGER PRIMARY KEY)
- potluck_id (FOREIGN KEY)
- dish (TEXT)

**guests** table:
- id (INTEGER PRIMARY KEY)
- potluck_id (FOREIGN KEY)
- name (TEXT)
- dish_id (FOREIGN KEY)
- quantity (INTEGER)

## Budget Hosting Options

- **Free Tier**: Vercel/Netlify (frontend) + Railway free tier (backend)
- **Low Cost**: ~$5-7/month for always-on backend hosting
- **Data**: SQLite file-based storage (suitable for small-medium scale)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.
