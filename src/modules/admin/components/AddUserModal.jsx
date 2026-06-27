import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const DISTRICTS = [
  { name: "District 1", taluks: ["Taluk 1", "Taluk 2", "Taluk 3"] },
  { name: "District 2", taluks: ["Taluk 1", "Taluk 2"] },
  { name: "District 3", taluks: ["Taluk 1"] },
];
const EO_LIST = ["EO 1", "EO 2"];
const BMC_LIST = ["BMC 1", "BMC 2"];
const DAIRY_LIST = ["Dairy 1", "Dairy 2"];
const DESIGNATIONS = ["Manager", "Staff", "Supervisor"];
const BUILDING_TYPES = ["Type A", "Type B", "Type C"];

const ROLES = [
  { label: "Society", value: "Society" },
  { label: "EO", value: "EO" },
  { label: "BMC", value: "BMC" },
  { label: "Dairy", value: "Dairy" },
  { label: "Procurement & Inputs", value: "ProcurementInputs" },
  { label: "Other Users", value: "Other Users" },
];
const ROUTE_OPTIONS = ["1", "2", "3"];

/* ---------------- SOCIETY / BMC COMMON ---------------- */

const SocietyFields = ({ formData, handleChange, selectedDistrict }) => {
  const renderMemberFields = (title, prefix) => (
    <>
      <h4 className="font-semibold mt-4">{title}</h4>
      <div className="grid grid-cols-4 gap-3">
        <input type="number" name={`${prefix}SC`} placeholder="SC" value={formData[`${prefix}SC`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}ST`} placeholder="ST" value={formData[`${prefix}ST`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}Women`} placeholder="Women" value={formData[`${prefix}Women`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}General`} placeholder="General" value={formData[`${prefix}General`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
      </div>
    </>
  );

  const renderFarmerFields = (title, prefix) => (
    <>
      <h4 className="font-semibold mt-4">{title}</h4>
      <div className="grid grid-cols-4 gap-3">
        <input type="number" name={`${prefix}Small`} placeholder="Small" value={formData[`${prefix}Small`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}Agri`} placeholder="Agriculture Labour" value={formData[`${prefix}Agri`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}Marginal`} placeholder="Marginal" value={formData[`${prefix}Marginal`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="number" name={`${prefix}Others`} placeholder="Others" value={formData[`${prefix}Others`] || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <input name="societyNo" placeholder="Society No" value={formData.societyNo || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input name="societyName" placeholder="Society Name" value={formData.societyName || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />

        <select name="district" value={formData.district || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Select District</option>
          {DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>

        <select name="taluk" value={formData.taluk || ""} disabled={!formData.district} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Select Taluk</option>
          {(selectedDistrict?.taluks || []).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <input name="hobli" placeholder="Hobli" value={formData.hobli || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input type="text" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
        <input name="address" placeholder="Address" value={formData.address || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />

        <select name="buildingType" value={formData.buildingType || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Building Type</option>
          {BUILDING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select name="route" value={formData.route || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Select Route</option>
          {ROUTE_OPTIONS.map(r => <option key={r} value={r}>Route {r}</option>)}
        </select>
      </div>

      <h3 className="font-bold text-black mt-6">Bank Details</h3>

      <div className="grid grid-cols-2 gap-4">
        <input
          name="bankName"
          placeholder="Bank Name"
          value={formData.bankName || ""}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          name="branch"
          placeholder="Branch"
          value={formData.branch || ""}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="accountNo"
          placeholder="Account No"
          value={formData.accountNo || ""}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          name="ifsc"
          placeholder="IFSC Code"
          value={formData.ifsc || ""}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          name="pan"
          placeholder="PAN"
          value={formData.pan || ""}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
      </div>


      <div className="grid grid-cols-2 gap-4">
        <select name="eo" value={formData.eo || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Select EO</option>
          {EO_LIST.map(eo => <option key={eo} value={eo}>{eo}</option>)}
        </select>

        <select name="bmc" value={formData.bmc || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
          <option value="">Select BMC</option>
          {BMC_LIST.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {renderMemberFields("Farmers Type", "totalMem")}
      {renderMemberFields("Total Farmers Type", "funcMem")}
      {renderFarmerFields("Functional Farmers", "totalFar")}
      {renderFarmerFields("Total Functional Farmers", "funcFar")}
      {/* {renderFarmerFields("Bank Details", "Bankdet")} */}

    </div>
  );
};

/* ---------------- MAIN ---------------- */

export default function AddUserModal({ onClose, onSubmit }) {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "district" ? { taluk: "" } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        role,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedDistrict = DISTRICTS.find(d => d.name === formData.district);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg max-h-[90vh] overflow-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <select
              value={role}
              onChange={e => { setRole(e.target.value); setFormData({}); }}
              required
              className="rounded-lg border border-[#d7dbe3] px-3 py-2 text-sm text-slate-700 focus:border-[#1E4B6B] focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
            >
              <option value="">Select Role</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <input
              name="username"
              placeholder="Username"
              value={formData.username || ""}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Login Password"
                value={formData.password || ""}
                onChange={handleChange}
                required
                className="border px-3 py-2 rounded w-full pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {(role === "Society" || role === "BMC") && (
            <p className="text-sm text-slate-600">
              This account will be created as Pending and can log in only after admin approval.
            </p>
          )}

          {role === "Society" && <SocietyFields formData={formData} handleChange={handleChange} selectedDistrict={selectedDistrict} />}

          {role === "BMC" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input name="bmcId" placeholder="BMC ID" value={formData.bmcId || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
                <input name="deputyManager" placeholder="Deputy Manager" value={formData.deputyManager || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
                <select name="dairy" value={formData.dairy || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
                  <option value="">Select Dairy</option>
                  {DAIRY_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <SocietyFields formData={formData} handleChange={handleChange} selectedDistrict={selectedDistrict} />
            </>
          )}

          {role === "EO" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="eoName" placeholder="EO Name" value={formData.eoName || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <select name="designation" value={formData.designation || ""} onChange={handleChange} required className="border px-3 py-2 rounded">
                <option value="">Designation</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input name="employeeId" placeholder="Employee ID" value={formData.employeeId || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
            </div>
          )}

          {role === "Dairy" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="dairyId" placeholder="Dairy ID" value={formData.dairyId || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input name="dairyName" placeholder="Dairy Name" value={formData.dairyName || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input name="address" placeholder="Address" value={formData.address || ""} onChange={handleChange} required className="border px-3 py-2 rounded col-span-2" />
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
            </div>
          )}

          {role === "Other Users" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="empId" placeholder="Employee ID" value={formData.empId || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input name="designation" placeholder="Designation" value={formData.designation || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className="border px-3 py-2 rounded" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded">Cancel</button>
            <button
              type="submit"
              disabled={loading || !role}
              className="rounded-lg bg-[#1E4B6B] px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(30,75,107,0.22)] transition hover:bg-[#163A54] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
