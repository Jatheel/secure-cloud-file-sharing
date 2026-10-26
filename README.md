# **Secure Cloud File Sharing with Blockchain-Based Audit Logs**

A modern, full-stack secure file-sharing platform that combines centralized performance with blockchain-level transparency and immutability. This proof-of-concept demonstrates how to build a trusted file-sharing system with comprehensive audit logging, JWT authentication, and role-based access control.

**Live Demo**: http://localhost:5173  
**GitHub**: https://github.com/Jatheel/secure-cloud-file-sharing  
**Detailed Guide**: [Complete Project & Setup Guide (PROJECT_GUIDE.md)](./PROJECT_GUIDE.md)

---

## 🏛️ High-Level System Architecture

The platform operates on a defense-in-depth zero-trust model combining client-side cryptographic hashing, server-side AES-256 encryption at rest, dual-layer immutable audit logging (MongoDB Atlas + persistent SHA-256 Blockchain), and tokenized recipient authorization:

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (React 19 + Vite + Tailwind CSS)"]
        UI["Web Interface (Vault, Admin, Shares, Verifier, Timeline)"]
        ClientCrypto["CryptoJS (Client-Side SHA-256 File Integrity)"]
        AxiosAPI["Axios Client (Bearer Token Interceptor)"]
    end

    subgraph SecurityLayer["🛡️ Security & API Gateway (Express.js)"]
        Helmet["Helmet HTTP Security Headers"]
        Cors["CORS Policy Enforcement"]
        RateLimit["Rate Limiter (Brute-Force Guard)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
    end

    subgraph CoreServices["⚙️ Backend Core Services"]
        UploadHandler["File Upload & Stream Controller"]
        EncEngine["AES-256-CBC Encryption Engine (Randomized IV)"]
        ShareService["Share Token & Expiration Manager"]
        AdminService["Admin Role & System Metrics Service"]
    end

    subgraph PersistenceLayer["💾 Cryptographic Storage & Persistence Layer"]
        DiskVault[("🔒 Encrypted Disk Vault (AES-256 Ciphertext)")]
        MongoAtlas[("🍃 MongoDB Atlas (Users, File Metadata, Shares, Audit Logs)")]
        BlockchainLedger[("⛓️ SHA-256 Blockchain Ledger (data/blockchain_data.json)")]
    end

    UI --> AxiosAPI
    ClientCrypto -.-> UI
    AxiosAPI -->|REST API Requests| RateLimit
    RateLimit --> Helmet --> Cors --> AuthMiddleware
    AuthMiddleware --> UploadHandler & ShareService & AdminService

    UploadHandler --> EncEngine
    EncEngine -->|Write Ciphertext| DiskVault
    UploadHandler -->|Store File Metadata| MongoAtlas
    UploadHandler -->|Mine Block with SHA-256 Hash| BlockchainLedger

    ShareService -->|Store Share Grants & Revocations| MongoAtlas
    ShareService -->|Log Share Operations| BlockchainLedger

    AdminService -->|Approval Workflow & System Metrics| MongoAtlas
```


### 🔐 Architectural Pillars
1. **Zero-Knowledge Privacy at Rest**: Files are encrypted with AES-256-CBC using randomized 128-bit Initialization Vectors (IV) before commit to disk. Plaintext is never stored on disk.
2. **Dual-Audit Persistence**:
   - **MongoDB Atlas**: Fast operational querying, compound indexing on email/timestamp, and multi-field filtering.
   - **SHA-256 Blockchain Ledger**: Cryptographically linked block sequence where each block stores the previous block's hash. Persisted to disk in `data/blockchain_data.json` across server restarts.
3. **Strict Recipient-Only Grants**: File shares generate UUID tokens bound to the designated recipient's authenticated email. Access is strictly rejected if an unauthorized user attempts to download.
4. **Client-Side Non-Repudiation**: Browser-based CryptoJS SHA-256 verification allows recipients to confirm that decrypted files match the uploader's original byte-for-byte.

---

## **✨ Features Status**

### **✅ Completed & Working Features**

- ✅ **User Authentication**: JWT-based login/registration with email validation and brute-force rate limiting
- ✅ **Self-Service Registration**: Users can sign up; admin role requires approval workflow
- ✅ **Admin Approval System**: Admins approve or reject pending user registrations with one click
- ✅ **Admin Dashboard**: Real-time system metrics cards, pending approval queue, and user account directory
- ✅ **Role-Based Access Control (RBAC)**: User, auditor, and admin roles with permission simulation
- ✅ **AES-256 File Encryption at Rest**: Files encrypted on disk with randomized IVs and decrypted on streaming
- ✅ **Persistent Blockchain Audit Ledger**: SHA-256 linked block sequence persisted to disk across server restarts
- ✅ **My Files Vault**: Dashboard showing user's encrypted files with size, date, direct download, and quick-share
- ✅ **File Sharing with Access Grants**: Share files via UUID tokens with recipient-identity enforcement
- ✅ **Share Analytics**: Track and display download counters on every shared link in real time
- ✅ **Recipient-Only Downloads**: Only authenticated recipients can download and decrypt shared files
- ✅ **Time-Limited Shares**: Expiration dates with automatic link revocation and countdown badges
- ✅ **Instant Revoke Access**: Owner or admin can revoke any active share link at any time
- ✅ **Unified Share Management**: Dedicated sub-tabs for "Sent by Me" and "Received by Me" with search filters
- ✅ **Security Activity Timeline**: Chronological vertical feed of system security events with action badges
- ✅ **Client-Side Integrity Verifier**: Compute and compare SHA-256 digests in-browser to verify zero tampering
- ✅ **Comprehensive Audit Logging**: MongoDB audit logs with user, IP, action, timestamps, and metadata
- ✅ **Token Expiry Detection**: Proactive client-side token validation preventing session errors
- ✅ **Modular React Architecture**: Clean component architecture (<300 lines each) with unified API services
- ✅ **Security Hardening**: Helmet security headers, rate limiting, and sanitized CORS origins

---

## **🛠️ Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19.1.0, Vite, Tailwind CSS, Axios, CryptoJS | Modern SPA with responsive UI and client-side encryption |
| **Backend** | Node.js v25+, Express.js 4.18+ | High-performance API server with middleware |
| **Database** | MongoDB Atlas, Mongoose | Flexible NoSQL database for data persistence |
| **Authentication** | JWT (jsonwebtoken), bcryptjs | Stateless auth with secure password hashing |
| **File Handling** | Multer, fs | Multipart form handling and disk storage |
| **Blockchain** | Custom implementation (SHA-256 linked blocks) | Tamper-evident audit log structure |
| **Email** | Nodemailer | Email notifications (Ethereal test service) |
| **Utilities** | DatePicker, react-datepicker, CryptoJS | UI components and cryptography |

---

## **📋 Prerequisites**

- **Node.js** v18+ (tested on v25.2.1)
- **npm** or **yarn**
- **MongoDB Atlas** account (free tier works) with connection string
- **Git** for version control
- **Postman/cURL** for API testing (optional)

---

## **🚀 Installation & Setup**

### **1. Clone the Repository**

```bash
git clone https://github.com/Jatheel/secure-cloud-file-sharing.git
cd secure-cloud-file-sharing
```

### **2. Backend Setup**

Navigate to the backend directory and install dependencies:

```bash
cd secure-cloud-backend
npm install
```

#### **Configure Environment Variables**

Create a `.env` file in `secure-cloud-backend/` and add:

```env
# MongoDB Connection String (get from MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/securecloud?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret (use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production

# Server Port
PORT=5001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Credentials (Ethereal test service or your email provider)
ETHEREAL_USER=your_ethereal_email@ethereal.email
ETHEREAL_PASS=your_ethereal_password
```

**Get your MongoDB connection string:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Click "Connect" → "Connect to your application"
4. Copy the connection string and replace username/password

### **3. Frontend Setup**

Open a new terminal and navigate to the frontend directory:

```bash
cd secure-cloud-frontend
npm install
```

**Frontend runs on port 5173 by default** (configured in `vite.config.js`)

---

## **▶️ Running the Application**

### **Start Backend Server** (Terminal 1)

```bash
cd secure-cloud-backend
npm start
```

Expected output:
```
✅ Server running on port 5001
✅ MongoDB connected
📡 Routes mounted
```

### **Start Frontend Dev Server** (Terminal 2)

```bash
cd secure-cloud-frontend
npm run dev
```

Expected output:
```
VITE v7.1.1  ready in 314 ms
➜  Local:   http://localhost:5173/
```

### **Access the Application**

Open your browser and go to: **http://localhost:5173**

---

## **📁 Project Structure**

```
secure-cloud-file-sharing/
├── secure-cloud-backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth logic (login, register, approval)
│   │   └── roleController.js     # Role management
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # Permission checking
│   │   └── uploadMiddleware.js   # Multer config
│   ├── models/
│   │   ├── User.js               # User schema with approval workflow
│   │   ├── File.js               # File metadata
│   │   ├── Share.js              # Share records with tokens
│   │   ├── AuditLog.js           # Audit log entries
│   │   └── Role.js               # Role definitions
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── upload.js             # File upload/download
│   │   ├── share.js              # File sharing
│   │   ├── roles.js              # Role management
│   │   └── auditLog.js           # Audit log queries
│   ├── utils/
│   │   ├── blockchain.js         # SHA-256 linked blocks
│   │   └── email.js              # Email notifications
│   ├── uploads/                  # Local file storage
│   ├── server.js                 # Express app setup
│   ├── .env                      # Environment config
│   └── package.json
│
├── secure-cloud-frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app component
│   │   ├── LoginPage.jsx         # Login/signup form
│   │   ├── DownloadComponent.jsx # Download page
│   │   ├── App.css               # Tailwind styles
│   │   ├── main.jsx              # React entry point
│   │   └── assets/               # Static files
│   ├── vite.config.js            # Vite configuration
│   ├── package.json
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── index.html
│
└── README.md
```

---

## **🔌 API Endpoints**

### **Authentication**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user, get JWT token | ❌ |
| GET | `/api/auth/pending` | Get pending users (admin only) | ✅ Admin |
| PATCH | `/api/auth/approve/:userId` | Approve pending user | ✅ Admin |
| PATCH | `/api/auth/reject/:userId` | Reject pending user | ✅ Admin |

### **File Upload & Download**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/upload` | Upload file | ✅ User |
| GET | `/api/upload/:fileId` | Download file by ID | ✅ User |
| DELETE | `/api/upload/:fileId` | Delete file | ✅ User/Admin |

### **File Sharing**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/share` | Share file with recipient | ✅ User |
| GET | `/api/share/my-shares` | Get files you shared | ✅ User |
| GET | `/api/share/received-shares` | Get files shared with you | ✅ User |
| GET | `/api/share/download/:token` | Download via share token | ✅ User |
| DELETE | `/api/share/revoke/:shareId` | Revoke file share | ✅ User |

### **Audit Logs**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/auditLog` | Get all audit logs (admin) | ✅ Admin |
| GET | `/api/auditLog/my-logs` | Get your own audit logs | ✅ User |

---

## **👥 User Workflows**

### **Workflow 1: Register as Regular User**

1. Visit http://localhost:5173
2. Click **Sign Up** → Select **User** role
3. Enter email and password → Submit
4. **Instant approval** - You can log in immediately
5. Create account with auto "user" role

### **Workflow 2: Admin Registration**

1. Visit http://localhost:5173
2. Click **Sign Up** → Select **Admin** role
3. Enter email and password → Submit
4. **Pending approval** - Admin must approve you
5. Another admin goes to **Roles** tab and approves your account
6. Once approved, you can log in with admin permissions

### **Workflow 3: Share a File**

1. Log in as user
2. Go to **Upload** tab → Upload a file (PDF, DOCX, JPG, PNG)
3. Go to **Demo** tab → Enter recipient email
4. Set expiry time (optional) → Click **Share**
5. Share token is generated and recipient is notified (if email configured)
6. Recipient can download the file only after authenticating

### **Workflow 4: Download Shared File**

1. Receive share link or email notification
2. Log in to your account (if not already logged in)
3. Go to **Manage Shares** tab
4. View "Files Shared With You" section
5. Click **Download** button to get the file

### **Workflow 5: Verify File Integrity**

1. Download a file from the platform
2. Go to **Technology** tab
3. Upload **original file** and **downloaded file**
4. Click **Verify Integrity**
5. System compares SHA-256 hashes and shows match/mismatch status

---

## **🧪 Testing the API**

### **Test with cURL**

**1. Register User:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"user"}'
```

**2. Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**3. Upload File:**
```bash
curl -X POST http://localhost:5001/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

