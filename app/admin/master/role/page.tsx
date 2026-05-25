"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getSortClass } from "@/lib/getSortClass";

type RoleRow = {
  id: number;
  no: number;
  role: string;
};

type FormType = Omit<RoleRow, "id" | "no">;
type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialRoles: RoleRow[] = [
  { id: 1, no: 1, role: "Super Admin" },
  { id: 2, no: 2, role: "Admin" },
];
const STORAGE_KEY = "master_role_rows_v1";

export default function MasterRolePage() {
  const [data, setData] = useState<RoleRow[]>(initialRoles);
  const [form, setForm] = useState<FormType>({ role: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState<keyof RoleRow>("no");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const [storageReady, setStorageReady] = useState(false);

  const resetForm = () => {
    setForm({ role: "" });
    setFieldErrors({});
    setEditId(null);
    setOpenForm(false);
  };

  const handleSubmit = () => {
    const nextFieldErrors: FieldErrors = {};
    const trimmedRole = form.role.trim();

    if (!trimmedRole) {
      nextFieldErrors.role = "Role wajib diisi.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload: FormType = { role: trimmedRole };

    if (editId) {
      setData((prev) => prev.map((item) => (item.id === editId ? { ...item, ...payload } : item)));
    } else {
      setData((prev) => {
        const nextId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
        const nextNo = prev.length > 0 ? Math.max(...prev.map((item) => item.no)) + 1 : 1;
        return [...prev, { id: nextId, no: nextNo, ...payload }];
      });
    }

    resetForm();
  };

  const handleEdit = (row: RoleRow) => {
    setForm({ role: row.role });
    setFieldErrors({});
    setEditId(row.id);
    setOpenForm(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setData((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
  };

  const handleSort = (field: keyof RoleRow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder("asc");
  };

  const sortedData = useMemo(() => {
    const rows = [...data];

    const filteredRows = search
      ? rows.filter((row) => row.role.toLowerCase().includes(search.toLowerCase()))
      : rows;

    filteredRows.sort((a, b) => sortRows(a, b, sortField, sortOrder));
    return filteredRows;
  }, [data, search, sortField, sortOrder]);

  const totalPages = useMemo(() => Math.max(Math.ceil(sortedData.length / perPage), 1), [sortedData.length]);
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(
    () => sortedData.slice((effectivePage - 1) * perPage, effectivePage * perPage),
    [effectivePage, sortedData]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStorageReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as RoleRow[];
      if (!Array.isArray(parsed)) {
        setStorageReady(true);
        return;
      }

      const sanitized = parsed
        .filter(
          (row) =>
            row &&
            typeof row === "object" &&
            Number.isFinite(row.id) &&
            typeof row.role === "string" &&
            row.role.trim().length > 0
        )
        .map((row, index) => ({
          id: Number(row.id),
          no: Number((row as Partial<RoleRow>).no) || index + 1,
          role: String(row.role),
        }));

      if (sanitized.length > 0) {
        setData(sanitized);
      }
    } catch {
      // ignore parse error and fallback to default seed
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, storageReady]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Role</h1>
      </div>

      <div className="flex items-center justify-between">
        <input
          placeholder="Cari role..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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

      <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-white shadow-lg">
            <tr>
              <th className="p-3">
                <button
                  type="button"
                  onClick={() => handleSort("no")}
                  className={`flex w-full items-center justify-center gap-2 transition-colors ${getSortClass(sortField, "no")}`}
                >
                  No
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button
                  type="button"
                  onClick={() => handleSort("role")}
                  className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "role")}`}
                >
                  Role
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id} className="border-t border-primary/20 hover:bg-lime-100/80">
                <td className="p-3 text-center">
                  {row.no}
                </td>
                <td className="p-3">{row.role}</td>
                <td className="p-3 flex justify-center gap-2">
                  <button onClick={() => handleEdit(row)} className="p-2 bg-blue-500/30 text-blue-700 rounded-md">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(row.id)} className="p-2 bg-red-500/30 text-red-700 rounded-md">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  Data role tidak ditemukan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button
          disabled={effectivePage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 border rounded-md"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded-md ${effectivePage === i + 1 ? "bg-primary text-white" : ""}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={effectivePage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 border rounded-md"
        >
          Next
        </button>
      </div>

      <AnimatePresence>
        {openForm ? (
          <Modal>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
              <h2 className="text-lg font-semibold">{editId ? "Edit Role" : "Tambah Role"}</h2>

              <input
                placeholder="Role"
                value={form.role}
                onChange={(e) => {
                  setForm({ role: e.target.value });
                  setFieldErrors({ role: undefined });
                }}
                className={`w-full border p-2 rounded-md ${fieldErrors.role ? "border-red-500 focus:outline-red-500" : ""}`}
              />
              {fieldErrors.role ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.role}</p> : null}

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
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId ? (
          <Modal>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
              <h2 className="text-lg font-semibold">Hapus Data?</h2>
              <div className="flex justify-center gap-2">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-200 rounded-md">
                  Batal
                </button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
                  Hapus
                </button>
              </div>
            </motion.div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function sortRows(a: RoleRow, b: RoleRow, field: keyof RoleRow, order: "asc" | "desc") {
  if (field === "id" || field === "no") {
    const aNumber = field === "id" ? a.id : a.no;
    const bNumber = field === "id" ? b.id : b.no;
    return order === "asc" ? aNumber - bNumber : bNumber - aNumber;
  }

  const aValue = String(a[field]).toLowerCase();
  const bValue = String(b[field]).toLowerCase();
  return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </motion.div>
  );
}
