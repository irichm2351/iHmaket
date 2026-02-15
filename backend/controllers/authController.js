const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send welcome message from admin
const sendWelcomeMessage = async (newUserId) => {
  try {
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.warn('Admin user not found. Welcome message not sent.');
      return;
    }

    const welcomeText = `Welcome to Ihmaket! 🎉

We're thrilled to have you join our marketplace! Ihmaket is a modern online platform where you can:

📌 IF YOU'RE A SERVICE SEEKER (Customer):
• Browse and discover professional service providers in your area
• Search for services by category, location, price, and ratings
• Schedule services at your convenience with your preferred date and time
• Communicate directly with service providers through real-time chat
• Leave reviews and ratings based on your experience
• Save your favorite providers for quick access

💼 IF YOU'RE A SERVICE PROVIDER:
• Create detailed service listings with images and descriptions
• Manage your bookings and track your performance
• Accept or reject service requests with ease
• Build your professional profile and grow your reputation
• Get featured listings to boost your visibility
• Communicate with customers and build long-term relationships

🔐 FOR ALL USERS:
• Safe and secure platform with verified users
• Real-time messaging and notifications
• Complete profile management
• Rating and review system for transparency

To get started, explore our platform and don't hesitate to reach out if you have any questions!

Happy exploring! 🚀`;

    const conversationId = Message.generateConversationId(admin._id, newUserId);

    await Message.create({
      conversationId,
      senderId: admin._id,
      receiverId: newUserId,
      text: welcomeText
    });

    console.log('Welcome message sent to new user');
  } catch (error) {
    console.error('Error sending welcome message:', error.message);
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      location
    });

    // Send welcome message from admin
    await sendWelcomeMessage(user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account was created with Google or Apple Sign-In. Please use that method to login.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if account is restricted
    if (user.isRestricted) {
      return res.status(401).json({
        success: false,
        message: `Your account has been restricted. Reason: ${user.restrictionReason || 'Contact support'}`
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user data'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, location } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (location) {
      user.location = {
        ...user.location,
        ...location
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/upload-profile-pic
// @access  Private
exports.uploadProfilePic = async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('=== PROFILE PIC UPLOAD REQUEST ===');
    console.log('User ID:', req.user?.id);
    console.log('File received:', !!req.file);
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    tempFilePath = req.file.path;
    console.log('File received at:', tempFilePath);
    console.log('File size:', req.file.size);
    console.log('File mime type:', req.file.mimetype);

    const user = await User.findById(req.user.id);

    if (!user) {
      console.error('User not found:', req.user.id);
      // Clean up temp file if user not found
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        console.error('Error deleting temp file:', e.message);
      }
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload to Cloudinary
    let result;
    try {
      console.log('Starting Cloudinary upload from:', tempFilePath);
      result = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'servicehub/profiles',
        resource_type: 'auto',
        timeout: 60000
      });
      console.log('Cloudinary upload successful:', result.secure_url);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError.message);
      console.error('Full Cloudinary error:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to server: ' + cloudinaryError.message
      });
    }

    if (!result || !result.secure_url) {
      console.error('Invalid Cloudinary response:', result);
      return res.status(500).json({
        success: false,
        message: 'Image upload returned invalid response'
      });
    }

    user.profilePic = result.secure_url;
    await user.save();
    console.log('User profile picture updated:', user._id);
    console.log('New profile picture URL:', result.secure_url);

    console.log('=== PROFILE PIC UPLOAD SUCCESS ===');
    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePic: result.secure_url
    });
  } catch (error) {
    console.error('=== PROFILE PIC UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading profile picture'
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log('Temporary file cleaned up:', tempFilePath);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error.message);
      }
    }
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
};

// @desc    Request password reset (verify email or phone)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone number'
      });
    }

    const query = email
      ? { email: String(email).toLowerCase().trim() }
      : { phone: String(phone).trim() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with the provided details'
      });
    }

    const resetToken = jwt.sign(
      { id: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      message: 'Verification successful',
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing password reset'
    });
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (!decoded || decoded.type !== 'password_reset' || !decoded.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting password'
    });
  }
};

