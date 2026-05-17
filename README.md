# Ochok Resort Booking System 🌊🏕️

A modern, responsive, and full-stack web application developed for **"Ochok Resort"**, a cozy A-Frame cabin resort on the shores of Issyk-Kul Lake, Kyrgyzstan. This project provides a user-friendly landing page with an integrated booking calculator, alongside a secure administrative dashboard for managing reservations.

---

## 🌟 Key Features

- **Responsive Landing Page:** Fully localized (Russian & English) landing page showcasing the resort with high-quality images and a smooth user experience.
- **Dynamic Booking Calculator:** Users can select dates, customize their stay (e.g., breakfast, late checkout), and view real-time pricing in multiple currencies (KGS, USD).
- **Secure Reservation System:** Built-in form validation and bot-protection using **Cloudflare Turnstile**.
- **Admin Dashboard:** A separate, authenticated `/Admin.html` portal allowing administrators to view, edit, approve, and delete bookings. Includes an interactive calendar view for availability management.
- **Real-time Notifications:** Automated booking notifications sent instantly to administrators via **Telegram Bot API**.
- **Serverless Backend:** Built with **Firebase Cloud Functions** to securely process bookings, update availability calendars, and integrate with third-party APIs.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- Responsive design tailored for mobile and desktop viewing.
- Real-time client-side localization and DOM manipulation without heavy frameworks.

### Backend & Database
- **Firebase Firestore:** NoSQL database for storing bookings, availability mapping, and site settings.
- **Firebase Authentication:** Securing the Admin dashboard.
- **Firebase Cloud Functions:** Node.js serverless functions handling the booking logic and external API integrations.

### Third-Party Integrations
- **Cloudflare Turnstile:** Invisible CAPTCHA alternative protecting the booking form from spam.
- **Telegram Bot API:** Instant notifications to staff members upon successful reservation requests.

---

## ⚙️ Setup & Installation

To run this project locally or deploy it to your own Firebase environment, follow these steps:

### Prerequisites
- Node.js (v18 or higher recommended)
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase Project (with Firestore, Authentication, and Functions enabled)
- A Cloudflare account (for Turnstile)
- A Telegram Bot (created via BotFather)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/resort-booking-system.git
cd resort-booking-system
```

### 2. Configure Environment Variables
You will need to replace the placeholders in the codebase with your actual keys.
- **Frontend Configuration:**
  In `public/index.html` and `public/Admin.html`, replace the `firebaseConfig` object with your project credentials.
  In `public/index.html`, replace the `data-sitekey` in the Turnstile div.
- **Backend Configuration:**
  In `functions/index.js`, configure the `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS`, and `TURNSTILE_SECRET_KEY` using `process.env` or Firebase Secret Manager.

### 3. Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 4. Run Locally
To test the site and functions locally using the Firebase Emulator Suite:
```bash
firebase emulators:start
```
The site will typically be available at `http://localhost:5000`.

### 5. Deployment
To deploy the site and functions to Firebase:
```bash
firebase deploy
```

---

## 🔒 Security Note
Sensitive credentials (such as Firebase API keys, Telegram Bot Tokens, and Cloudflare Secret Keys) have been removed from this repository for security purposes. If you intend to fork this project, make sure to use your own environment variables and never hardcode secrets in public repositories.

---

## 👨‍💻 Developed By
Developed by an aspiring Full-Stack Web Developer. This project demonstrates proficiency in building end-to-end web solutions, integrating third-party APIs, and managing serverless cloud infrastructure.