**4. Share File:**
```bash
curl -X POST http://localhost:5001/api/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileId":"FILE_ID","sharedWith":"recipient@example.com","expiresAt":"2026-12-31"}'
```

### **Test with Postman**

1. Import the endpoints from the API Endpoints table above
2. Set base URL to `http://localhost:5001`
3. Add `Authorization: Bearer YOUR_JWT_TOKEN` header for protected routes
4. Test each endpoint with sample data

---

## **⚠️ Troubleshooting**

### **Backend won't start on port 5001**

**Problem:** `EADDRINUSE: address already in use :::5001`

**Solution:**
```bash
# Kill process on port 5001 (Windows PowerShell)
Get-NetTCPConnection -LocalPort 5001 | Stop-Process -Force

# Or restart backend
npm start
```

### **MongoDB connection fails**

**Problem:** `querySrv ENOTFOUND _mongodb._tcp.cluster0...`

**Solution:**
- Verify `MONGO_URI` in `.env` is correct
- Check MongoDB Atlas firewall: Add `0.0.0.0/0` to IP whitelist
- Ensure network access is enabled in Atlas cluster settings
- Backend auto-forces public DNS (Google 8.8.8.8) to bypass local DNS blocking

### **"Could not fetch shared files" error**

**Problem:** Received shares fetch fails

