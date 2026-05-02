# Puatify - Smart School Schedule Notification System

Puatify is an automated school schedule notification system designed to keep students informed about their daily classes. It features a modern web dashboard for viewing schedules and an integrated LINE Official Account bot that sends real-time updates and summaries.

## 🚀 Features

*   **Modern Web Dashboard:** A sleek, responsive Next.js frontend with dark mode and glassmorphism design.
*   **LINE Bot Integration:** Users can check their schedules or subscribe to daily updates directly via LINE.
*   **Real-time Status:** The dashboard highlights current and upcoming classes based on real-time data.
*   **Serverless Backend:** Utilizes Google Apps Script as a lightweight, serverless database and webhook handler for the LINE API.
*   **Admin Panel:** A secure area to add, edit, and delete schedule entries.

## 🏗️ Project Architecture

Puatify is built using two main components:

1.  **Frontend (Next.js):** Hosted on Vercel, this handles the user interface and the admin dashboard.
2.  **Backend (Google Apps Script):** Acts as the database (using `PropertiesService`) and processes all requests from the frontend and the LINE webhook.

---

## 🛠️ Installation & Setup Guide

Follow these steps to deploy your own instance of Puatify.

### Step 1: Backend Setup (Google Apps Script)

1.  Go to [Google Apps Script](https://script.google.com/) and create a new project.
2.  Copy the code from the **Backend Code** section below and paste it into the script editor.
3.  Replace the empty strings in `ADMIN_USER`, `ADMIN_PASS`, `AUTH_TOKEN`, and `LINE_TOKEN` with your actual values.
4.  Click **Deploy** -> **New deployment**.
5.  Select type **Web app**.
6.  Set **Execute as** to `Me` and **Who has access** to `Anyone`.
7.  Click Deploy and copy the generated **Web app URL**.

### Step 2: Frontend Setup (Local Development)

1.  Clone this repository to your local machine:
    ```bash
    git clone [https://github.com/yourusername/Puatify.git](https://github.com/yourusername/Puatify.git)
    cd Puatify
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the root directory and add your Google Apps Script URL:
    ```env
    NEXT_PUBLIC_GAS_URL=your_google_apps_script_url_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:3000` in your browser.

### Step 3: Deployment (Vercel)

1.  Push your code to GitHub.
2.  Log in to [Vercel](https://vercel.com/) and import your repository.
3.  In the Vercel dashboard, go to **Settings** -> **Environment Variables**.
4.  Add a new variable:
    *   **Key:** `NEXT_PUBLIC_GAS_URL`
    *   **Value:** `[Your Google Apps Script URL]`
5.  Deploy the project.

---
