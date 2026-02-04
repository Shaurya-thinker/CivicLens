# CivicLens Backend API

A secure Node.js/Express backend API for the CivicLens citizen complaint management system.

## Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-based Access Control**: Citizen and Admin roles with appropriate permissions
- **Input Validation**: Comprehensive validation and sanitization to prevent injection attacks
- **Security Middleware**: Helmet, CORS, and rate limiting for enhanced security
- **MongoDB Integration**: Mongoose ODM with proper schema validation
- **Error Handling**: Centralized error handling with proper logging

## Security Features

- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ JWT token authentication with expiration
- ✅ NoSQL injection prevention through input sanitization
- ✅ CORS configuration with origin restrictions
- ✅ Rate limiting to prevent abuse
- ✅ Security headers with Helmet.js
- ✅ Input validation and sanitization
- ✅ Environment variable validation

## Setup Instructions

1. **Clone and Navigate**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/civiclens
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Complaints
- `POST /api/complaints` - Create complaint (Citizen)
- `GET /api/complaints/my` - Get user's complaints (Citizen)
- `GET /api/complaints` - Get all complaints (Admin)
- `PATCH /api/complaints/:id/status` - Update complaint status (Admin)

### Health Check
- `GET /health` - Server health status

## Data Models

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['citizen', 'admin'], default: 'citizen'),
  timestamps: true
}
```

### Complaint
```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum: ['Garbage', 'Road', 'Street Light', 'Water', 'Other']),
  status: String (enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending'),
  createdBy: ObjectId (ref: 'User'),
  timestamps: true
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/civiclens |
| `JWT_SECRET` | JWT signing secret | **Required** |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment mode | development |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Error Handling

The API uses consistent error response format:
```javascript
{
  success: false,
  message: \"Error description\",
  errors: [\"Detailed validation errors\"] // Optional
}
```

## Development

```bash
# Install nodemon for development
npm install -g nodemon

# Run in development mode
npm run dev
```

## Security Considerations

- Always use HTTPS in production
- Set strong JWT_SECRET (minimum 32 characters)
- Configure MongoDB with authentication
- Use environment variables for sensitive data
- Regularly update dependencies
- Monitor rate limiting logs
- Implement proper logging and monitoring

## License

ISC