# Budget Buddy: Automated Expense Tracker & Financial Advisor

## 1. Project Overview

**Budget Buddy** is a modern, single-user personal finance management web application designed to simplify financial tracking and empower users to take control of their money. The project aims to solve the common problems of manual, tedious expense logging and the lack of clear insights into one's spending habits.

By providing an intuitive interface, automated data visualization, and AI-powered advice, Budget Buddy transforms the complex task of budgeting into an accessible and insightful experience. It helps users understand where their money goes, identify potential savings, and work towards their financial goals with confidence. The application is built with a focus on a clean user experience and a solid technical foundation that allows for future scalability.

---

## 2. Key Features

- **Income & Expense Tracking**: Users can add detailed income entries (including source, category, and notes) and categorized expenses through user-friendly modals. The system prevents users from adding expenses that exceed their available balance.
- **Unified Transaction Ledger**: All financial activities, both income and expenses, are stored in a single, unified database table, providing a single source of truth for all transactions.
- **Interactive Dashboard**: A central dashboard offers an at-a-glance view of the user's financial health, including:
    - Summary cards for **Total Income**, **Total Expenses**, and **Available Balance**.
    - A **Donut Chart** visualizing the top 4 spending categories.
    - A list of the 9 most **Recent Transactions**.
- **Detailed Category View**: Users can click on any main spending category to navigate to a dedicated page showing a detailed, filterable list of all transactions within that category.
- **AI-Powered Savings Suggestions**: A dedicated "Personalized Savings" page where users can input their financial goals. An AI model analyzes their transaction history and goals to provide a list of specific, actionable savings tips.
- **PDF Statement Import**: An experimental feature that allows users to upload a PDF bank statement. The application extracts the raw text and attempts to parse it into a structured transaction table for user review, paving the way for bulk transaction imports.
- **Persistent Local Storage**: Utilizes an SQLite3 database to ensure all transaction data is saved persistently, so user data is not lost between sessions.
- **Responsive & Modern UI**: Built with a clean, professional, and fully responsive design that works seamlessly across desktop and mobile devices.

---

## 3. Modules & Functionalities

The project is structured into several core modules:

- **Data Management & State (`src/contexts/AppContext.tsx`)**: A central React Context that manages the application's global state. It fetches data from the database, holds the list of all transactions, calculates derived values (like totals and balances), and provides functions for adding or deleting transactions.
- **Database Services (`src/app/services/transactionService.ts` & `src/lib/db.ts`)**: A service layer that abstracts all database interactions. It uses server-side logic to connect to the SQLite database and perform CRUD (Create, Read, Update, Delete) operations on the `transactions` table.
- **UI Components (`src/components/` & `src/components/ui/`)**: A collection of reusable React components built using ShadCN UI. This includes generic components (buttons, dialogs, cards) and application-specific components (like `DashboardHeader`, `AddExpenseModal`, `ExpenseDonutChart`).
- **AI Engine (`src/ai/`)**: Contains all Genkit-powered AI flows. Currently, this includes the `personalized-savings-suggestions` flow which connects to the Google AI (Gemini) API.
- **Database Initialization & Scripts (`/scripts`)**: Includes Node.js scripts to initialize the database schema (`init-db.js`) and handle build-time tasks like copying necessary static files (`copy-pdf-worker.js`).
- **Pages & Routing (`src/app/`)**: Uses the Next.js App Router for all page-based routing, including the landing page, main dashboard, category detail pages, savings page, and PDF import page.

---

## 4. Technology Stack

