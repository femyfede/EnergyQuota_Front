# EnergyQuota — Frontend

Web app for EnergyQuota, a smart tenant electricity management system (admin, owner and tenant dashboards).

The backend lives in a separate repo: [EnergyQuota_](https://github.com/femyfede/EnergyQuota_).

## Tech stack

React 18, Vite, Tailwind CSS, React Router, Axios, Socket.io client.

## Run locally

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend
npm run dev            # http://localhost:5173
```

`VITE_API_URL` is the backend address with no trailing slash, e.g. `https://energyquota-f3vf.onrender.com`. If it is not set, production builds use that Render URL and local dev uses `http://localhost:5000`.

## Deploy (Vercel)

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: leave empty
- `vercel.json` sends every page to `index.html` so links like `/login` work on refresh.
