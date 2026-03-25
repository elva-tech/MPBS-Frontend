import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";
import { Notification } from "../models/Notification.js";

export async function getDashboardStats(req, res) {
  const [totalUsers, usersByRole, approvedUsers, rejectedUsers, pendingUsers, totalNotifications] = await Promise.all([
    User.countDocuments({}),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ authStatus: "Approved" }),
    User.countDocuments({ authStatus: "Rejected" }),
    User.countDocuments({ authStatus: "Pending" }),
    Notification.countDocuments({ status: "active" }),
  ]);

  const stats = {
    totalUsers,
    approvedUsers,
    rejectedUsers,
    pendingUsers,
    totalNotifications,
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  res.json({ data: stats });
}

export async function listUsers(req, res) {
  const pagination = getPagination(req.query);
  const { search, role, authStatus } = req.query;
  const query = {};
  
  if (search) {
    query.username = { $regex: search, $options: "i" };
  }
  
  if (role) {
    query.role = role;
  }
  
  if (authStatus) {
    query.authStatus = authStatus;
  }

  if (!pagination.enabled) {
    const users = await User.find(query, "username role authStatus createdAt").sort({ createdAt: -1 });
    return res.json({ data: users });
  }

  const { page, limit, skip } = pagination;
  const [users, total] = await Promise.all([
    User.find(query, "username role authStatus createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return res.json({
    data: users,
    meta: makePaginationMeta(total, page, limit),
  });
}

export async function createUser(req, res) {
  const { username, password, role, profile } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash, role, profile });
  res.status(201).json({ data: user });
}

export async function updateUserAuth(req, res) {
  const { id } = req.params;
  const { authStatus } = req.body;
  const user = await User.findByIdAndUpdate(id, { authStatus }, { new: true });
  res.json({ data: user });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  
  // Prevent deleting the last admin
  const adminCount = await User.countDocuments({ role: "Admin" });
  const userToDelete = await User.findById(id);
  
  if (userToDelete.role === "Admin" && adminCount <= 1) {
    return res.status(400).json({ message: "Cannot delete the last admin user" });
  }
  
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted successfully" });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { username, role, profile, authStatus } = req.body;
  
  const updateData = {};
  if (username) updateData.username = username;
  if (role) updateData.role = role;
  if (profile) updateData.profile = profile;
  if (authStatus) updateData.authStatus = authStatus;
  
  const user = await User.findByIdAndUpdate(id, updateData, { new: true });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  res.json({ data: user });
}

export async function resetUserPassword(req, res) {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await User.findByIdAndUpdate(id, { passwordHash }, { new: true });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  res.json({ message: "Password reset successfully" });
}
