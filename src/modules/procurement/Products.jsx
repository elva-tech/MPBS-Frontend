import { useMemo, useState, useEffect } from "react";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { usePopup } from "../../shared/context/PopupContext";
import { listProducts, createProduct, updateProduct } from "../../utils/api";

const emptyForm = { name: "", unit: "Bag", rate: "", stock: "", status: "Active" };
const pageSize = 4;

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatRate(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProcurementProducts() {
  const { showConfirm, showPopup } = usePopup();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const mapProduct = (p) => ({
    id: p._id,
    name: p.name,
    unit: p.unit,
    rate: p.rate,
    stock: p.stockQty ?? 0,
    status: p.status || "Active",
  });

  const loadProducts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listProducts();
      setProducts((res?.data || []).map(mapProduct));
    } catch (err) {
      setLoadError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [page, products]);

  const openAddForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      unit: product.unit,
      rate: String(product.rate),
      stock: String(product.stock),
      status: product.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId("");
    setForm(emptyForm);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      unit: form.unit,
      rate: Number(form.rate || 0),
      stockQty: Number(form.stock || 0),
      status: form.status,
    };

    if (!payload.name) return;

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      await loadProducts();
      setPage(1);
      closeForm();
    } catch (err) {
      await showPopup({ message: err.message || "Failed to save product.", type: "error" });
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = await showConfirm({ message: `Mark ${product.name} as inactive?` });
    if (!confirmed) return;
    try {
      await updateProduct(product.id, { status: "Inactive" });
      await loadProducts();
    } catch (err) {
      await showPopup({ message: err.message || "Failed to update product.", type: "error" });
    }
  };

  return (
    <div className="module-page text-[#1F2A44]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(30,75,107,0.22)] hover:bg-[#163A54]"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      {loading ? <p className="text-sm text-[#5B6B7F]">Loading products...</p> : null}

      {formOpen && (
        <form onSubmit={saveProduct} className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Product Name"
              className="rounded-lg border border-[#D7E4FF] px-3 py-2 text-sm font-medium text-[#1F2A44] focus:ring-2 focus:ring-[#1E4B6B]"
              required
            />
            <select
              value={form.unit}
              onChange={(event) => updateForm("unit", event.target.value)}
              className="rounded-lg border border-[#D7E4FF] px-3 py-2 text-sm font-medium text-[#1F2A44] focus:ring-2 focus:ring-[#1E4B6B]"
            >
              <option>Bag</option>
              <option>Packet</option>
              <option>Bottle</option>
            </select>
            <input
              type="number"
              value={form.rate}
              onChange={(event) => updateForm("rate", event.target.value)}
              placeholder="Rate"
              className="rounded-lg border border-[#D7E4FF] px-3 py-2 text-sm font-medium text-[#1F2A44] focus:ring-2 focus:ring-[#1E4B6B]"
              required
            />
            <input
              type="number"
              value={form.stock}
              onChange={(event) => updateForm("stock", event.target.value)}
              placeholder="Stock"
              className="rounded-lg border border-[#D7E4FF] px-3 py-2 text-sm font-medium text-[#1F2A44] focus:ring-2 focus:ring-[#1E4B6B]"
              required
            />
            <select
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
              className="rounded-lg border border-[#D7E4FF] px-3 py-2 text-sm font-medium text-[#1F2A44] focus:ring-2 focus:ring-[#1E4B6B]"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="rounded-lg border border-[#D7E4FF] px-4 py-2 text-sm font-semibold text-[#1E4B6B] hover:bg-[#F7FAFF]">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A54]">
              {editingId ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-lg border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Product Name</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Rate (Rs)</th>
                <th className="px-5 py-3 font-semibold">Current Stock</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id || product.name} className="border-b border-[#EEF3FB] last:border-b-0">
                  <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{product.name}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{product.unit}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatRate(product.rate)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(product.stock)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                        product.status === "Active"
                          ? "bg-[#E8F7EF] text-[#168A53]"
                          : "bg-[#FDECEC] text-[#D12D2D]"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-3 text-[#1E4B6B]">
                      <button type="button" onClick={() => openEditForm(product)} className="rounded p-1 hover:bg-[#EAF1FF]" aria-label={`Edit ${product.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => deleteProduct(product)} className="rounded p-1 hover:bg-red-50 hover:text-red-600" aria-label={`Deactivate ${product.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EEF3FB] px-5 py-4">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => setPage(pageNumber)}
            className={`h-9 w-9 rounded-lg border text-sm font-semibold ${
              pageNumber === page
                ? "border-[#9FC7F8] bg-[#EAF4FF] text-[#1E4B6B]"
                : "border-[#D7E4FF] bg-white text-[#1E4B6B] hover:bg-[#F7FAFF]"
            }`}
          >
            {pageNumber}
          </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((current) => (current >= totalPages ? 1 : current + 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E4FF] bg-white text-[#1E4B6B] hover:bg-[#F7FAFF]"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
