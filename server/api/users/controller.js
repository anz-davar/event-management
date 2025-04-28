const service = require("./service");

// get all users
const getUsers = async (req, res) => {
  try {
    const users = await service.getUsers();
    return res.json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ users: [], error: "An error occurred" });
  }
};

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//register a user
const registerUser = async (req, res) => {
  try {
    const { Username, Password, Email } = req.body;
    if (!Username || !Password || !Email) {
      return res.status(400).json({ error: "Username, password, and email are required" });
    }
    // Check if user exists
    const existingUser = await service.getUserByUsernameOrEmail(Username, Email);
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);
    const userObj = { Username, Password: hashedPassword, Email };
    const { result, error } = await service.registerUser(userObj);
    if (error) throw new Error(error ?? "User registration failed");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ result: null, error: error?.message ?? "An error occurred" });
  }
};

//login a user
const loginUser = async (req, res) => {
  try {
    const { Username, Password } = req.body;
    if (!Username || !Password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    // Get user by username
    const user = await service.getUserByUsername(Username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Compare password
    const validPass = await bcrypt.compare(Password, user.Password);
    if (!validPass) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Generate JWT
    const token = jwt.sign(
      { UserID: user.UserID, Username: user.Username, Role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // Do not return password
    const { Password: pw, ...userSafe } = user;
    res.status(200).json({ token, user: userSafe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//get user by id
const getUserById = async (req, res) => {
  try {
    const UserID = req.params.UserID;
    const user = await service.getUserById(UserID);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//update user
const updateUser = async (req, res) => {
  try {
    const user = req.body;
    const UserID = req.params.UserID;
    if (!user?.UserID) {
      console.log("UserID is required");
      return res.status(400).end();
    }
    const updatedUser = await service.updateUser(UserID, user);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//delete user
const deleteUser = async (req, res) => {
  try {
    const UserID = req.params.UserID;
    const deletedUser = await service.deleteUser(UserID);
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsers,
};
