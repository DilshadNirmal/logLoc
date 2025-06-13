const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

router.get("/users", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.Role !== "admin" && user.Role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }
    const users = await User.find({}, { Password: 0 }); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.put("/users/:userId", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.Role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { UserName, Email, Role, phoneNumber } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    user.UserName = UserName;
    user.Email = Email;
    user.Role = Role;
    user.phoneNumber = phoneNumber;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/users/:userId/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, isSuperAdmin } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow users to change their own password unless they're super_admin
    const currentUser = await User.findById(req.user._id);
    if (
      currentUser._id.toString() !== user._id.toString() &&
      currentUser.Role !== "super_admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify current password only if not super admin
    if (!isSuperAdmin) {
      const isMatch = await bcrypt.compare(currentPassword, user.Password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    user.Password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:userId", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.Role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin privileges required." });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent super_admin from deleting themselves
    if (user._id.toString() === currentUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
