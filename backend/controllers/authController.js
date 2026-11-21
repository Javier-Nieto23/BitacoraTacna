import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt.js';

export const login = async (req, res) => {
  try {
    const user_name = req.body.user_name ?? req.body.usuario ?? '';
    const password = req.body.password ?? req.body.password_hash ?? '';

    if (!user_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos',
      });
    }

    const result = await pool.query(
      'SELECT id, user_name, password_hash, name, last_name FROM users WHERE user_name = $1',
      [user_name]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: user.user_name,
      user: {
        id: user.id,
        user_name: user.user_name,
        name: user.name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

export const verifyLogin = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_name, name, last_name FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      usuario: user,
    });
  } catch (error) {
    console.error('Error verificando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
    });
  }
};
