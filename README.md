# 🎮 GameMatch – Personalized Game Recommendation App
**Final Year Project 2024/25**

## 📖 Overview
GameMatch is a full-stack web application that helps users discover video games tailored to their preferences. Users create profiles, set preferences such as genre, platform, and release date, and receive ranked game recommendations using a match-percentage scoring algorithm.

The project was designed and built end-to-end with a focus on clean architecture, data modelling, and reliability, simulating a real-world product rather than a prototype.

---

## 🚀 Key Features
🔐 Secure user registration and authentication (Supabase Auth)
💾 Persistent user preference storage
🎯 Dynamic filtering and sorting of game recommendations
📊 Match percentage scoring to rank relevance
📧 Email verification flow
🖥️ Responsive, modular UI built with React

---

## Architecture & Design

Frontend: React with modular, reusable components and clear separation of concerns

Backend & Data: Supabase for authentication and PostgreSQL-backed data persistence


State & Logic: Client-side filtering and scoring logic designed for clarity and extensibility

The system was structured to allow new recommendation criteria to be added with minimal refactoring.

---

## 🗂️ Data Model 

Users – authenticated via Supabase

Preferences – genre, platform, release date

Games – metadata used for filtering and scoring

Relational data was used to ensure consistency and reliable preference retrieval across sessions.

---

#🧠Key Engineering Decisions

Chose Supabase to rapidly prototype authentication and persistence while maintaining SQL-level control.

Prioritised type safety and predictable data flows to reduce runtime errors.

Focused on maintainability over premature optimisation.


## 🧪 Tech Stack

| Technology | Purpose                          |
|------------|----------------------------------|
| React.js   | Frontend UI and state management |
| Supabase   | Backend auth & database          |
| JavaScript | Application logic                |
| CSS        | Styling                          |

## How to run 

npm install 

npm start


Open (http://localhost:3000) to view app in development mode 




