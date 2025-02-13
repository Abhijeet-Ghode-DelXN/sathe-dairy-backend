import mongoose, { model, models } from "mongoose";

// Enum for roles and permissions
const ROLES = ['admin', 'user'];
const PERMISSIONS = ['create', 'update', 'delete', 'view']; // You can define more permissions

// Schema for User
const UserSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      default: function () {
        return this._id.toString();
      },
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    mobileNumber: {
      type: String,
      required: true,
      // unique: true,
      match: [/^\d{10}$/, 'Please enter a valid mobile number'],
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'user',
    },
    permissions: {
      type: [String],
      enum: PERMISSIONS,
      default: ['view'],
    },
    refreshToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

// User Methods
UserSchema.methods.generateRefreshToken = function () {
  // Logic to generate a refresh token, possibly using a library like jsonwebtoken
  const refreshToken = "generated_refresh_token"; 
  this.refreshToken = refreshToken;
  return refreshToken;
};

UserSchema.methods.generatePasswordResetToken = function () {
  // Logic to generate a password reset token
  const resetToken = "generated_reset_token";
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour expiration
  return resetToken;
};

// Static Methods for User Management
UserSchema.statics.createUser = async function (userData) {
  const user = await this.create(userData);
  return user;
};

UserSchema.statics.updateUser = async function (userID, updateData) {
  const user = await this.findByIdAndUpdate(userID, updateData, { new: true });
  return user;
};

UserSchema.statics.deleteUser = async function (userID) {
  await this.findByIdAndDelete(userID);
};

UserSchema.statics.fetchUsers = async function (filters = {}) {
  return await this.find(filters);
};

// Static Method for Access Control
UserSchema.statics.assignRole = async function (userID, role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  const user = await this.findByIdAndUpdate(userID, { role }, { new: true });
  return user;
};

UserSchema.statics.getRolePermissions = function (role) {
  // Logic to get permissions based on role
  if (role === 'admin') {
    return PERMISSIONS; // Admin can have all permissions
  }
  return ['view']; // Default permissions for a user
};

// Static Methods for Password Management
UserSchema.statics.forgotPassword = async function (email) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");
  return user.generatePasswordResetToken(); // Sends the reset token to user's email (implementation not shown)
};

UserSchema.statics.resetPassword = async function (resetToken, newPassword) {
  const user = await this.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Invalid or expired reset token");
  
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};



// Create a non-unique index on mobileNumber (optional)
UserSchema.index({ mobileNumber: 1 });

// Export the User model
export const User = models.User || model('User', UserSchema);
