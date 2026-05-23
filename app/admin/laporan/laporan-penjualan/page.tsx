"use client";

import { useState, useMemo, useEffect } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPE ================= */
type Product = {
    id: number;
    nama_unit: string;
    no_pol: string;
    jenis_kendaraan: string;
};

type FormType = Omit<Product, "id">;

export default function Page() {
    const [data, setData] = useState<Product[]>([
        { id: 1, nama_unit: "Truck Box 01", no_pol: "B 1234 CD", jenis_kendaraan: "Truck" },
        { id: 2, nama_unit: "Pickup 02", no_pol: "D 5678 EF", jenis_kendaraan: "Pickup" },
    ]);

    const [listJenisKendaraan, setListJenisKendaraan] = useState([
        "Roda 2",
        "Roda 3",
        "Roda 4",
    ]);

    const [form, setForm] = useState<FormType>({
        nama_unit: "",
        no_pol: "",
        jenis_kendaraan: "",
    });

    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    /* ================= FILTER ================= */
    const [search, setSearch] = useState("");

    /* ================= SORT ================= */
    const [sortField, setSortField] = useState<keyof Product>("nama_unit");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    /* ================= PAGINATION ================= */
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    /* ================= HANDLE ================= */

    const handleSubmit = () => {
        if (!form.nama_unit || !form.no_pol || !form.jenis_kendaraan) return;

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
        setForm({ nama_unit: "", no_pol: "", jenis_kendaraan: "" });
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
                    item.nama_unit.toLowerCase().includes(search.toLowerCase()) ||
                    item.no_pol.toLowerCase().includes(search.toLowerCase())
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
                <h1 className="text-3xl font-bold">Laporan Penjualan SPPG</h1>
            </div>

            <div className="flex items-center justify-between">
                <input
                    placeholder="Cari nama unit atau no polisi..."
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
            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3">No</th>

                            <th className="p-3">
                                <button onClick={() => handleSort("nama_unit")} className="flex items-center gap-2">
                                    Nama Unit <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("no_pol")} className="flex items-center gap-2">
                                    No Polisi <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("jenis_kendaraan")} className="flex items-center gap-2">
                                    Jenis Kendaraan <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((item, index) => (
                            <tr key={item.id} className="border-t">
                                <td className="p-3 text-center">
                                    {(currentPage - 1) * perPage + index + 1}
                                </td>
                                <td className="p-3">{item.nama_unit}</td>
                                <td className="p-3">{item.no_pol}</td>
                                <td className="p-3">{item.jenis_kendaraan}</td>

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

            {/* FORM MODAL */}
            <AnimatePresence>
                {openForm && (
                    <Modal onClose={resetForm}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                            <h2 className="text-lg font-semibold">
                                {editId ? "Edit Data" : "Tambah Data"}
                            </h2>

                            <input
                                placeholder="Nama Unit"
                                value={form.nama_unit}
                                onChange={(e) => setForm({ ...form, nama_unit: e.target.value })}
                                className="w-full border p-2 rounded-md"
                            />

                            <input
                                placeholder="No Polisi"
                                value={form.no_pol}
                                onChange={(e) => setForm({ ...form, no_pol: e.target.value })}
                                className="w-full border p-2 rounded-md"
                            />

                            {/* Select Jenis Kendaraan */}
                            <select
                                value={form.jenis_kendaraan}
                                onChange={(e) => setForm({ ...form, jenis_kendaraan: e.target.value })}
                                className="w-full border p-2 rounded-md"
                            >
                                <option value="">Pilih Kategori</option>
                                {listJenisKendaraan.map((item, i) => (
                                    <option key={i} value={item}>
                                        {item}
                                    </option>
                                ))}
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

            {/* MODAL DELETE */}
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

/* ================= MODAL ================= */
function Modal({
    children,
   
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            
        >
            <div onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </motion.div>
    );
}