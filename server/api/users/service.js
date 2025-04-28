const pool = require("../../db/connection");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// create a user
const createUser = async (user) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      "INSERT INTO users (Username, Password, Email, Role) VALUES (?, ?, ?, ?)",
      [user.Username, user.Password, user.Email, user.Role]
    );
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

//register user
const registerUser = async (user) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [userCreationResult] = await conn.query(
      "INSERT INTO users (Username, Password, Email, Role, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      [
        user.Username,
        user.Password,
        user.Email,
        'user',//'admin'
        new Date(),
        new Date()
      ]
    );

    if (userCreationResult.affectedRows === 0) {
      throw new Error("User registration failed");
    }

    return { result: userCreationResult, error: null };
  } catch (error) {
    console.log(error);
    return { result: null, error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

//get user by username
const getUserByUsername = async (Username) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM users WHERE Username = ?", [Username]);
    return rows[0];
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//get user by username or email
const getUserByUsernameOrEmail = async (Username, Email) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM users WHERE Username = ? OR Email = ?", [Username, Email]);
    return rows[0];
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//get user by id
const getUserById = async (UserID) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM users WHERE UserID = ?", [
      UserID,
    ]);
    conn.release();
    return rows[0];
  } catch (error) {
    console.log(error);
    return [];
  }
};

//update user
const updateUser = async (UserID, user) => {
  try {
    const conn = await pool.getConnection();
    const [updateResult] = await conn.query(
      "UPDATE users SET Username = ?, Password = ?, Email = ?, Role = ?, UpdatedAt = ? WHERE UserID = ?",
      [user.Username, user.Password, user.Email, user.Role, new Date(), UserID]
    );
    conn.release();
    return updateResult.changedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Delete user
const deleteUser = async (UserID) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("DELETE FROM users WHERE UserID = ?", [
      UserID,
    ]);
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// get all users
const getUsers = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM users");
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  } finally {
    conn.release();
  }
};

// login user
const loginUser = async (Username, Password) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM users WHERE Username = ?", [Username]);
    if (rows.length === 0) {
      return { success: false, error: "User not found" };
    }
    const user = rows[0];
    const match = await bcrypt.compare(Password, user.Password);
    if (!match) {
      return { success: false, error: "Invalid password" };
    }
    // Exclude password from token payload
    const token = jwt.sign(
      { UserID: user.UserID, Username: user.Username, Email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return { success: true, token };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Login failed" };
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsers,
  createUser,
  getUserByUsernameOrEmail,
  getUserByUsername
};
