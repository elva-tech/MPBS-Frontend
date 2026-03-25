import { useState, useEffect } from "react";
import AddUserModal from "./components/AddUserModal";
import { listUsers, createUser, updateUserAuth } from "../../utils/api";
import "./UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [authUpdatingUserId, setAuthUpdatingUserId] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers();
      setUsers(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    setError("");
    try {
      const role = userData.role === "Other Users" ? "Other" : userData.role;
      await createUser({
        username: userData.username,
        password: userData.password,
        role,
        profile: userData,
      });
      alert("User added successfully");
      setShowModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to add user");
    }
  };

  const handleAuthStatusUpdate = async (userId, authStatus) => {
    if (!userId) return;
    setError("");
    setAuthUpdatingUserId(userId);
    try {
      await updateUserAuth(userId, { authStatus });
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update auth status");
    } finally {
      setAuthUpdatingUserId("");
    }
  };

  return (
    <div className="admin-users">
      <div className="page-head">
        <div>
          <h1 className="title">User Management</h1>
          <div className="subtitle">Manage admin, society, BMC, and other user accounts.</div>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : users.length == 0 ? (
        <div className="empty-card">No users found.</div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-sl">Sl No.</th>
                <th>User Name</th>
                <th>Role</th>
                <th className="col-status">Auth Status</th>
                <th>Actions</th>
                <th className="col-date">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id || user.id}>
                  <td className="col-sl">{index + 1}</td>
                  <td className="cell-strong">{user.username}</td>
                  <td>{user.role}</td>
                  <td className="col-status">
                    <span
                      className={`status-pill ${
                        user.authStatus === "Approved"
                          ? "approved"
                          : user.authStatus === "Pending"
                          ? "pending"
                          : "rejected"
                      }`}
                    >
                      {user.authStatus}
                    </span>
                  </td>
                  <td>
                    {user.authStatus === "Pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={authUpdatingUserId === (user._id || user.id)}
                          onClick={() => handleAuthStatusUpdate(user._id || user.id, "Approved")}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={authUpdatingUserId === (user._id || user.id)}
                          onClick={() => handleAuthStatusUpdate(user._id || user.id, "Rejected")}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="col-date">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="add-row">
        <button onClick={() => setShowModal(true)} className="add-btn">
          Add User
        </button>
      </div>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
}
