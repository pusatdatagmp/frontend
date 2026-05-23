"use client";

import { useState, useMemo, useEffect } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPE ================= */
type Product = {
  id: number;
  nomor_invoice: string;
  penjualan_id: string;
  tanggal_invoice: string;
  total_tagihan: string;
  status_pembayaran: "lunas" | "belum lunas";
};

type FormType = Omit<Product, "id">;

export default function Page() {
  const [data, setData] = useState<Product[]>([
    {
      id: 1,
      nomor_invoice: "INV-001",
      penjualan_id: "TRX-001",
      tanggal_invoice: "2026-04-13",
      total_tagihan: "100000",
      status_pembayaran: "belum lunas",
    },
    {
      id: 2,
      nomor_invoice: "INV-002",
      penjualan_id: "TRX-002",
      tanggal_invoice: "2026-04-12",
      total_tagihan: "250000",
      status_pembayaran: "lunas",
    },
  ]);

  const [form, setForm] = useState<FormType>({
    nomor_invoice: "",
    penjualan_id: "",
    tanggal_invoice: "",
    total_tagihan: "",
    status_pembayaran: "belum lunas",
  });

  const [editId, setEditId] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ================= FILTER ================= */
  const [search, setSearch] = useState("");

  /* ================= SORT ================= */
  const [sortField, setSortField] = useState<keyof Product>("nomor_invoice");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  /* ================= HANDLE ================= */

  const handleSubmit = () => {
    if (!form.nomor_invoice || !form.penjualan_id || !form.tanggal_invoice || !form.total_tagihan) return;

    if (editId) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editId ? { ...item, ...form } : item
        )
      );
    } else {
      setData((prev) => [
        ...prev,
        { id: Date.now(), ...form },
      ]);
    }

    resetForm();
  };

  const handleEdit = (item: Product) => {
    const { id, ...rest } = item;
    setForm(rest);
    setEditId(id);
    setOpenForm(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setData((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setForm({
      nomor_invoice: "",
      penjualan_id: "",
      tanggal_invoice: "",
      total_tagihan: "",
      status_pembayaran: "belum lunas",
    });
    setEditId(null);
    setOpenForm(false);
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  /* ================= FILTER + SORT ================= */

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      result = result.filter(
        (item) =>
          item.nomor_invoice.toLowerCase().includes(search.toLowerCase()) ||
          item.penjualan_id.toLowerCase().includes(search.toLowerCase())
      );
    }

    result.sort((a, b) => {
      const aVal = String(a[sortField]).toLowerCase();
      const bVal = String(b[sortField]).toLowerCase();

      if (sortOrder === "asc") return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });

    return result;
  }, [data, search, sortField, sortOrder]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredData.length / perPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daftar dan Jadwal Pengiriman</h1>
      </div>

      <div className="flex items-center justify-between">
        <input
          placeholder="Cari nomor invoice atau ID penjualan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-md w-1/4 bg-white shadow"
        />

        <button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg shadow-black/20 text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition cursor-pointer"
        >
          <Plus size={16} />
          Tambah Data
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-white shadow-lg">
            <tr>
              <th className="p-3">No</th>

              <th className="p-3">
                <button onClick={() => handleSort("nomor_invoice")} className="flex items-center gap-2">
                  Nomor Invoice <ArrowUpDown size={14} />
                </button>
              </th>

              <th className="p-3">
                <button onClick={() => handleSort("penjualan_id")} className="flex items-center gap-2">
                  ID Penjualan <ArrowUpDown size={14} />
                </button>
              </th>

              <th className="p-3">
                <button onClick={() => handleSort("tanggal_invoice")} className="flex items-center gap-2">
                  Tanggal Invoice <ArrowUpDown size={14} />
                </button>
              </th>

              <th className="p-3">
                <button onClick={() => handleSort("total_tagihan")} className="flex items-center gap-2">
                  Total Tagihan <ArrowUpDown size={14} />
                </button>
              </th>

              <th className="p-3">
                <button onClick={() => handleSort("status_pembayaran")} className="flex items-center gap-2">
                  Status <ArrowUpDown size={14} />
                </button>
              </th>

              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.id} className="border-t border-primary/20 hover:bg-white/50">
                <td className="p-3 text-center">
                  {(currentPage - 1) * perPage + index + 1}
                </td>
                <td className="p-3">{item.nomor_invoice}</td>
                <td className="p-3">{item.penjualan_id}</td>
                <td className="p-3">{item.tanggal_invoice}</td>
                <td className="p-3">{item.total_tagihan}</td>
                <td className="p-3 capitalize">{item.status_pembayaran}</td>

                <td className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-blue-500/30 text-blue-700 rounded-md"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-2 bg-red-500/30 text-red-700 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded-md"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded-md ${currentPage === i + 1 ? "bg-primary text-white" : ""
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded-md"
        >
          Next
        </button>
      </div>

      {/* FORM MODAL tetap sama style */}
      <AnimatePresence>
        {openForm && (
          <Modal onClose={resetForm}>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
              <h2 className="text-lg font-semibold">
                {editId ? "Edit Data" : "Tambah Data"}
              </h2>

              <input
                placeholder="Nomor Invoice"
                value={form.nomor_invoice}
                onChange={(e) => setForm({ ...form, nomor_invoice: e.target.value })}
                className="w-full border p-2 rounded-md"
              />

              <input
                placeholder="ID Penjualan"
                value={form.penjualan_id}
                onChange={(e) => setForm({ ...form, penjualan_id: e.target.value })}
                className="w-full border p-2 rounded-md"
              />

              <input
                type="date"
                value={form.tanggal_invoice}
                onChange={(e) => setForm({ ...form, tanggal_invoice: e.target.value })}
                className="w-full border p-2 rounded-md"
              />

              <input
                placeholder="Total Tagihan"
                value={form.total_tagihan}
                onChange={(e) => setForm({ ...form, total_tagihan: e.target.value })}
                className="w-full border p-2 rounded-md"
              />

              <select
                value={form.status_pembayaran}
                onChange={(e) =>
                  setForm({ ...form, status_pembayaran: e.target.value as any })
                }
                className="w-full border p-2 rounded-md"
              >
                <option value="belum lunas">Belum Lunas</option>
                <option value="lunas">Lunas</option>
              </select>

              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md">
                  Batal
                </button>

                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-700 text-white rounded-md">
                  Simpan
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* MODAL DELETE tetap */}
      <AnimatePresence>
        {deleteId && (
          <Modal onClose={() => setDeleteId(null)}>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
              <h2 className="text-lg font-semibold">
                Hapus Data?
              </h2>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Batal
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* MODAL tetap sama */
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </motion.div>
  );
}