// @desc    Submit KYC verification
// @route   POST /api/auth/kyc
// @access  Private
exports.submitKYC = async (req, res) => {
  const fs = require('fs');
  const filesToCleanup = [];
  
  try {
    console.log('=== KYC SUBMISSION STARTED ===');
    const { idType, idNumber } = req.body;

    console.log('1. Checking user:', { userId: req.user.id });
    const user = await User.findById(req.user.id);

    if (!user) {
      console.error('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('2. Validating form data:', { idType, idNumber });
    // Validate required fields
    if (!idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ID type and ID number'
      });
    }

    // Handle file uploads
    console.log('3. Checking for files...');
    if (!req.files) {
      console.error('No files object in request');
      return res.status(400).json({
        success: false,
        message: 'Files not received. Please ensure both images are selected.'
      });
    }

    console.log('4. Files received:', Object.keys(req.files));
    
    if (!req.files.kycImage || !Array.isArray(req.files.kycImage) || req.files.kycImage.length === 0) {
      console.error('No KYC image');
      return res.status(400).json({
        success: false,
        message: 'ID image not uploaded'
      });
    }

    if (!req.files.selfieImage || !Array.isArray(req.files.selfieImage) || req.files.selfieImage.length === 0) {
      console.error('No selfie image');
      return res.status(400).json({
        success: false,
        message: 'Selfie not uploaded'
      });
    }

    const kycImageFile = req.files.kycImage[0];
    const selfieImageFile = req.files.selfieImage[0];

    console.log('5. File details:', {
      kycImage: {
        fieldname: kycImageFile.fieldname,
        originalname: kycImageFile.originalname,
        mimetype: kycImageFile.mimetype,
        size: kycImageFile.size,
        path: kycImageFile.path
      },
      selfieImage: {
        fieldname: selfieImageFile.fieldname,
        originalname: selfieImageFile.originalname,
        mimetype: selfieImageFile.mimetype,
        size: selfieImageFile.size,
        path: selfieImageFile.path
      }
    });

    // Verify file paths exist
    console.log('6. Verifying files exist on disk...');
    if (!fs.existsSync(kycImageFile.path)) {
      console.error('KYC image file not found at:', kycImageFile.path);
      return res.status(400).json({
        success: false,
        message: 'KYC image file could not be processed'
      });
    }

    if (!fs.existsSync(selfieImageFile.path)) {
      console.error('Selfie file not found at:', selfieImageFile.path);
      return res.status(400).json({
        success: false,
        message: 'Selfie file could not be processed'
      });
    }

    console.log('7. Files verified. Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    let idImageResult, selfieResult;
    
    try {
      console.log('7a. Uploading KYC image...');
      idImageResult = await cloudinary.uploader.upload(kycImageFile.path, {
        folder: 'servicehub/kyc',
        resource_type: 'auto',
        timeout: 60000
      });
      console.log('7a. SUCCESS - KYC uploaded:', idImageResult.public_id);
      filesToCleanup.push(kycImageFile.path);
    } catch (cloudinaryError) {
      console.error('7a. FAILED - Cloudinary KYC error:', {
        message: cloudinaryError.message,
        statusCode: cloudinaryError.http_code,
        error: cloudinaryError
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to upload ID image: ' + (cloudinaryError.message || JSON.stringify(cloudinaryError))
      });
    }

    try {
      console.log('7b. Uploading selfie image...');
      selfieResult = await cloudinary.uploader.upload(selfieImageFile.path, {
        folder: 'servicehub/kyc',
        resource_type: 'auto',
        timeout: 60000
      });
      console.log('7b. SUCCESS - Selfie uploaded:', selfieResult.public_id);
      filesToCleanup.push(selfieImageFile.path);
    } catch (cloudinaryError) {
      console.error('7b. FAILED - Cloudinary selfie error:', {
        message: cloudinaryError.message,
        statusCode: cloudinaryError.http_code,
        error: cloudinaryError
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to upload selfie image: ' + (cloudinaryError.message || JSON.stringify(cloudinaryError))
      });
    }

    // Save KYC data
    console.log('8. Saving KYC data to database...');
    user.kycData = {
      idType,
      idNumber,
      imageUrl: idImageResult.secure_url,
      selfieUrl: selfieResult.secure_url
    };
    user.kycStatus = 'pending';
    user.kycSubmittedAt = Date.now();

    await user.save();
    console.log('8. SUCCESS - KYC data saved');

    // Clean up temporary files
    console.log('9. Cleaning up temporary files...');
    filesToCleanup.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('   - Deleted:', filePath);
        }
      } catch (cleanupError) {
        console.warn('   - Warning:', cleanupError.message);
      }
    });

    console.log('=== KYC SUBMISSION SUCCESS ===');
    res.status(200).json({
      success: true,
      message: 'KYC submitted successfully. Awaiting verification.',
      user: user.toPublicProfile()
    });

  } catch (error) {
    console.error('=== KYC SUBMISSION FAILED ===');
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Clean up any uploaded files
    if (req.files) {
      [
        req.files.kycImage?.[0]?.path,
        req.files.selfieImage?.[0]?.path
      ]
        .filter(Boolean)
        .forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (cleanupError) {
            // ignore
          }
        });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting KYC'
    });
  }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const googleUser = await response.json();

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user from Google data
      user = await User.create({
        name: googleUser.name || googleUser.given_name,
        email: googleUser.email,
        profilePic: googleUser.picture,
        googleId: googleUser.id,
        isVerified: true,
        role: 'customer'
      });

      // Send welcome message
      await sendWelcomeMessage(user._id);
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleUser.id;
      if (!user.profilePic && googleUser.picture) {
        user.profilePic = googleUser.picture;
      }
      await user.save();
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if account is restricted
    if (user.isRestricted) {
      return res.status(401).json({
        success: false,
        message: `Your account has been restricted. Reason: ${user.restrictionReason || 'Contact support'}`
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Google login failed'
    });
  }
};

// @desc    Apple OAuth Login
// @route   POST /api/auth/apple-login
// @access  Public
exports.appleLogin = async (req, res) => {
  try {
    const { identityToken } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'Identity token is required'
      });
    }

    // Decode identity token (simplified - in production, verify signature)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(identityToken);

    if (!decoded || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Apple token'
      });
    }

    const appleUser = {
      email: decoded.email,
      name: decoded.name?.firstName || 'Apple User',
      sub: decoded.sub
    };

    // Find or create user
    let user = await User.findOne({ email: appleUser.email });

    if (!user) {
      // Create new user from Apple data
      user = await User.create({
        name: appleUser.name,
        email: appleUser.email,
        appleId: appleUser.sub,
        isVerified: true,
        role: 'customer'
      });

      // Send welcome message
      await sendWelcomeMessage(user._id);
    } else if (!user.appleId) {
      // Link Apple account to existing user
      user.appleId = appleUser.sub;
      await user.save();
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if account is restricted
    if (user.isRestricted) {
      return res.status(401).json({
        success: false,
        message: `Your account has been restricted. Reason: ${user.restrictionReason || 'Contact support'}`
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Apple login successful',
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Apple login failed'
    });
  }
};
