import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../utils/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dotPattern =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='rgba(255,255,255,0.6)'><circle cx='10' cy='10' r='2.2'/><circle cx='40' cy='10' r='2.2'/><circle cx='70' cy='10' r='2.2'/><circle cx='100' cy='10' r='2.2'/><circle cx='10' cy='40' r='2.2'/><circle cx='40' cy='40' r='2.2'/><circle cx='70' cy='40' r='2.2'/><circle cx='100' cy='40' r='2.2'/><circle cx='10' cy='70' r='2.2'/><circle cx='40' cy='70' r='2.2'/><circle cx='70' cy='70' r='2.2'/><circle cx='100' cy='70' r='2.2'/><circle cx='10' cy='100' r='2.2'/><circle cx='40' cy='100' r='2.2'/><circle cx='70' cy='100' r='2.2'/><circle cx='100' cy='100' r='2.2'/></g></svg>"
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ username: form.username, password: form.password });
      const user = res?.user;
      
      if (!user) {
        setError("Login failed - no user data received");
        setLoading(false);
        return;
      }
      
      if (user.role !== "Admin") {
        setError(`Not authorized - This is a ${user.role} account. Please use Admin login credentials.`);
        setLoading(false);
        return;
      }
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("admin_token", res.token);
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("admin_name", user.username);
      localStorage.setItem("admin_auth", "true");
      localStorage.removeItem("society_auth");
      localStorage.removeItem("society_name");
      localStorage.removeItem("society_id");
      localStorage.removeItem("bmc_auth");
      localStorage.removeItem("bmc_name");
      localStorage.removeItem("bmc_id");
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2e5d7b] text-slate-800 caret-transparent">
      <div className="grid min-h-screen items-stretch lg:grid-cols-[0.6fr_0.4fr]">
        {/* Left Panel */}
        <div className="relative hidden overflow-hidden bg-[#2b5874] lg:flex lg:items-center lg:justify-start lg:pl-24">
          {/* Diamond lattice pattern */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-64 w-80"
            style={{
              backgroundImage: `url("${dotPattern}")`,
              backgroundSize: "40px 40px",
              backgroundRepeat: "repeat",
              backgroundPosition: "0 0",
            }}
          />

          <div className="relative z-10 flex items-center justify-center">
            <div className="relative h-[520px] w-[520px]">
              <img
                src="/cow2.png"
                alt="Buffalo field"
                className="absolute left-[76px] top-[114px] z-0 h-[398px] w-[300px] -rotate-[3deg] rounded-[28px] border-[5px] border-white object-cover shadow-[0_26px_46px_rgba(0,0,0,0.25)]"
              />
              <img
                src="/cow.png"
                alt="Cow portrait"
                className="absolute right-[46px] top-[84px] z-20 h-[418px] w-[300px] rotate-[4deg] rounded-[28px] border-[5px] border-white object-cover shadow-[0_26px_46px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex h-full items-center justify-center bg-[#f7f7f7] px-6 py-12">
          <div className="w-full max-w-[440px] rounded-[18px] border border-[#e7e7e7] bg-white px-9 py-8 shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
            <div className="flex justify-center">
              <img
                src="/logo1.png"
                alt="Logo"
                className="h-14 object-contain"
              />
            </div>

            <h2 className="mt-5 text-center text-[22px] font-semibold text-slate-800">
              Welcome to Admin
            </h2>
            <p className="mt-1.5 text-center text-[13.5px] text-slate-500">
              Enter your credentials to continue
            </p>

            {error && (
              <p className="mt-3 text-center text-[13px] text-red-600">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Username */}
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                className="w-full rounded-lg border border-[#d7dbe3] bg-white px-4 py-[11px] text-[13.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e5d7b]"
                required
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[#d7dbe3] bg-white px-4 py-[11px] pr-11 text-[13.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e5d7b]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-7-9-7a18.938 18.938 0 012.29-3.338M6.223 6.223A9.956 9.956 0 0112 5c5 0 9 7 9 7a18.948 18.948 0 01-4.357 4.938M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-[13px] text-slate-500">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#b5b9c2] text-[#2e5d7b] focus:ring-[#2e5d7b]"
                  />
                  <span>Remember Me</span>
                </label>

                {/*
                <Link to="/forgot-password" className="hover:text-slate-600">
                  Forgot Password?
                </Link>
                */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-[#2e5d7b] py-[11px] text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(46,93,123,0.22)] transition hover:bg-[#264d66] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
