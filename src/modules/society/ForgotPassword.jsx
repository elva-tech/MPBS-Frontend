import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../../utils/api";
import { usePopup } from "../../shared/context/PopupContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [form, setForm] = useState({
    societyCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValidPassword = (password) => {
    const regex = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { societyCode, newPassword, confirmPassword } = form;

    if (!societyCode || !newPassword || !confirmPassword) {
      await showPopup({ message: "Please fill all fields", type: "warning" });
      return;
    }

    if (newPassword !== confirmPassword) {
      await showPopup({ message: "Passwords do not match", type: "error" });
      return;
    }

    if (!isValidPassword(newPassword)) {
      await showPopup({
        message: "Password must be at least 8 characters and contain at least one special character",
        type: "warning",
      });
      return;
    }

    await createRequest({
      type: "forgot_password",
      username: societyCode,
      role: "Society",
      newPassword,
      message: "Forgot password, please reset",
      status: "pending",
    });

    await showPopup({
      message: "Password change request submitted.\n\nIt will be applied after admin approval.",
      type: "success",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyan-700">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-xl font-semibold text-center mb-2">
          Reset Password
        </h1>

        <p className="text-xs text-gray-600 text-center mb-4">
          Password change requires admin approval.  
          You will be able to login only after approval.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="societyCode"
            placeholder="Society Code"
            value={form.societyCode}
            onChange={handleChange}
            autoComplete="username"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-enter New Password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="w-full border rounded px-3 py-2"
          />

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