-   **Frontend Framework**: **Next.js 15** (with App Router)
-   **Core Library**: **React 18**
-   **Language**: **TypeScript**
-   **Styling**: **Tailwind CSS**
-   **UI Components**: **ShadCN UI**, **Lucide React** (for icons)
-   **Data Visualization**: **Recharts** (for charts and graphs)
-   **Forms**: **React Hook Form** with **Zod** for schema validation
-   **Backend / Server-side Logic**: **Node.js** (via Next.js Server Actions & API Routes)
-   **Database**: **SQLite3**
-   **Generative AI**: **Genkit**, **Google AI (Gemini)**
-   **PDF Parsing**: **pdfjs-dist** (Mozilla's PDF.js library)
-   **Package Manager**: **npm**

---

## 5. Working Process of the System

The application operates through a clear, client-server data flow, orchestrated by Next.js and React.

1.  **Initialization & Data Fetching**:
    -   When the application starts, the `AppProvider` component (which wraps the entire app in `layout.tsx`) is mounted.
    -   A `useEffect` hook within `AppContext` triggers the `fetchTransactions` function.
    -   `fetchTransactions` calls the `getAllTransactionsDb` server-side function from `transactionService.ts`.
    -   This service connects to the `budgetbuddy.db` SQLite file and executes an SQL `SELECT * FROM transactions` query.
    -   The fetched transaction data is returned to the client and stored in the `allTransactions` state within `AppContext`.
    -   All other data, such as `totalIncome`, `totalExpenses`, and the `expenses` list, are reactively derived from this `allTransactions` state using `useMemo`.

2.  **Adding a Transaction (e.g., Expense)**:
    -   A user clicks the "Add Expense" button, which opens the `AddExpenseModal`.
    -   The user fills in the form fields (name, amount, category, etc.).
    -   Upon submission, the `onSubmit` handler in the modal first checks if the expense amount exceeds the `availableBalance` from `AppContext`.
    -   If the balance is sufficient, the handler calls the `addExpenseToList` function from `AppContext`.
    -   `addExpenseToList` then calls the `addTransactionDb` server-side function, passing the transaction payload.
    -   `addTransactionDb` validates the data and executes an SQL `INSERT` command into the `transactions` table in `budgetbuddy.db`.
    -   To ensure the UI updates, `addExpenseToList` then calls `fetchTransactions` again to re-fetch the complete, updated list of transactions from the database, which automatically updates the entire UI.

3.  **PDF Import Process**:
    -   On the `/dashboard/import` page, the user selects a PDF file.
    -   On the client-side, the `pdfjs-dist` library reads the file and extracts all text content into a single string.
    -   The raw text is displayed to the user.
    -   When the user clicks "Parse Extracted Text", a client-side parsing function uses a series of regular expressions and string manipulation logic to attempt to identify dates, descriptions, types, and amounts, structuring them into a temporary array of objects.
    -   This parsed data is then displayed in a preview table for user verification. (Note: At this stage, this data is *not* saved to the database).

4.  **AI Savings Suggestions Process**:
    -   On the `/dashboard/savings` page, the `SavingsPageClient` component accesses the transaction history from `AppContext`.
    -   It generates a text-based summary of the user's recent spending and income.
    -   The user adds their financial goals in a textarea.
    -   Upon submission, this combined text (spending summary + goals) is sent as input to the `personalizedSavingsSuggestions` Genkit flow.
    -   This server-side flow passes the data, along with a structured prompt, to the Gemini AI model.
    -   The model returns a JSON object containing a list of suggestions, which is then parsed and displayed on the UI.

---

## 6. Future Goals

-   **Expense Prediction System**: Implement an ML/AI-based prediction system to forecast future expenses, both overall and category-wise. This will include data visualizations to compare actual vs. predicted spending, helping users anticipate future financial needs.
-   **Multi-User Support**: Transition from a single-user model to a multi-user application by integrating a robust authentication system (e.g., Firebase Authentication) and upgrading the database (e.g., to Firestore or PostgreSQL) to associate data with specific user accounts.
-   **Advanced PDF Import**: Move beyond text extraction and preview. Implement a full import workflow, potentially using a Genkit AI flow to clean and structure the parsed data, allow the user to review and edit it, and finally save the verified transactions to the database.
-   **Mobile Application**: Develop a companion mobile app (likely using React Native to leverage existing React expertise) to provide on-the-go access to financial data and tracking.
-   **Data Syncing Across Devices**: For a future multi-user/multi-device setup, ensure that data is seamlessly synced in real-time between web and mobile clients, likely by leveraging a cloud database like Firestore.
-   **Budgeting Features**: Introduce explicit budgeting tools, allowing users to set spending limits for various categories and receive alerts when they are close to exceeding their budget.
