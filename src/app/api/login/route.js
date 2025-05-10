import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongooseConnection from '../../../lib/mongodb'; // MongoDB connection
import { User } from '../../../models/user'; // User model
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await mongooseConnection(); // Ensure MongoDB connection

  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing credentials', details: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists by username only
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: 'Invalid username or password' },
        { status: 400 }
      );
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: 'Invalid username or password' },
        { status: 400 }
      );
    }

    // Generate JWT token for the logged-in user
    const token = jwt.sign(
      { 
        userId: existingUser._id, 
        username: existingUser.username,
        email: existingUser.email, 
        role: existingUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '2w' } // Token expiry of 2 weeks
    );

    // Send token and success response
    return NextResponse.json(
      { message: 'Login Successful', token },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login Failed', details: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
