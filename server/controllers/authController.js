const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'team-task-manager-jwt-secret-key-2026';

const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#EF4444'  // Red
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

exports.signup = async (req, res) => {
  const { name, email, password, role_title, avatar_color } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const color = avatar_color || getRandomColor();
    const role = role_title || 'Team Member';

    const result = await db.query(
      `INSERT INTO users (name, email, password, avatar_color, role_title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar_color, role_title, created_at`,
      [name.trim(), email.toLowerCase().trim(), hashed, color, role]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Error registering user account' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (!result.rows.length) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d'
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_color: user.avatar_color || '#6366F1',
      role_title: user.role_title || 'Team Member',
      created_at: user.created_at
    };

    res.json({ token, user: userProfile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, avatar_color, role_title, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Error retrieving profile' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, role_title, avatar_color, current_password, new_password } = req.body;
  const userId = req.user.id;

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!userRes.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    const currentUser = userRes.rows[0];

    let hashedPassword = currentUser.password;
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const match = await bcrypt.compare(current_password, currentUser.password);
      if (!match) {
        return res.status(400).json({ message: 'Current password does not match' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      hashedPassword = await bcrypt.hash(new_password, 10);
    }

    const updatedName = name ? name.trim() : currentUser.name;
    const updatedRole = role_title ? role_title.trim() : currentUser.role_title;
    const updatedColor = avatar_color || currentUser.avatar_color;

    await db.query(
      `UPDATE users 
       SET name = $1, role_title = $2, avatar_color = $3, password = $4
       WHERE id = $5`,
      [updatedName, updatedRole, updatedColor, hashedPassword, userId]
    );

    const updatedUser = {
      id: userId,
      name: updatedName,
      email: currentUser.email,
      avatar_color: updatedColor,
      role_title: updatedRole,
      created_at: currentUser.created_at
    };

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, avatar_color, role_title, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Error fetching users list' });
  }
};

exports.getDemoUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, avatar_color, role_title FROM users ORDER BY id ASC LIMIT 4'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getDemoUsers error:', err);
    res.status(500).json({ message: 'Error fetching demo users' });
  }
};