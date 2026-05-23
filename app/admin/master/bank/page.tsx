"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
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
    nama_bank: string;
    no_rek: string;
    atas_nama: string;
    cabang: string;
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
        nama_bank: "",
        no_rek: "",
        atas_nama: "",
        cabang: "",
    });

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
    const [sortField, setSortField] = useState<keyof Product>("nama_bank");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    /* ================= PAGINATION ================= */
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    /* ================= HANDLE ================= */
    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Product>>("/bank-rekening", {
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

        if (!form.nama_bank.trim()) nextFieldErrors.nama_bank = "Nama bank wajib diisi.";
        if (!form.no_rek.trim()) {
            nextFieldErrors.no_rek = "No rekening wajib diisi.";
        } else if (form.no_rek.trim().length < 5) {
            nextFieldErrors.no_rek = "No rekening minimal 5 digit.";
        }
        if (!form.atas_nama.trim()) nextFieldErrors.atas_nama = "Atas nama rekening wajib diisi.";
        if (!form.cabang.trim()) nextFieldErrors.cabang = "Cabang wajib diisi.";

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
                await api.put(`/bank-rekening/${editId}`, form);
                setSuccessMessage("Bank dan rekening berhasil diperbarui.");
            } else {
                await api.post("/bank-rekening", form);
                setSuccessMessage("Bank dan rekening berhasil ditambahkan.");
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
        setFieldErrors({});
        setErrorMessage("");
        setEditId(id);
        setOpenForm(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/bank-rekening/${deleteId}`);
            setDeleteId(null);
            setErrorMessage("");
            setSuccessMessage("Bank dan rekening berhasil dihapus.");

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
        setForm({ nama_bank: "", no_rek: "", atas_nama: "", cabang: "" });
        setFieldErrors({});
        setErrorMessage("");
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
                <h1 className="text-3xl font-bold">Data Bank & Rekening</h1>
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
                    placeholder="Cari bank / no rekening / atas nama..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 bg-white shadow"
                />

                <button
                    onClick={() => {
                        setSuccessMessage("");
                        setErrorMessage("");
                        setOpenForm(true);
                    }}
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
                                <button onClick={() => handleSort("id" as any)} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_bank")} className="flex items-center gap-2">
                                    Nama Bank <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("no_rek")} className="flex items-center gap-2">
                                    No Rekening <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("atas_nama")} className="flex items-center gap-2">
                                    A.N Rekening <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("cabang")} className="flex items-center gap-2">
                                    Cabang <ArrowUpDown size={14} />
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
                                <td className="p-3">{item.nama_bank}</td>
                                <td className="p-3">{item.no_rek}</td>
                                <td className="p-3">{item.atas_nama}</td>
                                <td className="p-3">{item.cabang}</td>
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
                        className={`px-3 py-1 border rounded-md ${meta.current_page === i + 1 ? "bg-primary text-white" : ""}`}
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
                                placeholder="Nama Bank"
                                value={form.nama_bank}
                                onChange={(e) => {
                                    setForm({ ...form, nama_bank: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, nama_bank: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama_bank ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.nama_bank ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama_bank}</p> : null}

                            <input
                                placeholder="No Rekening"
                                value={form.no_rek}
                                onChange={(e) => {
                                    setForm({ ...form, no_rek: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, no_rek: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.no_rek ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.no_rek ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.no_rek}</p>
                            ) : (
                                <p className="text-xs text-gray-500 -mt-2">
                                    Minimal 5 digit dan hanya boleh berisi angka.
                                </p>
                            )}

                            <input
                                placeholder="Atas Nama Rekening"
                                value={form.atas_nama}
                                onChange={(e) => {
                                    setForm({ ...form, atas_nama: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, atas_nama: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.atas_nama ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.atas_nama ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.atas_nama}</p> : null}

                            <input
                                placeholder="Cabang"
                                value={form.cabang}
                                onChange={(e) => {
                                    setForm({ ...form, cabang: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, cabang: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.cabang ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.cabang ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.cabang}</p> : null}

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


