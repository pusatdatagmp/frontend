"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
    extractErrorMessage,
    type ApiListResponse,
    type Meta,
} from "@/lib/transaksiPembelian";
import axios from "axios";

/* ================= TYPE ================= */
type Product = {
    id: number;
    nama: string;
    alamat: string;
    no_hp: string;
    jabatan: string;
    tanggal_masuk: string;
    status: "aktif" | "non aktif";
};

type FormType = Omit<Product, "id">;
type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

export default function Page() {
    const [data, setData] = useState<Product[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState<FormType>({
        nama: "",
        alamat: "",
        no_hp: "",
        jabatan: "",
        tanggal_masuk: "",
        status: "aktif",
    });

    const [listJabatan, setListJabatan] = useState([
        "Direktur",
        "Manager",
        "Admin",
        "Accounting",
        "Warehouse",
        "Driver",
    ]);

    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    /* ================= FILTER ================= */
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    /* ================= SORT ================= */
    const [sortField, setSortField] = useState<keyof Product>("nama");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    /* ================= PAGINATION ================= */
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    /* ================= HANDLE ================= */
    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Product>>("/karyawan", {
                params: {
                    search: search || undefined,
                    sort_field: sortField,
                    sort_order: sortOrder,
                    page: currentPage,
                    per_page: perPage,
                },
            });

            setData(response.data.data ?? []);
            setMeta(response.data.meta ?? initialMeta);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, sortField, sortOrder, currentPage]);

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.nama.trim()) nextFieldErrors.nama = "Nama wajib diisi.";
        if (!form.alamat.trim()) nextFieldErrors.alamat = "Alamat wajib diisi.";
        if (!form.no_hp.trim()) {
            nextFieldErrors.no_hp = "No HP wajib diisi.";
        } else if (form.no_hp.trim().length < 10) {
            nextFieldErrors.no_hp = "No HP minimal 10 karakter.";
        }
        if (!form.jabatan.trim()) nextFieldErrors.jabatan = "Jabatan wajib dipilih.";
        if (!form.tanggal_masuk.trim()) nextFieldErrors.tanggal_masuk = "Tanggal masuk wajib diisi.";
        if (!form.status.trim()) nextFieldErrors.status = "Status wajib dipilih.";

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setSuccessMessage("");
            return;
        }

        try {
            setFieldErrors({});
            setErrorMessage("");
            setSuccessMessage("");

            if (editId) {
                await api.put(`/karyawan/${editId}`, form);
                setSuccessMessage("Karyawan berhasil diperbarui.");
            } else {
                await api.post("/karyawan", form);
                setSuccessMessage("Karyawan berhasil ditambahkan.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiErrors = error.response?.data?.errors;

                if (apiErrors && typeof apiErrors === "object") {
                    const mappedErrors: FieldErrors = {};

                    for (const key of Object.keys(apiErrors)) {
                        const firstMessage = apiErrors[key]?.[0];
                        if (typeof firstMessage === "string") {
                            mappedErrors[key as keyof FormType] = firstMessage;
                        }
                    }

                    if (Object.keys(mappedErrors).length > 0) {
                        setFieldErrors(mappedErrors);
                        setErrorMessage("");
                        setSuccessMessage("");
                        return;
                    }
                }
            }

            setErrorMessage(extractErrorMessage(error));
            setSuccessMessage("");
        }
    };

    const handleEdit = (item: Product) => {
        const { id, ...rest } = item;
        setForm(rest);
        setEditId(id);
        setOpenForm(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/karyawan/${deleteId}`);
            setDeleteId(null);
            setErrorMessage("");
            setSuccessMessage("Karyawan berhasil dihapus.");

            if (data.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await fetchData();
            }
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
            setSuccessMessage("");
        }
    };

    const resetForm = () => {
        setForm({
            nama: "",
            alamat: "",
            no_hp: "",
            jabatan: "",
            tanggal_masuk: "",
            status: "aktif",
        });
        setFieldErrors({});
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

    /* ================= PAGINATION ================= */
    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Data Karyawan</h1>
            </div>

            {errorMessage && !openForm ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            {successMessage ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {successMessage}
                </div>
            ) : null}

            <div className="flex items-center justify-between">
                <input
                    placeholder="Cari nama atau jabatan..."
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

            {/* TABLE */}
            <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-white shadow-lg">
                        <tr>
                            <th className="p-3">
                                <button onClick={() => handleSort("id" as any)} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("nama")} className="flex items-center gap-2">
                                    Nama <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3 text-left">Alamat</th>

                            <th className="p-3">
                                <button onClick={() => handleSort("no_hp")} className="flex items-center gap-2">
                                    No HP <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("jabatan")} className="flex items-center gap-2">
                                    Jabatan <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal_masuk")} className="flex items-center gap-2">
                                    Tanggal Masuk <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("status")} className="flex items-center gap-2">
                                    Status <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((item, index) => (
                            <tr key={item.id} className="border-t border-primary/20 hover:bg-white/50">
                                <td className="p-3 text-center">
                                    {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * (meta.per_page || perPage) + index + 1}
                                </td>
                                <td className="p-3">{item.nama}</td>
                                <td className="p-3">{item.alamat}</td>
                                <td className="p-3">{item.no_hp}</td>
                                <td className="p-3">{item.jabatan}</td>
                                <td className="p-3">{item.tanggal_masuk}</td>
                                <td className="p-3">
                                    <span
                                        className={`inline-flex items-center gap-2 min-w-[90px] justify-center px-4 py-2 rounded-md text-xs capitalize
                                                ${item.status === "aktif"
                                                ? "bg-lime-500/50 text-white"
                                                : "bg-black/70 text-white backdrop-blur-xl"
                                            }`}
                                    >
                                        <Circle
                                            size={6}
                                            className={`${item.status === "aktif" ? "fill-white" : "fill-white opacity-70"}`}
                                        />
                                        {item.status}
                                    </span>
                                </td>

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
                    disabled={(meta.current_page || 1) === 1 || loading}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded-md"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        disabled={loading}
                        className={`px-3 py-1 border rounded-md ${meta.current_page === i + 1 ? "bg-primary text-white" : ""
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    disabled={(meta.current_page || 1) === totalPages || totalPages === 0 || loading}
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

                            {errorMessage ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errorMessage}
                                </div>
                            ) : null}

                            <input
                                placeholder="Nama"
                                value={form.nama}
                                onChange={(e) => {
                                    setForm({ ...form, nama: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, nama: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.nama ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama}</p> : null}

                            <input
                                placeholder="Alamat"
                                value={form.alamat}
                                onChange={(e) => {
                                    setForm({ ...form, alamat: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, alamat: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.alamat ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.alamat ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.alamat}</p> : null}

                            <input
                                placeholder="No HP"
                                value={form.no_hp}
                                onChange={(e) => {
                                    setForm({ ...form, no_hp: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, no_hp: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.no_hp ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.no_hp ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.no_hp}</p>
                            ) : (
                                <p className="text-xs text-gray-500 -mt-2">
                                    Minimal 10 karakter. Boleh angka, spasi, tanda kurung, `+`, dan `-`.
                                </p>
                            )}
                            <select
                                value={form.jabatan}
                                onChange={(e) => {
                                    setForm({ ...form, jabatan: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, jabatan: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.jabatan ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Jabatan</option>
                                {listJabatan.map((item, i) => (
                                    <option key={i} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.jabatan ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.jabatan}</p> : null}

                            <input
                                type="date"
                                value={form.tanggal_masuk}
                                onChange={(e) => {
                                    setForm({ ...form, tanggal_masuk: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, tanggal_masuk: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.tanggal_masuk ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.tanggal_masuk ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.tanggal_masuk}</p> : null}

                            <select
                                value={form.status}
                                onChange={(e) => {
                                    setForm({ ...form, status: e.target.value as "aktif" | "non aktif" });
                                    setFieldErrors((prev) => ({ ...prev, status: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.status ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="aktif">Aktif</option>
                                <option value="non aktif">Non Aktif</option>
                            </select>
                            {fieldErrors.status ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.status}</p> : null}

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

            {/* MODAL DELETE tetap sama */}
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