**Solution:**
1. Open browser DevTools (F12) → Console tab
2. Check if token is valid: `console.log(localStorage.getItem('token'))`
3. Verify backend is running: Check if `http://localhost:5001/api/share/my-shares` responds
4. Restart frontend dev server:
   ```bash
   npm run dev  # in secure-cloud-frontend
   ```

### **JWT Token expired - forced logout**

**Problem:** After 8 hours, token expires and you're logged out

**Solution:**
- Frontend automatically detects token expiry before making requests
- You'll be redirected to login page
- Log in again to get a new token (valid for 8 more hours)
- Token expiry is intentional for security

### **Files not uploading - "File type not supported"**

**Problem:** Only PDF, DOCX, JPG, PNG allowed

**Allowed file types:**
- ✅ `.pdf`
- ✅ `.docx`
- ✅ `.jpg`
- ✅ `.jpeg`
- ✅ `.png`

**Solution:** Upload a file with one of the allowed extensions

### **Email notifications not sending**

**Problem:** Share notifications don't arrive

**Solution:** Email is optional - shares work without notifications. To enable:
1. Get Ethereal test email from https://ethereal.email
2. Add credentials to `.env`:
   ```env
   ETHEREAL_USER=your_test_email@ethereal.email
   ETHEREAL_PASS=your_test_password
   ```
