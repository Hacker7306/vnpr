# SnapPlate ALPR — Vehicle Number Plate Recognition System

A full-stack Vehicle Automatic License Plate Recognition (ALPR) system built with the **MERN stack** (MongoDB, Express, React, Node.js) and a **Python OCR microservice** using OpenCV + pytesseract.

---

## Project Structure

```
snapplate-alpr/
├── client/          ← React (Vite, JSX, Vanilla CSS)
├── server/          ← Express.js + MongoDB backend
├── ml/              ← Python Flask + OpenCV + pytesseract
├── .env             ← Environment variables (server config)
└── README.md
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Server + Client |
| Python | 3.8+ | OCR microservice |
| MongoDB | Local or Atlas | Database |
| Tesseract OCR | 5.x | Character recognition binary |

### Install Tesseract on Windows
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (default path: `C:\Program Files\Tesseract-OCR\`)
3. Uncomment this line in `ml/ocr_engine.py`:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```

---

## How to Run

### Terminal 1 — Python OCR Service (port 8000)

```bash
cd ml
pip install -r requirements.txt
python app.py
```

### Terminal 2 — Express Server (port 5000)

```bash
cd server
npm install       # first time only
npm start
```

> **Dev mode (auto-restart):** `npm run dev` (uses nodemon)

### Terminal 3 — React Client (port 5173)

```bash
cd client
npm install       # first time only
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Environment Variables (`.env` in project root)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/snapplate
ML_URL=http://localhost:8000
```

**For MongoDB Atlas**, replace `MONGO_URI` with your Atlas connection string:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/snapplate
```

---

## Pages & Features

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Stat cards, 7-day bar chart, recent scans |
| Scanner | `/scanner` | Live camera + drag-and-drop upload, OCR scan |
| History | `/history` | Paginated table, search, filter, CSV export |
| Reports | `/reports` | Donut chart, type breakdown, analytics |

---

## Architecture

```
React Client (5173)
       ↓ /api proxy
Express Server (5000)  ←→  MongoDB
       ↓ /api/ocr
Python Flask (8000)
       ↓
  OpenCV + pytesseract
```
