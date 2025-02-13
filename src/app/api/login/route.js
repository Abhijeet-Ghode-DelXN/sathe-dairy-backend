import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongooseConnection from '../../../lib/mongodb'; // MongoDB connection
import { User } from '../../../models/user'; // User model
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await mongooseConnection(); // Ensure MongoDB connection

  try {
    const body = await req.json();
    const { email, password } = body;

    // Check if user exists by email
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Generate JWT token for the logged-in user
    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email, role: existingUser.role },
      process.env.JWT_SECRET,
      // { expiresIn: '1h' } // Token expiry of 1 hour
      { expiresIn: '2w' } // Token expiry of 2 weeks
    );

    // Send token and success response
    return NextResponse.json({ message: 'Login Successful', token }, { status: 200 });
  } catch (error) {
    console.log('Error during login:', error);
    return NextResponse.json({ error: 'Login Failed' }, { status: 500 });
  }
}
