# BaseChat

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-B8DBE4?style=for-the-badge&logo=pocketbase&logoColor=black)

BaseChat is a modern, real-time chat application built as a side project, inspired by Fireship's PocketChat. It features a sleek dark UI, real-time messaging, and unique interaction mechanics.

## Features

*   **Real-time Messaging**: Instant message delivery using PocketBase subscriptions.
*   **"Pooped to Death" Mechanic**: Messages with too many "poop" reactions get censored behind a warning overlay.
*   **Infinite Scroll**: Seamlessly load message history by scrolling up.
*   **Dark Mode**: A polished, deep grey theme inspired by Discord and modern developer tools.
*   **User Authentication**: Secure login and registration handling.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   PocketBase executable

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Kotsasmin/basechat.git
    cd basechat
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Setup Environment Variables**

    Create a `.env.local` file in the root directory (optional, defaults to localhost):
    
    ```env
    NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
    POCKETBASE_ADMIN_EMAIL=your-admin-email
    POCKETBASE_ADMIN_PASSWORD=your-admin-password
    ```
    *Note: Admin credentials are required for certain server-side actions.*

4.  **Run the Development Server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## PocketBase Setup (Schema Import)

This project uses **PocketBase** as its backend. You need to import the provided database schema to automatically create the necessary collections and rules.

1.  **Download & Run PocketBase**
    Download the latest release from [pocketbase.io](https://pocketbase.io/docs/) and run it:
    ```bash
    ./pocketbase serve
    ```

2.  **Access the Admin Dashboard**
    Go to `http://127.0.0.1:8090/_/` in your browser and create your admin account.

3.  **Import the Schema**
    The project contains a `pb_schema.json` file in the root directory. To apply it:
    *   In the Admin UI, go to **Settings** > **Import collections**.
    *   Click **"Load from JSON file"** and select `pb_schema.json` from this project's folder.
    *   Alternatively, copy the content of `pb_schema.json` and paste it into the text area.
    *   Click **Import**.

    This will create the `users`, `messages`, and `reactions` collections with all the correct fields and security rules.