3. Or use a real email provider (Gmail, Outlook, etc.) with app password

---

## **🔐 Security Considerations**

- ✅ **Password Hashing**: All passwords hashed with bcryptjs (10 salt rounds)
- ✅ **JWT Tokens**: Signed with secret key, 8-hour expiry
- ✅ **CORS Enabled**: Frontend and backend communicate securely
- ✅ **File Validation**: Only allowed types accepted
- ✅ **Authentication Required**: All sensitive operations require JWT
- ✅ **Role-Based Access**: Admins and users have different permissions
- ⚠️ **TODO**: Add HTTPS/TLS for production
- ⚠️ **TODO**: Implement rate limiting for API endpoints
- ⚠️ **TODO**: Add end-to-end encryption for files

---

## **📊 Audit Logging & Blockchain**

Every critical operation is logged with:
- **Timestamp**: ISO 8601 format
- **User Email**: Who performed the action
- **Action**: upload, share, download, revoke, etc.
- **File ID**: Which file was affected
- **Result**: Success or failure
- **Blockchain Hash**: SHA-256 linked blocks for immutability

Example audit log entry:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fileId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "action": "share",
  "details": "File shared with user@example.com",
  "timestamp": "2026-04-28T12:30:00Z",
  "ipAddress": "192.168.1.100",
  "blockHash": "abc123def456..."
}
```

---

## **🤝 Contributing**

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

### **Development Guidelines**

- Use ES6+ syntax
- Follow existing code style
- Add comments for complex logic
- Test new features before submitting PR
- Update README if adding new features

---

## **📝 License**

This project is open source and available under the MIT License.

---

## **👨‍💼 Author**

**Jatheel MHD**  
GitHub: [@Jatheel](https://github.com/Jatheel)  
Repository: [secure-cloud-file-sharing](https://github.com/Jatheel/secure-cloud-file-sharing)

---

## **📞 Support**

For issues, questions, or suggestions:

1. **GitHub Issues**: Open an issue in the repository
2. **Email**: Check GitHub profile for contact info
3. **Documentation**: See troubleshooting section above

---

**Last Updated:** April 28, 2026  
**Version:** 1.0.0 Beta

