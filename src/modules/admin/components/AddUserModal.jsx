import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getHierarchyOptions } from "../../../utils/api";

const DISTRICTS = [
  { name: "District 1", taluks: ["Taluk 1", "Taluk 2", "Taluk 3"] },
  { name: "District 2", taluks: ["Taluk 1", "Taluk 2"] },
  { name: "District 3", taluks: ["Taluk 1"] },
];
const EO_LIST = ["EO 1", "EO 2"];
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

const FIELD =
  "w-full rounded-lg border border-[#d7dbe3] bg-white px-3 py-2 text-[13.5px] text-slate-700 placeholder:text-slate-400 focus:border-[#1E4B6B] focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]/25";
const SELECT_WRAP = "relative isolate focus-within:z-40";

function SelectWrap({ children }) {
  return <div className={SELECT_WRAP}>{children}</div>;
}

const SocietyFields = ({ formData, handleChange, selectedDistrict, bmcs = [], showBmcSelect = true }) => {
  const renderMemberFields = (title, prefix) => (
    <>
      <h4 className="font-semibold mt-4">{title}</h4>
      <div className="grid grid-cols-4 gap-3">
        <input type="number" name={`${prefix}SC`} placeholder="SC" value={formData[`${prefix}SC`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}ST`} placeholder="ST" value={formData[`${prefix}ST`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}Women`} placeholder="Women" value={formData[`${prefix}Women`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}General`} placeholder="General" value={formData[`${prefix}General`] || ""} onChange={handleChange} required className={FIELD} />
      </div>
    </>
  );

  const renderFarmerFields = (title, prefix) => (
    <>
      <h4 className="font-semibold mt-4">{title}</h4>
      <div className="grid grid-cols-4 gap-3">
        <input type="number" name={`${prefix}Small`} placeholder="Small" value={formData[`${prefix}Small`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}Agri`} placeholder="Agriculture Labour" value={formData[`${prefix}Agri`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}Marginal`} placeholder="Marginal" value={formData[`${prefix}Marginal`] || ""} onChange={handleChange} required className={FIELD} />
        <input type="number" name={`${prefix}Others`} placeholder="Others" value={formData[`${prefix}Others`] || ""} onChange={handleChange} required className={FIELD} />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <input name="societyNo" placeholder="Society No" value={formData.societyNo || ""} onChange={handleChange} required className={FIELD} />
        <input name="societyName" placeholder="Society Name" value={formData.societyName || ""} onChange={handleChange} required className={FIELD} />

        <SelectWrap>
          <select name="district" value={formData.district || ""} onChange={handleChange} required className={FIELD}>
            <option value="">Select District</option>
            {DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </SelectWrap>

        <SelectWrap>
          <select name="taluk" value={formData.taluk || ""} disabled={!formData.district} onChange={handleChange} required className={FIELD}>
            <option value="">Select Taluk</option>
            {(selectedDistrict?.taluks || []).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </SelectWrap>

        <input name="hobli" placeholder="Hobli" value={formData.hobli || ""} onChange={handleChange} required className={FIELD} />
        <input type="text" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className={FIELD} />
        <input name="address" placeholder="Address" value={formData.address || ""} onChange={handleChange} required className={FIELD} />

        <SelectWrap>
          <select name="buildingType" value={formData.buildingType || ""} onChange={handleChange} required className={FIELD}>
            <option value="">Building Type</option>
            {BUILDING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </SelectWrap>

        <SelectWrap>
          <select name="route" value={formData.route || ""} onChange={handleChange} className={FIELD}>
            <option value="">Select Route</option>
            {ROUTE_OPTIONS.map(r => <option key={r} value={r}>Route {r}</option>)}
          </select>
        </SelectWrap>
      </div>

      <h3 className="font-bold text-black mt-6">Bank Details</h3>

      <div className="grid grid-cols-2 gap-4">
        <input name="bankName" placeholder="Bank Name" value={formData.bankName || ""} onChange={handleChange} required className={FIELD} />
        <input name="branch" placeholder="Branch" value={formData.branch || ""} onChange={handleChange} required className={FIELD} />
        <input type="text" name="accountNo" placeholder="Account No" value={formData.accountNo || ""} onChange={handleChange} required className={FIELD} />
        <input name="ifsc" placeholder="IFSC Code" value={formData.ifsc || ""} onChange={handleChange} required className={FIELD} />
        <input name="pan" placeholder="PAN" value={formData.pan || ""} onChange={handleChange} required className={FIELD} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectWrap>
          <select name="eo" value={formData.eo || ""} onChange={handleChange} required className={FIELD}>
            <option value="">Select EO</option>
            {EO_LIST.map(eo => <option key={eo} value={eo}>{eo}</option>)}
          </select>
        </SelectWrap>

        {showBmcSelect && (
          <SelectWrap>
            <select name="bmcId" value={formData.bmcId || ""} onChange={handleChange} required className={FIELD}>
              <option value="">Select BMC</option>
              {bmcs.map(b => (
                <option key={b.id} value={b.id}>
                  {b.label}{b.authStatus === "Pending" ? " (Pending)" : ""}
                </option>
              ))}
            </select>
          </SelectWrap>
        )}
      </div>

      {showBmcSelect && bmcs.length === 0 && (
        <p className="text-sm text-amber-700">No BMC accounts found. Create a BMC user first, then add the society.</p>
      )}

      {renderMemberFields("Farmers Type", "totalMem")}
      {renderMemberFields("Total Farmers Type", "funcMem")}
      {renderFarmerFields("Functional Farmers", "totalFar")}
      {renderFarmerFields("Total Functional Farmers", "funcFar")}
    </div>
  );
};

export default function AddUserModal({ onClose, onSubmit }) {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bmcs, setBmcs] = useState([]);
  const [dairies, setDairies] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let active = true;
    getHierarchyOptions()
      .then((res) => {
        if (!active) return;
        setBmcs(res?.data?.bmcs || []);
        setDairies(res?.data?.dairies || []);
        setOptionsError("");
      })
      .catch((err) => {
        if (!active) return;
        setOptionsError(err.message || "Failed to load BMC/Dairy options");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "district" ? { taluk: "" } : {}),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto overflow-x-visible rounded-[18px] border border-[#e7e7e7] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {optionsError && <p className="text-sm font-medium text-red-600">{optionsError}</p>}

          <div className="grid grid-cols-3 gap-4">
            <SelectWrap>
              <select
                value={role}
                onChange={e => { setRole(e.target.value); setFormData({}); }}
                required
                className={FIELD}
              >
                <option value="">Select Role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </SelectWrap>

            <input
              name="username"
              placeholder="Username"
              value={formData.username || ""}
              onChange={handleChange}
              required
              className={FIELD}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Login Password"
                value={formData.password || ""}
                onChange={handleChange}
                required
                className={`${FIELD} pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {(role === "Society" || role === "BMC") && (
            <p className="text-sm text-slate-600">
              This account will be created as Pending and can log in only after admin approval.
            </p>
          )}

          {role === "Society" && (
            <SocietyFields
              formData={formData}
              handleChange={handleChange}
              selectedDistrict={selectedDistrict}
              bmcs={bmcs}
              showBmcSelect
            />
          )}

          {role === "BMC" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="deputyManager"
                  placeholder="Deputy Manager"
                  value={formData.deputyManager || ""}
                  onChange={handleChange}
                  required
                  className={FIELD}
                />
                <SelectWrap>
                  <select name="dairyId" value={formData.dairyId || ""} onChange={handleChange} required className={FIELD}>
                    <option value="">Select Dairy</option>
                    {dairies.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.label}{d.authStatus === "Pending" ? " (Pending)" : ""}
                      </option>
                    ))}
                  </select>
                </SelectWrap>
              </div>
              {dairies.length === 0 && (
                <p className="text-sm text-amber-700">No dairy accounts found. Create a dairy user first.</p>
              )}
              <p className="text-sm text-slate-600">
                Login username becomes the BMC ID used across milk verification and society linking.
              </p>
              <SocietyFields
                formData={formData}
                handleChange={handleChange}
                selectedDistrict={selectedDistrict}
                bmcs={bmcs}
                showBmcSelect={false}
              />
            </>
          )}

          {role === "EO" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="eoName" placeholder="EO Name" value={formData.eoName || ""} onChange={handleChange} required className={FIELD} />
              <SelectWrap>
                <select name="designation" value={formData.designation || ""} onChange={handleChange} required className={FIELD}>
                  <option value="">Designation</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </SelectWrap>
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className={FIELD} />
              <input name="employeeId" placeholder="Employee ID" value={formData.employeeId || ""} onChange={handleChange} required className={FIELD} />
            </div>
          )}

          {role === "Dairy" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="dairyName" placeholder="Dairy Name" value={formData.dairyName || ""} onChange={handleChange} required className={FIELD} />
              <input name="address" placeholder="Address" value={formData.address || ""} onChange={handleChange} required className={`${FIELD} col-span-2`} />
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className={FIELD} />
            </div>
          )}

          {role === "Other Users" && (
            <div className="grid grid-cols-2 gap-4">
              <input name="empId" placeholder="Employee ID" value={formData.empId || ""} onChange={handleChange} required className={FIELD} />
              <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} required className={FIELD} />
              <input name="designation" placeholder="Designation" value={formData.designation || ""} onChange={handleChange} required className={FIELD} />
              <input type="number" name="contactNo" placeholder="Contact No" value={formData.contactNo || ""} onChange={handleChange} required className={FIELD} />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[#e7e7e7] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#d7dbe3] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !role || (role === "Society" && bmcs.length === 0) || (role === "BMC" && dairies.length === 0)}
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
