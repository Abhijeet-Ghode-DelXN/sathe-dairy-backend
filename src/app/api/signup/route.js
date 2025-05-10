import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongooseConnection from '../../../lib/mongodb';
import { User } from '../../../models/user';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await mongooseConnection();

  try {
    const body = await req.json();
    const { fullName, username, email, password, mobileNumber, role = 'user', permissions = ['view'] } = body;

    // Validate required fields
    if (!fullName || !username || !email || !password || !mobileNumber) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUserUsername = await User.findOne({ username });
    if (existingUserUsername) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Email address is already registered' },
        { status: 400 }
      );
    }

    // Check if mobile number already exists
    const existingUserMobile = await User.findOne({ mobileNumber });
    if (existingUserMobile) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Mobile number is already registered' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      mobileNumber,
      role,
      permissions
    });

    // Generate a JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '14d' } // Extended token expiry to 14 days
    );

    return NextResponse.json(
      { message: 'User created successfully', token },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: `This ${field} is already registered`
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Signup Failed', details: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}