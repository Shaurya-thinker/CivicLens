# CivicLens API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // Optional
  "errors": [] // Optional for validation errors
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen" // Optional: "citizen" or "admin"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}
```

---

## Complaint Endpoints

### Create Complaint
**POST** `/complaints`
**Auth Required:** Yes (Citizen/Admin)

**Request Body:**
```json
{
  "title": "Broken Street Light",
  "description": "The street light on Main Street has been broken for a week",
  "category": "Street Light"
}
```

**Valid Categories:** `"Garbage"`, `"Road"`, `"Street Light"`, `"Water"`, `"Other"`

**Response:**
```json
{
  "success": true,
  "message": "Complaint registered successfully",
  "complaint": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "title": "Broken Street Light",
    "description": "The street light on Main Street has been broken for a week",
    "category": "Street Light",
    "status": "Pending",
    "createdBy": "64f5a1b2c3d4e5f6a7b8c9d0",
    "createdAt": "2023-09-04T10:30:00.000Z",
    "updatedAt": "2023-09-04T10:30:00.000Z"
  }
}
```

### Get My Complaints
**GET** `/complaints/my`
**Auth Required:** Yes (Citizen/Admin)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "complaints": [
    {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "title": "Broken Street Light",
      "description": "The street light on Main Street has been broken for a week",
      "category": "Street Light",
      "status": "In Progress",
      "createdBy": "64f5a1b2c3d4e5f6a7b8c9d0",
      "createdAt": "2023-09-04T10:30:00.000Z",
      "updatedAt": "2023-09-04T12:00:00.000Z"
    }
  ]
}
```

### Get All Complaints (Admin Only)
**GET** `/complaints?page=1&limit=10`
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 3,
  "complaints": [
    {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "title": "Broken Street Light",
      "description": "The street light on Main Street has been broken for a week",
      "category": "Street Light",
      "status": "Pending",
      "createdBy": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2023-09-04T10:30:00.000Z",
      "updatedAt": "2023-09-04T10:30:00.000Z"
    }
  ]
}
```

### Update Complaint Status (Admin Only)
**PATCH** `/complaints/:id/status`
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "status": "In Progress"
}
```

**Valid Statuses:** `"Pending"`, `"In Progress"`, `"Resolved"`

**Response:**
```json
{
  "success": true,
  "message": "Complaint status updated successfully",
  "complaint": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "title": "Broken Street Light",
    "description": "The street light on Main Street has been broken for a week",
    "category": "Street Light",
    "status": "In Progress",
    "createdBy": "64f5a1b2c3d4e5f6a7b8c9d0",
    "createdAt": "2023-09-04T10:30:00.000Z",
    "updatedAt": "2023-09-04T12:00:00.000Z"
  }
}
```

---

## Health Check

### Server Health
**GET** `/health`
**Auth Required:** No

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2023-09-04T10:30:00.000Z"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "message": "Validation failed",
  "errors": [
    "Email is required and must be a valid string",
    "Password must be at least 6 characters long"
  ]
}
```

### Unauthorized (401)
```json
{
  "message": "Access token missing or invalid"
}
```

### Forbidden (403)
```json
{
  "message": "Admin access required"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Route not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting
- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response when exceeded:**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Security Features
- ✅ JWT Authentication with 1-day expiration
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ NoSQL injection prevention
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Security headers (Helmet.js)
- ✅ Role-based access control