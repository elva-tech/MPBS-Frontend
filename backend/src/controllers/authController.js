import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";

export async function login(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  if (user.authStatus !== "Approved") {
    return res.status(403).json({ message: "User not approved" });
  }
  const token = signToken({ id: user._id, role: user.role, username: user.username });
  res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
}
