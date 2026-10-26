# 📘 SecureCloud: Comprehensive Project, Setup & User Guide

A complete, end-to-end guide explaining the architecture, design principles, installation instructions, and step-by-step user workflows for **Secure Cloud File Sharing with Blockchain-Based Audit Logs**.

---

## 📑 Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Cryptographic Architecture & Security Model](#2-cryptographic-architecture--security-model)
3. [Step-by-Step Setup Guide](#3-step-by-step-setup-guide)
   - [Prerequisites](#prerequisites)
   - [Backend Configuration & Installation](#backend-configuration--installation)
   - [Admin Account Bootstrapping](#admin-account-bootstrapping)
   - [Frontend Configuration & Installation](#frontend-configuration--installation)
   - [Running Both Servers Locally](#running-both-servers-locally)
4. [Step-by-Step User Guide (How to Use SecureCloud)](#4-step-by-step-user-guide-how-to-use-securecloud)
   - [Workflow 1: User Registration & Admin Approval](#workflow-1-user-registration--admin-approval)
   - [Workflow 2: Encrypting and Uploading Files to Your Vault](#workflow-2-encrypting-and-uploading-files-to-your-vault)
   - [Workflow 3: Managing Files & Direct Downloads](#workflow-3-managing-files--direct-downloads)
   - [Workflow 4: Creating Time-Locked, Recipient-Bound Shares](#workflow-4-creating-time-locked-recipient-bound-shares)
   - [Workflow 5: Recipient File Access & Decrypted Download](#workflow-5-recipient-file-access--decrypted-download)
   - [Workflow 6: Revoking Access & Tracking Download Analytics](#workflow-6-revoking-access--tracking-download-analytics)
   - [Workflow 7: Verifying File Integrity via SHA-256](#workflow-7-verifying-file-integrity-via-sha-256)
   - [Workflow 8: Auditing the Blockchain Ledger & Activity Timeline](#workflow-8-auditing-the-blockchain-ledger--activity-timeline)
   - [Workflow 9: Administrator Controls & System Management](#workflow-9-administrator-controls--system-management)
5. [API Reference Summary](#5-api-reference-summary)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Project Overview & Problem Statement

### The Problem
Traditional centralized cloud storage systems (such as generic Google Drive or Dropbox implementations) suffer from fundamental security challenges:
1. **Plaintext Vulnerability at Rest**: Storing uploaded files in plaintext on server disk drives leaves sensitive corporate documents vulnerable to insider theft, compromised storage buckets, or unauthorized file system access.
2. **Mutable & Tamperable Audit Logs**: Traditional database logs can be altered, truncated, or forged by database administrators or attackers with database access, making post-incident forensic investigations unreliable.
3. **Loose Recipient Authorization**: Standard public file links rely merely on possessing a URL. If a shareable link leaks, anyone on the internet can download the file.

### The Solution: SecureCloud Zero-Trust Architecture
SecureCloud solves these vulnerabilities by combining:
* **Server-Side AES-256 Encryption at Rest**: Every uploaded file is encrypted with AES-256-CBC and randomized Initialization Vectors (IV) before writing to persistent storage. Plaintext is never stored on disk.
* **Persistent SHA-256 Blockchain Audit Trail**: Every sensitive operation (upload, share creation, download, revocation, and deletion) is permanently recorded in a cryptographically linked SHA-256 blockchain ledger that persists to disk across server restarts. Any modification to a past block invalidates the entire subsequent chain.
* **Dual-Audit Persistence**: Real-time querying is powered by indexed MongoDB Atlas records, while non-repudiation is guaranteed by the cryptographic blockchain.
* **Strict Recipient-Bound Access**: Shareable links are cryptographically tied to the intended recipient's email. Even with the link token, unauthorized users are denied access and flagged in the security audit logs.
* **Client-Side SHA-256 Verification**: Users can compute independent SHA-256 digests directly inside their browser to verify that downloaded documents are byte-for-byte identical to the original file.

---

## 2. Cryptographic Architecture & Security Model

```
[Client File] ──> [Upload (JWT Authenticated)]
                      │
                      ├──> AES-256-CBC Encryption Engine (Random 16-byte IV)
                      │       └──> Stores Ciphertext [IV + Encrypted Data] in `uploads/`
                      │
                      ├──> MongoDB Atlas
                      │       └──> Stores Metadata (Filename, Size, Timestamp, UploadedBy)
                      │
                      ├──> SHA-256 Blockchain Engine
                      │       └──> Mines Block: [Index, Timestamp, Payload, PrevHash, Hash]
                      │       └──> Persists to `data/blockchain_data.json`
                      │
                      └──> MongoDB Audit Log
                              └──> Records IP, User ID, Timestamp, Action ('UPLOAD')
```

### Encryption Key Management
* Keys are derived using PBKDF2/scrypt key-derivation functions (`crypto.scryptSync`) from a secret master seed.
* Each file prepends its unique 16-byte random IV, ensuring that even two identical files produce entirely different ciphertexts.
* During downloads, the IV is stripped, the payload is decrypted in-memory, and the plaintext buffer is streamed directly to the authorized recipient.

---

## 3. Step-by-Step Setup Guide

### Prerequisites
Ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher (`node -v`)
* **npm**: v9.0.0 or higher (`npm -v`)
* **MongoDB Atlas Database**: A free MongoDB Atlas cluster connection URI (`mongodb+srv://...`)
* **Git**: Installed and configured on your system

---

### Backend Configuration & Installation

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd secure-cloud-backend
   ```

2. Install all required dependencies:
   ```bash
   npm install
   ```

3. Configure the backend environment file:
   Create or verify the `.env` file in `secure-cloud-backend/`:
   ```env
   # MongoDB Atlas Connection URI
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.evjo4q7.mongodb.net/securecloud?retryWrites=true&w=majority&appName=Cluster0

   # JWT Master Secret (used for token signing & key derivation)
   JWT_SECRET=securecloud_jwt_2026_04_27_change_me

   # Optional distinct file encryption secret
   FILE_ENCRYPTION_SECRET=super_secure_vault_file_encryption_secret_key_2026

   # Server Port
   PORT=5001

   # Authorized Frontend URL for CORS
   FRONTEND_URL=http://localhost:5173
   ```

---

### Admin Account Bootstrapping

To create an initial Administrator account with pre-approved permissions:

```bash
# In the secure-cloud-backend directory:
node createAdmin.js admin@securecloud.com AdminPassword123! admin
```

Output:
```text
🚀 Connecting to MongoDB...
✅ Connected to MongoDB
✅ User "admin@securecloud.com" created with role "admin" and status "approved"!
🔌 Disconnected from MongoDB.
```

---

### Frontend Configuration & Installation

1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd secure-cloud-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the frontend environment file:
   Create or verify the `.env` file in `secure-cloud-frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:5001
   ```

4. Verify that the frontend builds without errors:
   ```bash
   npm run build
   ```

---

### Running Both Servers Locally

#### Terminal 1 (Backend API):
```bash
cd secure-cloud-backend
npm run dev
# Or: node server.js
```
Expected output:
```text
🔌 .env loaded
🧠 DB connection function called
🚀 Middleware initialized
📡 Routes mounted
✅ MongoDB Connected: cluster0.evjo4q7.mongodb.net
✅ SecureCloud Server running on port 5001
```

#### Terminal 2 (Frontend Client):
```bash
cd secure-cloud-frontend
npm run dev
```
Expected output:
```text
  VITE v7.1.1  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 4. Step-by-Step User Guide (How to Use SecureCloud)

### Workflow 1: User Registration & Admin Approval

1. Click **Register** on the top navigation bar.
2. Select an **Account Role**:
   * **Standard User**: Instantly activated. Allows uploading files, managing personal shares, and downloading received documents.
   * **Administrator**: Enters a pending status and requires approval from an existing administrator before system access is granted.
3. If signing up as an Admin, an administrator can approve the request from the **Admin** tab.

---

### Workflow 2: Encrypting and Uploading Files to Your Vault

1. Sign in to your account.
2. Click on the **Upload** tab in the top navigation.
3. Drag and drop any supported document (`.pdf`, `.docx`, `.jpg`, `.png` up to 25MB) into the dropzone, or click to choose a file.
4. Click **Encrypt & Upload to Vault**.
5. The application:
   * Encrypts the file using AES-256-CBC with a randomized 128-bit IV before committing to disk.
   * Mines a new block on the SHA-256 blockchain ledger.
   * Displays the new Block Index and SHA-256 Block Hash confirmation.

---

### Workflow 3: Managing Files & Direct Downloads

1. Navigate to the **My Vault** tab.
2. You will see a list of all your uploaded files, complete with:
   * Original file name
   * Formatted file size (KB / MB)
   * **AES-256 At-Rest** security badge
   * Upload timestamp
3. **Search**: Use the search bar to locate files instantly by name.
4. **Download**: Click **Download** on any file card. The server verifies your ownership, decrypts the file on the fly, and streams the decrypted file directly to your browser.
5. **Delete**: Click **Delete** to permanently remove the file from storage and revoke all associated share links. A `FILE_DELETE` block is added to the blockchain.

---

### Workflow 4: Creating Time-Locked, Recipient-Bound Shares

1. In **My Vault**, click the **Share** button next to any file.
2. In the share modal:
   * **Recipient Email Address**: Enter the recipient's email address (e.g., `recipient@example.com`). Only this account can decrypt the file.
   * **Expiration Time (Optional)**: Pick an expiry date and time. After this timestamp, the link will self-destruct.
3. Click **Generate Share Link**.
4. Click **Copy** to copy the unique share URL (e.g., `http://localhost:5173/download/4c23c7a0-0bf9-45c1-bd93-6bdf91e137b0`).

---

### Workflow 5: Recipient File Access & Decrypted Download

1. When a recipient opens the share link (`/download/:token`):
   * If not logged in, they are prompted to sign in with their recipient credentials.
   * If logged in under an email that does **not** match the intended recipient, access is blocked and logged as `DOWNLOAD_ACCESS_DENIED`.
   * If the expiration date has passed, access is rejected with `⏰ Link has expired`.
2. When the authorized recipient clicks **Download & Decrypt File**:
   * The server authenticates the recipient and checks the link status.
   * The file is decrypted and streamed directly to the user's downloads folder.
   * The share download counter is automatically incremented.
   * A `DOWNLOAD_VIA_SHARE` block is recorded on the blockchain.

---

### Workflow 6: Revoking Access & Tracking Download Analytics

1. Click on the **Shares** tab.
2. Select the **Sent by Me** sub-tab:
   * View all active share grants you have generated.
   * Inspect the **Analytics Badge** (`📥 X downloads`) to monitor how many times the recipient downloaded the file.
   * Check expiration statuses (`Active` vs `Expired`).
3. **Revocation**: Click **Revoke** on any active share. Access is immediately terminated, and a `REVOKE_SHARE_ACCESS` block is appended to the blockchain.
4. Select the **Received by Me** sub-tab to see files shared with you by other users, ready for one-click decrypted download.

---

### Workflow 7: Verifying File Integrity via SHA-256

To cryptographically prove that a downloaded file is 100% untampered:
1. Click the **Verifier** tab in the navigation bar.
2. In the left column (**Original Document**), select the original file from your computer.
3. In the right column (**Downloaded Document**), select the file that was downloaded from SecureCloud.
4. The client computes the SHA-256 cryptographic hashes in your browser using CryptoJS.
5. If both hashes are identical, a green verification badge confirms that the file is authentic and unaltered.

---

### Workflow 8: Auditing the Blockchain Ledger & Activity Timeline

#### Cryptographic Blockchain (`Blockchain` tab):
* View the live sequence of SHA-256 blocks stored in `data/blockchain_data.json`.
* Verify that the ledger status reports **Chain Valid & Untampered**.
* Click any block to expand its payload, timestamp, SHA-256 hash, and previous block hash.
* Search blocks by event type, file name, or cryptographic hash.

#### Audit Trail (`Audit Trail` tab):
* Filter MongoDB audit logs by **User Email**, **Event Action** (e.g., `UPLOAD`, `SHARE_FILE`, `DOWNLOAD_VIA_LINK`, `REVOKE_ACCESS`), or **Date Range**.
* Inspect client IP addresses and metadata for any security event.

#### Activity Timeline (`Timeline` tab):
* View a chronological feed of all file sharing events across the organization.
* Color-coded icons display upload, download, share, and revocation events with real-time timestamps.

---

### Workflow 9: Administrator Controls & System Management

*(Visible only to authenticated users with the `admin` role)*

1. Navigate to the **Admin** tab.
2. **System Health & Metrics**:
   * Inspect total users, pending approval requests, total files, active share links, audit events, and blockchain health.
3. **Pending Role Approvals**:
   * Review users who requested the administrator role during signup.
   * Click **Approve** to activate their administrative privileges or **Reject** to decline.
4. **User Directory**:
   * Browse all registered accounts.
   * Promote or demote users between `User` and `Admin` roles.
   * Delete decommissioned accounts.

---

## 5. API Reference Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Rate Limited (30/15m) | Register user account (admin role requires approval) |
| `POST` | `/api/auth/login` | Rate Limited (30/15m) | Authenticate user & return 8h JWT token |
| `GET` | `/api/auth/stats` | Admin Only | Return system statistics and blockchain health |
| `GET` | `/api/auth/pending` | Admin Only | List users waiting for administrative approval |
| `PATCH` | `/api/auth/approve/:id` | Admin Only | Approve pending user registration |
| `PATCH` | `/api/auth/reject/:id` | Admin Only | Reject pending user registration |
| `GET` | `/api/auth/users` | Admin Only | List all registered user accounts |
| `PATCH` | `/api/auth/user/:id/role` | Admin Only | Update account role (user / admin) |
| `DELETE` | `/api/auth/user/:id` | Admin Only | Delete user account |
| `POST` | `/api/upload` | Auth (`upload`) | Upload file with AES-256 encryption & blockchain block |
| `GET` | `/api/upload/my-files` | Auth | Get files uploaded by current user |
| `GET` | `/api/upload/download/:id` | Auth (`download`) | Download & stream decrypted file directly |
| `DELETE` | `/api/upload/delete/:id` | Auth (`revoke`) | Delete file & remove disk ciphertext |
| `GET` | `/api/upload/chain` | Public / Auth | Return persistent blockchain blocks & health status |
| `POST` | `/api/share` | Auth | Create recipient-bound token share with optional expiry |
| `GET` | `/api/share/my-shares` | Auth | List shares created by current user with analytics |
| `GET` | `/api/share/received-shares` | Auth | List files shared with current user |
| `DELETE` | `/api/share/revoke/:id` | Auth | Revoke active file share link |
| `GET` | `/api/share/details/:token` | Auth (Recipient) | Retrieve file name, sharer, and expiry for token |
| `GET` | `/api/share/download/:token` | Auth (Recipient) | Decrypt & download file via share token |
| `GET` | `/api/audit-log` | Auth | Paginated, filterable MongoDB audit logs |

---

## 6. Troubleshooting & FAQs

### Q: MongoDB Atlas connection fails with `querySrv ENOTFOUND` or DNS error
* **Solution**: Your local network or ISP DNS resolver is blocking SRV records. The backend includes `dns.setServers(['8.8.8.8', '1.1.1.1'])` in `createAdmin.js` and `config/db.js` to ensure public Google and Cloudflare DNS resolvers are used.

### Q: "Access Denied: You are not the intended recipient of this file"
* **Solution**: SecureCloud uses zero-trust recipient verification. When accessing a link at `/download/:token`, ensure that you are signed in using the email specified when the share was created.

### Q: Does the blockchain reset if I restart the backend server?
* **Solution**: No. The blockchain is persisted to disk in `secure-cloud-backend/data/blockchain_data.json`. When the server boots up, it reconstructs the chain and verifies all cryptographic block hashes from disk.

### Q: Can an attacker read uploaded files by accessing the server's `uploads/` directory?
* **Solution**: No. Files stored in `uploads/` are fully encrypted with AES-256-CBC. Even with root access to the storage directory, the files cannot be read without the encryption keys.

---

*SecureCloud Zero-Knowledge Cryptographic File Sharing & Blockchain Audit Engine © 2026*
