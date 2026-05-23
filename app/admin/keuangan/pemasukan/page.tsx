"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";
import { extractErrorMessage, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";

type Pemasukan = {
    id: number;
    tanggal: string;
    jenis: "modal" | "hutang";
    jumlah: number | string;
    keterangan: string;
};

type FormType = {
    tanggal: string;
    jenis: "modal" | "hutang";
    jumlah: string;
    keterangan: string;
};

type FormErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    tanggal: "",
    jenis: "modal",
    jumlah: "",
    keterangan: "",
};

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

const formatRupiah = (value: number | string) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatJenis = (value: "modal" | "hutang") =>
    value === "modal" ? "Modal" : "Hutang";

export default function Page() {
    const [data, setData] = useState<Pemasukan[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<FormType>(initialForm);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Pemasukan | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Pemasukan>("tanggal");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Pemasukan>>("/pemasukan", {
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
        const load = async () => {
            await fetchData();
        };

        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, sortField, sortOrder, currentPage]);

    const resetForm = () => {
        setForm(initialForm);
        setFormErrors({});
        setEditId(null);
        setOpenForm(false);
        setErrorMessage("");
    };

    const validateForm = (): FormErrors => {
        const nextErrors: FormErrors = {};

        if (!form.tanggal) nextErrors.tanggal = "Tanggal wajib diisi.";
        if (!form.jumlah || Number(form.jumlah) <= 0) nextErrors.jumlah = "Jumlah pemasukan harus lebih besar dari 0.";
        if (!form.keterangan.trim()) nextErrors.keterangan = "Keterangan wajib diisi.";

        return nextErrors;
    };

    const handleSubmit = async () => {
        const nextErrors = validateForm();
        setFormErrors(nextErrors);
        setErrorMessage("");
        setSuccessMessage("");

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                tanggal: form.tanggal,
                jenis: form.jenis,
                jumlah: Number(form.jumlah),
                keterangan: form.keterangan.trim(),
            };

            if (editId) {
                await api.put(`/pemasukan/${editId}`, payload);
                setSuccessMessage("Data pemasukan berhasil diperbarui.");
            } else {
                await api.post("/pemasukan", payload);
                setSuccessMessage("Data pemasukan berhasil ditambahkan.");
            }

            resetForm();
            await fetchData();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiErrors = error.response?.data?.errors;

                if (apiErrors && typeof apiErrors === "object") {
                    const mappedErrors: FormErrors = {};

                    for (const key of Object.keys(apiErrors)) {
                        const firstMessage = apiErrors[key]?.[0];
                        if (
                            typeof firstMessage === "string" &&
                            (key === "tanggal" || key === "jenis" || key === "jumlah" || key === "keterangan")
                        ) {
                            mappedErrors[key as keyof FormType] = firstMessage;
                        }
                    }

                    if (Object.keys(mappedErrors).length > 0) {
                        setFormErrors(mappedErrors);
                        return;
                    }
                }
            }

            setErrorMessage(extractErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Pemasukan) => {
        setForm({
            tanggal: item.tanggal,
            jenis: item.jenis,
            jumlah: String(Number(item.jumlah)),
            keterangan: item.keterangan,
        });
        setFormErrors({});
        setEditId(item.id);
        setOpenForm(true);
        setErrorMessage("");
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.delete(`/pemasukan/${deleteTarget.id}`);
            setSuccessMessage("Data pemasukan berhasil dihapus.");
            setDeleteTarget(null);

            if (data.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await fetchData();
            }
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSort = (field: keyof Pemasukan) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder(field === "tanggal" ? "desc" : "asc");
    };

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Pemasukan</h1>
            </div>

            {errorMessage ? (
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
                    placeholder="Cari keterangan..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 min-w-60 bg-white shadow"
                />

                <button
                    onClick={() => {
                        setForm(initialForm);
                        setFormErrors({});
                        setEditId(null);
                        setOpenForm(true);
                    }}
                    className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg shadow-black/20 text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition cursor-pointer"
                >
                    <Plus size={16} />
                    Tambah Data
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3">
                                <button onClick={() => handleSort("id" as any)} className="flex items-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal")} className="flex items-center gap-2">
                                    Tanggal <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-left">
                                <button onClick={() => handleSort("jenis")} className="flex items-center gap-2">
                                    Jenis <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("jumlah")} className="flex items-center gap-2">
                                    Jumlah <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-left">
                                <button onClick={() => handleSort("keterangan")} className="flex items-center gap-2">
                                    Keterangan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    Belum ada data pemasukan.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-3 text-center">
                                        {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3">{item.tanggal}</td>
                                    <td className="p-3 capitalize">{formatJenis(item.jenis)}</td>
                                    <td className="p-3">{formatRupiah(item.jumlah)}</td>
                                    <td className="p-3">{item.keterangan}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 bg-blue-500/30 text-blue-700 rounded-md"
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            <button
                                                onClick={() => setDeleteTarget(item)}
                                                className="p-2 bg-red-500/30 text-red-700 rounded-md"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 border rounded-md ${currentPage === i + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            <AnimatePresence>
                {openForm ? (
                    <Modal onClose={resetForm}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                            <h2 className="text-lg font-semibold">
                                {editId ? "Edit Data" : "Tambah Data"}
                            </h2>

                            <div className="space-y-1">
                                <input
                                    type="date"
                                    value={form.tanggal}
                                    onChange={(e) => {
                                        setForm({ ...form, tanggal: e.target.value });
                                        setFormErrors((prev) => ({ ...prev, tanggal: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.tanggal ? "border-red-500" : ""}`}
                                />
                                {formErrors.tanggal ? (
                                    <p className="text-sm text-red-600">{formErrors.tanggal}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <select
                                    value={form.jenis}
                                    onChange={(e) => setForm({ ...form, jenis: e.target.value as FormType["jenis"] })}
                                    className="w-full border p-2 rounded-md"
                                >
                                    <option value="modal">Modal</option>
                                    <option value="hutang">Hutang</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <input
                                    placeholder="Jumlah"
                                    inputMode="numeric"
                                    value={form.jumlah ? Number(form.jumlah).toLocaleString("id-ID") : ""}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setForm({ ...form, jumlah: rawValue });
                                        setFormErrors((prev) => ({ ...prev, jumlah: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.jumlah ? "border-red-500" : ""}`}
                                />
                                {formErrors.jumlah ? (
                                    <p className="text-sm text-red-600">{formErrors.jumlah}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <input
                                    placeholder="Keterangan"
                                    value={form.keterangan}
                                    onChange={(e) => {
                                        setForm({ ...form, keterangan: e.target.value });
                                        setFormErrors((prev) => ({ ...prev, keterangan: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.keterangan ? "border-red-500" : ""}`}
                                />
                                {formErrors.keterangan ? (
                                    <p className="text-sm text-red-600">{formErrors.keterangan}</p>
                                ) : null}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md">
                                    Batal
                                </button>

                                <button
                                    onClick={() => void handleSubmit()}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-700 text-white rounded-md disabled:opacity-50"
                                >
                                    {submitting ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </motion.div>
                    </Modal>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget ? (
                    <Modal onClose={() => setDeleteTarget(null)}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
                            <h2 className="text-lg font-semibold">Hapus Data?</h2>
                            <p className="text-sm text-gray-600">
                                Data pemasukan <span className="font-medium">{deleteTarget.keterangan}</span> akan dihapus.
                            </p>

                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                    Batal
                                </button>

                                <button
                                    onClick={() => void handleDelete()}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
                                >
                                    {submitting ? "Menghapus..." : "Hapus"}
                                </button>
                            </div>
                        </motion.div>
                    </Modal>
                ) : null}
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
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
           
        >
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </motion.div>
    );
}


