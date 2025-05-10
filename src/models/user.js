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
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
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
      default: null,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    notifications: [
      {
        message: { type: String, required: true },
        type: { type: String, enum: ['order', 'payment', 'system', 'other'], default: 'other' },
        isRead: { type: Boolean, default: false },
        inwardId: { type: String,default:null},
        outwardId: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

// User Methods
UserSchema.methods.generateRefreshToken = function () {
  const refreshToken = "generated_refresh_token"; 
  this.refreshToken = refreshToken;
  return refreshToken;
};

UserSchema.methods.generatePasswordResetToken = function () {
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
  if (role === 'admin') {
    return PERMISSIONS;
  }
  return ['view'];
};

// Static Methods for Password Management
UserSchema.statics.forgotPassword = async function (email) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");
  return user.generatePasswordResetToken();
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

// Static Methods for Notifications
UserSchema.statics.addNotification = async function (userID, message, type = 'other') {
  const user = await this.findById(userID);
  if (!user) throw new Error("User not found");

  user.notifications.push({ message, type });
  await user.save();
  return user;
};

UserSchema.statics.markNotificationAsRead = async function (userID, notificationId) {
  const user = await this.findById(userID);
  if (!user) throw new Error("User not found");

  const notification = user.notifications.id(notificationId);
  if (!notification) throw new Error("Notification not found");

  notification.isRead = true;
  await user.save();
  return user;
};

// Create a non-unique index on mobileNumber (optional)
UserSchema.index({ mobileNumber: 1 });

// Export the User model
export const User = models.User || model('User', UserSchema);
