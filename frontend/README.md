# Frontend – PromptHive

This is the frontend for **PromptHive**, a user-facing interface built with React and Vite for interacting with spreadsheet data and configuration settings.

---

## 🚀 Prerequisites

- Node.js 18+
- npm (comes with Node.js)

---

## 🛠 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mohireza/prompthive.git
   cd prompthive/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## ▶️ Running the App (Development)

```bash
npm run start
```

Then open [http://localhost:5173/#/](http://localhost:5173/#/) in your browser.

> Hot module replacement is enabled for a smooth development experience.

---

## 🏗️ Building for Production

```bash
npm run build
```

This generates an optimized production build in the `dist/` folder:
- Minified output
- Hashed filenames
- Optimized for performance

---

## 📁 Project Structure
```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.jsx
├── public/
├── index.html
├── vite.config.js
```

---

## 🚀 Deployment

This app can be deployed on services like:
- GitHub Pages
- Vercel
- Netlify
- Firebase Hosting

Update any API endpoint references to your live backend URL as needed.

---

## 🔐 Security Notice

- Do **not** commit `credentials.json` or `token.json`.
- Use a `.env` file to store sensitive frontend configuration, and include it in `.gitignore`.

---

## 🤝 Contributing

We welcome contributions! Feel free to fork the repo, make changes, and open a pull request.