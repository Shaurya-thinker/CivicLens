const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth.routes");
const complaintRoutes = require("./routes/complaint.routes");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  ])
);

const isOriginAllowed = (origin) => {
  // Allow requests without Origin header (curl, Postman, server-to-server)
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("⚡ Socket Client connected:", socket.id);
  socket.on("disconnect", () => console.log("🔌 Socket Client disconnected:", socket.id));
});

const DEMO_ADMIN = {
  email: "admin@example.com",
  password: "password123",
  name: "demo admin",
};

const shouldSeedDemoAdmin = () => {
  // Never seed demo credentials in production unless explicitly enabled.
  if ((process.env.NODE_ENV || "development").toLowerCase() === "production") {
    return process.env.ENABLE_DEMO_ADMIN_SEED === "true";
  }
  return process.env.ENABLE_DEMO_ADMIN_SEED !== "false";
};

const seedDemoAdmin = async () => {
  const existingAdmin = await User.findOne({ email: DEMO_ADMIN.email.toLowerCase() });

  if (existingAdmin) {
    let didUpdate = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      didUpdate = true;
    }

    if (!existingAdmin.isEmailVerified) {
      existingAdmin.isEmailVerified = true;
      existingAdmin.emailVerificationToken = null;
      existingAdmin.emailVerificationExpires = null;
      didUpdate = true;
    }

    if (didUpdate) {
      await existingAdmin.save();
      console.log("🔧 Demo admin account updated");
    } else {
      console.log("ℹ️ Demo admin account already present");
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_ADMIN.password, 12);

  await User.create({
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    password: hashedPassword,
    role: "admin",
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
  });

  console.log("✅ Demo admin account seeded");
};

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware - Required for server to parse JSON data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Secure CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Routes - Authentication and complaint management
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to CivicLens API', 
    version: '1.0.0',
    docs: '/api/docs' // placeholder for future docs
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;

  res.json({
    title: 'CivicLens API Documentation',
    version: '1.0.0',
    baseUrl,
    endpoints: {
      auth: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user',
          body: { name: 'string', email: 'string', password: 'string' }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login and get JWT token',
          body: { email: 'string', password: 'string' }
        }
      },
      complaints: {
        getPublicComplaints: {
          method: 'GET',
          path: '/api/complaints/public',
          description: 'Get public complaints feed (sanitized fields, no user identity)'
        },
        create: {
          method: 'POST',
          path: '/api/complaints',
          description: 'Create a new complaint (Citizen only)',
          auth: 'Bearer token required',
          body: { title: 'string', description: 'string', category: 'string' }
        },
        getMyComplaints: {
          method: 'GET',
          path: '/api/complaints/my',
          description: 'Get complaints created by logged-in user',
          auth: 'Bearer token required'
        },
        getAllComplaints: {
          method: 'GET',
          path: '/api/complaints',
          description: 'Get all complaints (Admin only)',
          auth: 'Bearer token required'
        },
        updateStatus: {
          method: 'PATCH',
          path: '/api/complaints/:id/status',
          description: 'Update complaint status (Admin only)',
          auth: 'Bearer token required',
          body: { status: 'string' }
        }
      },
      health: {
        check: {
          method: 'GET',
          path: '/health',
          description: 'Server health check'
        }
      }
    },
    categories: ['Garbage', 'Road', 'Street Light', 'Water', 'Electricity', 'Other'],
    statuses: ['Pending', 'In Progress', 'Resolved']
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/civiclens";

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongoOptions)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    if (shouldSeedDemoAdmin()) {
      await seedDemoAdmin();
    } else {
      console.log("ℹ️ Demo admin seeding disabled for this environment");
    }

    console.log(`🔐 Allowed CORS origins: ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(", ") : "(none configured)"}`);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ WebSocket Server attached`);
    });
  })
  .catch((err) => {
    console.log("❌ DB Connection Error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});