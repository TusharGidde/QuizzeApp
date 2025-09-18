const User = require('../models/User');
const { comparePassword, toJSON } = require('../utils/userUtils');
User.prototype.comparePassword = comparePassword;
User.prototype.toJSON = toJSON;
const { generateToken } = require('../middleware/auth');
const {
  asyncHandler,
  ConflictError,
  AuthenticationError,
  NotFoundError
} = require('../middleware/errors');


// Register new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create new user (password will be hashed by the model hook)
  const user = await User.create({
    name,
    email,
    password
  });

  // Generate JWT token
  const token = generateToken(user.id);

  // Log successful registration

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      token
    },
    message: 'User registered successfully'
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log('failed_login_attempt', { email, reason: 'user_not_found' });
    throw new NotFoundError('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log('failed_login_attempt', { email, userId: user.id, reason: 'invalid_password' });
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user.id, user.role);

  // Log successful login
  console.log('user_login', user.id, { email });

  
  res.status(200).json({
    success: true,
    token: token,
    data: {
      user: user.name,
      email: user.email,
      role: user.role
    },
    message: 'Login successful'
  });

});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  // User is already attached to req by authenticateToken middleware
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});



module.exports = {
  register,
  login,
  getProfile,
};