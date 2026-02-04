const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Input validation helper
const validateInput = (data, requiredFields) => {
  const errors = [];
  
  for (const field of requiredFields) {
    // Explicit type check to prevent NoSQL injection
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      errors.push(`${field} is required and must be a valid string`);
    }
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

// Additional security check for NoSQL injection prevention
const sanitizeForMongo = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid input type');
  }
  return value.toString().toLowerCase().trim();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input types and content
    const errors = validateInput({ name, email, password }, ['name', 'email', 'password']);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Validate role parameter
    const validRoles = ['citizen', 'admin'];
    if (role && (typeof role !== 'string' || !validRoles.includes(role.toLowerCase()))) {
      return res.status(400).json({ message: 'Invalid role value' });
    }
    
    // Sanitize all inputs with additional type safety
    const sanitizedName = sanitizeForMongo(name);
    const sanitizedEmail = sanitizeForMongo(email);
    const sanitizedRole = role ? role.toLowerCase() : 'citizen';
    
    // Check if user exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({ 
      name: sanitizedName, 
      email: sanitizedEmail, 
      password: hashedPassword, 
      role: sanitizedRole
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Explicit type check to prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input types' });
    }
    
    // Validate input types and content
    const errors = validateInput({ email, password }, ['email', 'password']);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    // Sanitize email with additional type safety
    const sanitizedEmail = sanitizeForMongo(email);
    
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
};