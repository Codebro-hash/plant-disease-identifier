# Plant Disease Identifier

A web application that helps users identify plant diseases and issues by uploading photos of their plants. The application uses Gemini Vision LLM to analyze images and automatically detect diseases, pests, health issues, and provide personalized treatment recommendations. Users can view all their analyzed plants on a dashboard and export analysis details as Markdown.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Issue Flow](#issue-flow)
- [Architecture Overview](#architecture-overview)
- [API Endpoints](#api-endpoints)
- [Pages and Routes](#pages-and-routes)
- [Components](#components)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)

---

## Features

- User authentication with Firebase
- Upload plant photos via camera or file selection
- Automatic image analysis using Gemini Vision LLM upon upload
- AI-powered identification of:
  - Plant diseases
  - Pest presence
  - Health issues
  - Personalized treatment recommendations
- Automatic plant profile creation (saved after analysis)
- Dashboard showing all analyzed plants
- Plant detail view with full analysis results
- Delete plant profiles
- Export plant analysis as Markdown
- Landing page with app information

---

## Technology Stack

### Frontend
- React 19
- Vite (build tool)
- Tailwind CSS (styling)
- React Router DOM (routing)
- Axios or Fetch (API calls)
- Firebase SDK (authentication)

### Backend
- Python 3.12+
- FastAPI (REST API)
- Uvicorn (ASGI server)
- Pydantic (data validation)
- LangChain (basic chains)

### Database
- SQLite (for plant profiles and analysis results)

### Authentication
- Firebase Authentication (email/password)
- Firebase SDK in frontend

### AI/ML
- LangChain (basic chains)
- Google Gemini Vision LLM (for image analysis)

---

## Project Structure

```
plant-disease-identifier/
├── Backend/
│   ├── main.py                 # Main FastAPI application
│   ├── routes/                 # API route handlers
│   ├── models/                 # Database models and schemas
│   ├── utils/                  # Utility functions (image processing, LLM analysis, etc.)
│   ├── database/               # Database setup and queries
│   ├── uploads/                # Uploaded image storage
│   ├── pyproject.toml           # Python project configuration
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
│
├── Frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── utils/              # Utility functions and API services
│   │   ├── firebase/           # Firebase configuration
│   │   ├── context/            # React context (Auth, etc.)
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # React entry point
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite configuration
│
├── issues/                     # Project issues (14 issues)
├── project_details.md          # Detailed project planning document
└── PROJECT-README.md           # This file
```

---

## Issue Flow

The project is broken down into 14 issues, following a logical progression from setup to final testing:

### Foundation Phase (Issues 1-8)
1. **Project Setup** - Initialize project structure and dependencies
2. **Landing Page UI** - Create static landing page
3. **Signup Page UI** - Create static signup form
4. **Login Page UI** - Create static login form
5. **Firebase Auth Setup** - Configure Firebase Authentication
6. **Integrate Signup with Firebase** - Connect signup form to Firebase
7. **Integrate Login with Firebase** - Connect login form to Firebase
8. **Dashboard UI** - Create protected dashboard page

### Core Features Phase (Issues 9-13)
9. **Image Upload and Analysis** - Implement image upload with automatic Gemini Vision LLM analysis
10. **Display All Plants** - Show user's analyzed plants in dashboard
11. **Plant Detail View** - View individual plant with full analysis details
12. **Delete Plant Feature** - Delete plant profiles
13. **Export to Markdown** - Export plant analysis as Markdown file

### Final Phase (Issue 14)
14. **Final Testing** - Complete application flow verification

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐
│   React Frontend │
│  (User Interface)│
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────┐
│  FastAPI Backend │
│   (REST API)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
┌───▼───┐ ┌──▼───┐ ┌─────▼─────┐ ┌──────▼──────┐
│SQLite │ │Gemini│ │File      │ │Firebase     │
│Database│ │Vision│ │System    │ │Auth         │
│        │ │ LLM  │ │(Images)  │ │(Frontend)   │
└────────┘ └──────┘ └──────────┘ └─────────────┘
```

### Data Flow - Image Upload and Analysis

```
User → Upload Image → Frontend → POST /api/analyze → Backend
                                                          │
                                                          ├─→ Save Image (File System)
                                                          ├─→ Analyze with Gemini Vision LLM
                                                          │   ├─→ Identify Disease
                                                          │   ├─→ Detect Pests
                                                          │   ├─→ Identify Health Issues
                                                          │   └─→ Generate Recommendations
                                                          └─→ Save Plant Profile (SQLite)
```

### Data Flow - Plant Retrieval

```
User → View Dashboard → GET /api/plants → Backend
                                              │
                                              └─→ Query SQLite
                                              └─→ Return Plant List
```

### Data Flow - Plant Detail View

```
User → Click Plant Card → GET /api/plants/:id → Backend
                                                  │
                                                  └─→ Query SQLite
                                                  └─→ Return Full Plant Details
```

---

## API Endpoints

### Plant Management

| Method | Endpoint | Protected | Purpose | LLM Integration |
|--------|----------|-----------|---------|-----------------|
| POST | `/api/analyze` | Yes | Upload image, analyze with LLM, and save plant automatically | Yes |
| GET | `/api/plants` | Yes | Get all user's analyzed plants | No |
| GET | `/api/plants/:id` | Yes | Get single plant with full analysis details | No |
| DELETE | `/api/plants/:id` | Yes | Delete plant profile | No |
| GET | `/api/plants/:id/export` | Yes | Export plant analysis as Markdown | No |
| GET | `/api/images/:filename` | Yes | Serve uploaded image files | No |

**Note:** All endpoints require Firebase authentication token (handled on frontend). No backend auth endpoints are needed.

---

## Pages and Routes

| Page Name | Route | Protected | Purpose | Main Components |
|-----------|-------|-----------|---------|-----------------|
| Landing | `/` | No | Welcome page with app info | Navbar, Hero, Features, Footer |
| Signup | `/signup` | No | User registration | SignupForm |
| Login | `/login` | No | User authentication | LoginForm |
| Dashboard | `/dashboard` | Yes | Main user interface showing all analyzed plants | Navbar, PlantList, PlantCard, UploadButton |
| Plant Detail | `/plants/:id` | Yes | View single plant with full analysis details | Navbar, PlantDetail, ImageViewer, RecommendationList, ExportButton |

---

## Components

### Layout Components
- **Navbar** - Navigation header with user info and logout
- **Footer** - Footer with links and information

### Landing Page Components
- **Hero** - Hero section with CTA
- **Features** - Feature showcase section

### Authentication Components
- **SignupForm** - User registration form
- **LoginForm** - User login form

### Plant Components
- **PlantList** - Display list of analyzed plants
- **PlantCard** - Single plant card with preview
- **PlantDetail** - Full plant analysis view
- **UploadButton** - Upload trigger button
- **ImageUploadModal** - Image upload interface with camera/file support
- **ImageViewer** - Display plant image
- **DiseaseBadge** - Display disease name
- **PestBadge** - Display pest information

### Recommendation Components
- **RecommendationList** - Display treatment recommendations
- **RecommendationCard** - Single recommendation item
- **ExportButton** - Export analysis as Markdown

### Utility Components
- **LoadingSpinner** - Loading indicator
- **ErrorMessage** - Error display
- **DeleteConfirmDialog** - Confirmation dialog

---

## Database Schema

### High-Level Tables

**plants**
- Purpose: Store plant profiles with complete analysis results
- Essential fields: identifier, user reference, image path, disease, pests, health_issues, recommendations, timestamps
- Note: Each plant has one analysis (from the uploaded image). Analysis data is stored directly in the plants table.

**Note:** Specific field names and data types are designed by developers. SQLite stores all plant metadata and analysis results.

---

## Getting Started

### Prerequisites
- Python 3.12+
- UV Package Manager
- Node.js 18+
- Google API Key (for Gemini Vision LLM)
- Firebase project (for authentication)

### Backend Setup

1. Navigate to Backend directory
2. Create virtual environment: `uv venv`
3. Activate virtual environment
4. Install dependencies: `uv add -r requirements.txt`
5. Create `.env` file with:
   ```
   GOOGLE_API_KEY=your_google_api_key
   ```
6. Run server: `uvicorn main:app --reload`

### Frontend Setup

1. Navigate to Frontend directory
2. Install dependencies: `npm install`
3. Create `.env` file with Firebase configuration
4. Run dev server: `npm run dev`

### Development Workflow

1. Start backend server (port 8000)
2. Start frontend dev server (port 5173)
3. Open browser to http://localhost:5173
4. Follow issues sequentially from issue-01 to issue-14

---

## Key Concepts

### Vision LLM Analysis
- Images are uploaded and sent to Gemini Vision LLM
- LLM analyzes the image and provides structured output:
  - Disease identification
  - Pest detection (yes/no and details)
  - Health issues identification
  - Personalized treatment recommendations
- Analysis results are stored directly in the database
- No specialized image classification models or OCR libraries needed

### Image Processing Pipeline
1. User uploads image (via file selection or camera)
2. Image is sent to backend
3. Image is saved to file system
4. Image is analyzed with Gemini Vision LLM
5. LLM returns structured analysis (disease, pests, health issues, recommendations)
6. Plant profile is automatically created and saved to database
7. User sees new plant card on dashboard

### Plant Profile Structure
- One image = one plant = one analysis
- Each plant profile contains:
  - Image reference
  - Disease identification
  - Pest information
  - Health issues
  - Treatment recommendations array
  - Timestamps

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [LangChain Documentation](https://python.langchain.com/)
- [Gemini Vision API Documentation](https://ai.google.dev/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)

---

## License

This is a template project for educational purposes.
