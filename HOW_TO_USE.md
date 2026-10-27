# How to Set Up and Use SecureChain Cloud

A simple guide. Follow the steps in order.

---

## What is this app?

It is a website where you can:

- **Upload files.** They are locked (encrypted) before they are saved.
- **Share files** with one person, using their email address.
- **See a history** of everything that happened (upload, share, download, delete).
  This history is stored in a "blockchain", so nobody can secretly change it.

The project has two parts:

| Part | Folder | What it does | Address |
|------|--------|--------------|---------|
| Backend (server) | `secure-cloud-backend` | Saves files, checks logins, keeps the history | http://localhost:5001 |
| Frontend (website) | `secure-cloud-frontend` | The pages you see in the browser | http://localhost:5173 |

You must run **both** at the same time.

---

## What you need first

1. **Node.js** (version 18 or newer). Download it from https://nodejs.org.
   To check, open a terminal and type `node -v`.
2. **A MongoDB database.** Pick one:
   - **Easy (online, free):** make a free account at https://www.mongodb.com/atlas, create a cluster,
     and copy its connection string. It looks like
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/securecloud`.
     In Atlas, under **Network Access**, allow your IP address (or `0.0.0.0/0` for testing).
   - **Local:** install MongoDB Community Server. Your connection string is
     `mongodb://127.0.0.1:27017/securecloud`.

---

## Setup (one time only)

### Step 1: Set up the backend

Open a terminal in the project folder and run:

```bash
cd secure-cloud-backend
npm install
```

Now make the settings file. Copy `.env.example` to a new file named `.env`:

```bash
# Windows (PowerShell or CMD)
copy .env.example .env

# Mac / Linux / Git Bash
cp .env.example .env
```

Open `.env` and fill it in:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=any-long-random-text-you-make-up
PORT=5001
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Important:** your files are locked with `JWT_SECRET`.
> If you change it later, **old files can't be opened any more.** Pick it once and keep it.

### Step 2: Create your admin account

Still inside `secure-cloud-backend`, run (use your own email and password):

```bash
node createAdmin.js admin@example.com MyPassword123
```

You should see: `✅ User "admin@example.com" created with role "admin"`.

### Step 3: Set up the frontend

Open a **second** terminal in the project folder:

```bash
cd secure-cloud-frontend
npm install
```

Make its settings file:

```bash
# Windows
copy .env.example .env

# Mac / Linux / Git Bash
cp .env.example .env
```

It only needs one line (already filled in):

```env
VITE_API_BASE_URL=http://localhost:5001
```

---

## Start the app (every time)

**Terminal 1: backend**

```bash
cd secure-cloud-backend
npm start
```

Wait until you see both of these lines:

```
✅ SecureCloud Server running on port 5001
✅ MongoDB connected
```

**Terminal 2: frontend**

```bash
cd secure-cloud-frontend
npm run dev
```

Now open **http://localhost:5173** in your browser. 🎉

To stop the app, press `Ctrl + C` in each terminal.

---

## How to use it

### 1. Make an account and sign in
- Click **Register** and enter your email and password.
- Choose **Standard User**. You can use the app right away.
- If you choose **Administrator**, an existing admin must approve you first.

### 2. Upload a file
- Go to **Upload**, pick a file, and click **Encrypt & Upload to Vault**.
- Allowed types: **PDF, DOCX, JPG, PNG**. Maximum size: **25 MB**.

### 3. See your files
- Go to **My Vault**. Here you can **Download**, **Share**, or **Delete** each file.

### 4. Share a file with someone
1. In **My Vault**, click **Share** next to a file.
2. Type the other person's email address. They must have an account with **that same email**.
3. (Optional) Choose an expiry date. After that date the link stops working.
4. Click **Generate Share Link**, then **Copy**, and send the link to them (chat, email, etc.).

### 5. Open a shared file (for the person receiving it)
- Open the link. Sign in with the email the file was shared with.
- Click **Download & Decrypt File**.
- Nobody else can use the link, even if they have it.

### 6. Stop sharing
- Go to **Shares** and click **Revoke** to turn off a link right away.
- Deleting a file also turns off all of its links.

### 7. Check the history
- **Audit Trail:** a list of all your actions (uploads, shares, downloads, and so on).
- **Timeline:** the same history, shown as a timeline.
- **Blockchain:** every action as a "block". If it shows **Valid**, nothing was changed.

### 8. Check a file is not changed
- Go to **Verifier**. Pick the original file on the left and the downloaded file on the right.
- If they match, you see a ✅. The file is exactly the same.

### 9. Admin only
Sign in with your admin account and open the **Admin** tab. You can:
- Approve or reject people who asked to be admins.
- Make a user an admin, or turn an admin back into a user.
- Delete users.
- See totals (users, files, shares, blockchain blocks).

---

## Who can do what

| Action | Normal user | Admin |
|--------|:-----------:|:-----:|
| Upload files | ✅ | ✅ |
| Download **own** files | ✅ | ✅ |
| Download **other people's** files | ❌ (only through a share link sent to them) | ✅ |
| Delete **own** files | ✅ | ✅ |
| Delete **other people's** files | ❌ | ✅ |
| See **own** history | ✅ | ✅ |
| See **everyone's** history | ❌ | ✅ |
| Manage users | ❌ | ✅ |

---

## Problems and fixes

| Problem | Fix |
|---------|-----|
| `MongoDB connection error` | Check `MONGO_URI` in `secure-cloud-backend/.env`. On Atlas, allow your IP in **Network Access**. |
| Website says "Network Error" or nothing loads | The backend is not running. Start it in Terminal 1. |
| `EADDRINUSE` (port 5001 is already in use) | The backend is already running in another window. Close it, or change `PORT` in the backend `.env` **and** `VITE_API_BASE_URL` in the frontend `.env`. |
| "Session expired, please log in again" | Normal. Logins last 8 hours. Just sign in again. |
| "Access Denied: You are not the intended recipient" | Sign in with the **exact** email the file was shared with. |
| "Your account is pending approval" | You asked to be an admin. An admin must approve you in the **Admin** tab. |
| "Too many authentication attempts" | Too many logins in a short time. Wait 15 minutes. |
| Downloaded file won't open / looks broken | `JWT_SECRET` was changed after the file was uploaded. Put the old value back. |
| Forgot the admin password | Run `node createAdmin.js your@email.com NewPassword` again in `secure-cloud-backend`. |
| No share email arrives | Normal. Email is optional and off by default. Copy the link and send it yourself. |

---

## Optional: share emails

The app can send a test email when you share a file. It uses https://ethereal.email,
a fake inbox for testing, so no real emails are sent.

1. Go to https://ethereal.email and click **Create Ethereal Account**.
2. Add these two lines to `secure-cloud-backend/.env`:
   ```env
   ETHEREAL_USER=the-username-it-gives-you
   ETHEREAL_PASS=the-password-it-gives-you
   ```
3. Restart the backend. After sharing, the backend terminal shows a **Preview URL** where you can see the email.

---

## Keep these safe

- **Never** upload your `.env` files to GitHub. They hold your database password and secret key.
  (They are already listed in `.gitignore`.)
- Uploaded files are stored, locked, in `secure-cloud-backend/uploads/`.
- The blockchain history is stored in `secure-cloud-backend/data/blockchain_data.json`.
  Don't edit this file by hand, or the chain will show as **invalid**.
