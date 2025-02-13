import { User } from '../../../models/user';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import mongooseConnection from '@/lib/mongodb';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    mongooseConnection();
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: 'Password reset link sent to email' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
}
