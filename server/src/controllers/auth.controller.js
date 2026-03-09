import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import { generateToken } from '../utils/jwt.util.js';
import { ROLES } from '../config/constants.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      role: role || ROLES.STUDENT,
    });

    await user.save();

    // If student role, create student record
    if (user.role === ROLES.STUDENT && studentData) {
      const student = new Student({
        userId: user._id,
        studentId: studentData.studentId,
        department: studentData.department,
        year: studentData.year,
        section: studentData.section,
      });
      await student.save();
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
