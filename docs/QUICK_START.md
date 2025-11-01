# Hospital Management System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- Git (optional)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Create Environment File
Create a `.env` file in the backend root:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=mongodb://localhost:27017/hospital_management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# EasyPaisa (Get from EasyPaisa merchant portal)
EASYPAISA_API_URL=https://api.easypaisa.com
EASYPAISA_MERCHANT_ID=your-merchant-id
EASYPAISA_SECRET_KEY=your-secret-key
EASYPAISA_STORE_ID=your-store-id

# Expo Push Notifications (Get from Expo.dev)
EXPO_ACCESS_TOKEN=your-expo-access-token

# Email (Optional - for future email notifications)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@hospital.com

# Frontend URLs
FRONTEND_URL=http://localhost:3001
MOBILE_DEEP_LINK=hospitalapp://

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Cache
CACHE_TTL=300
```

### Step 3: Start Development Server
```bash
npm run start:dev
```

### Step 4: Access the Application
- **API Base URL**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api (shows "Hello World!")

---

## 🧪 Testing the API

### 1. Using Swagger UI (Recommended)
1. Open http://localhost:3000/api/docs
2. Browse all available endpoints
3. Click "Try it out" on any endpoint
4. Fill in the request body
5. Click "Execute"

### 2. Using Postman/Thunder Client

#### Create Super Admin (First User)
```http
POST http://localhost:3000/api/auth/register/credentials
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "admin123",
  "firstName": "Super",
  "lastName": "Admin",
  "role": "super_admin"
}
```

#### Login
```http
POST http://localhost:3000/api/auth/login/credentials
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "admin123"
}
```

Response:
```json
{
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Create Hospital
```http
POST http://localhost:3000/api/hospitals
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "City General Hospital",
  "address": {
    "street": "123 Main Street",
    "city": "Karachi",
    "state": "Sindh",
    "postalCode": "75500",
    "country": "Pakistan"
  },
  "contact": {
    "phone": "+92-21-1234567",
    "email": "info@cityhospital.com",
    "website": "https://cityhospital.com"
  },
  "specialties": ["Cardiology", "Neurology", "Pediatrics"],
  "ownerId": "YOUR_OWNER_USER_ID"
}
```

---

## 📱 Mobile App Integration (Google OAuth)

### Patient Registration/Login Flow:
```http
POST http://localhost:3000/api/auth/login/google
Content-Type: application/json

{
  "googleId": "google-user-id",
  "email": "patient@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "profilePicture": "https://...",
  "phone": "+923001234567"
}
```

---

## 🔑 User Roles & Access

| Role | Platform | Auth Method | Permissions |
|------|----------|-------------|-------------|
| Super Admin | Web | Email/Password | Full system access |
| Hospital Owner | Web + Mobile | Email/Password | Hospital management |
| Receptionist | Web | Email/Password | Front desk operations |
| Doctor | Mobile | Google OAuth | Patient consultations |
| Nurse/Staff | Mobile | Google OAuth | Vitals, attendance |
| Patient | Mobile | Google OAuth | Book appointments |

---

## 🏥 Complete Appointment Flow

### 1. Patient Books Appointment
```http
POST /api/appointments
{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "hospitalId": "hospital-id",
  "date": "2024-01-15",
  "timeSlot": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T10:30:00Z"
  },
  "paymentAmount": 1500,
  "appointmentType": "consultation"
}
```

### 2. Process Payment
```http
POST /api/payments/process
{
  "appointmentId": "appointment-id",
  "patientId": "patient-id",
  "amount": 1500,
  "method": "easypaisa",
  "easyPaisaAmountPaid": 1500
}
```

### 3. Receptionist Confirms
```http
PATCH /api/appointments/{id}/confirm
```

### 4. Patient Checks In
```http
PATCH /api/appointments/{id}/checkin
```

### 5. Nurse Records Vitals
```http
PATCH /api/appointments/{id}/vitals
{
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "temperature": 37.0,
  "heartRate": 75,
  "weight": 70,
  "height": 170,
  "oxygenSaturation": 98,
  "notes": "Patient appears healthy"
}
```

### 6. Doctor Completes Checkup
```http
PATCH /api/appointments/{id}/complete
{
  "diagnosis": "Common cold",
  "checkupNotes": "Patient shows symptoms of viral infection",
  "prescriptions": [
    {
      "medicineName": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "5 days",
      "instructions": "Take after meals"
    }
  ]
}
```

---

## 💰 Payment & Refund Flow

### Process Payment (Mixed: EasyPaisa + Wallet)
```http
POST /api/payments/process
{
  "appointmentId": "apt-id",
  "patientId": "patient-id",
  "amount": 2000,
  "method": "mixed",
  "walletAmountUsed": 500,
  "easyPaisaAmountPaid": 1500
}
```

### Request Refund (90% EasyPaisa, 10% Wallet)
```http
POST /api/payments/refund
{
  "paymentId": "payment-id",
  "reason": "Appointment cancelled by doctor",
  "amount": 2000
}
```

Result:
- PKR 1,800 refunded to EasyPaisa
- PKR 200 credited to patient wallet

---

## 👥 Staff Attendance (Location Verified)

### Check In
```http
POST /api/attendance/checkin
{
  "wifiSSID": "HospitalWiFi",
  "gpsCoordinates": {
    "latitude": 24.8607,
    "longitude": 67.0011
  }
}
```

### Check Out
```http
POST /api/attendance/checkout
```

---

## 📊 Analytics & Reports

### Get Dashboard Stats
```http
GET /api/analytics/dashboard/{hospitalId}
```

Response:
```json
{
  "totalAppointments": 1250,
  "todayAppointments": 45,
  "totalPatients": 890,
  "totalRevenue": 1875000,
  "completedAppointments": 1100,
  "attendanceRate": "88.00",
  "noShowRate": "3.20",
  "cancellationRate": "8.80"
}
```

---

## 🔔 Push Notifications

### Register Device Token
```http
POST /api/notifications/register-token
{
  "deviceToken": "ExponentPushToken[xxxxx]"
}
```

### Get Notifications
```http
GET /api/notifications
```

### Mark as Read
```http
PATCH /api/notifications/{id}/read
```

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod --dbpath /path/to/data

# Or use MongoDB Atlas (cloud)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/hospital
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### Google OAuth Not Working
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add callback URL: `http://localhost:3000/api/auth/google/callback`
4. Copy Client ID and Secret to `.env`

### Expo Notifications Not Sending
1. Create Expo account at expo.dev
2. Generate access token
3. Add to `.env` as `EXPO_ACCESS_TOKEN`

---

## 📚 API Documentation

Full interactive API documentation available at:
**http://localhost:3000/api/docs**

Features:
- All endpoints documented
- Try API calls directly from browser
- Request/Response schemas
- Authentication examples
- Error responses

---

## 🎯 Next Steps

1. **Complete Real Integrations**
   - Add real EasyPaisa API credentials
   - Configure Google OAuth properly
   - Set up Expo account for push notifications

2. **Implement Remaining Modules**
   - Staff module (full CRUD)
   - Schedules (doctor availability)
   - Leaves management
   - PDF receipts
   - Excel reports

3. **Add More Features**
   - Email notifications
   - SMS reminders
   - Video consultations
   - Prescription management

4. **Deploy**
   - Use Docker for containerization
   - Deploy to cloud (AWS, Azure, GCP)
   - Set up CI/CD pipeline

---

## 💡 Tips

1. **Use Swagger** for testing - it's the easiest way
2. **Start with Super Admin** - create it first to access all features
3. **Create a Hospital** - needed for most operations
4. **Test the flow** - Follow the appointment flow above
5. **Check logs** - Console shows all requests and errors

---

## 🆘 Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for feature status
2. Review Swagger docs at `/api/docs`
3. Check console logs for detailed errors
4. Ensure all environment variables are set

---

**Happy Coding! 🚀**

