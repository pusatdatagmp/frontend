"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { extractErrorMessage, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";
import axios from "axios";

type OrderPenawaranSource = {
    id: number;
    tanggal_dikirim: string | null;
    nama_pembeli: string;
    keterangan: string | null;
};

type Penjualan = {
    id: number;
    order_penawaran_id: number | null;
    kode_penjualan: string;
    tanggal: string;
    total_harga: string | number;
    status: "draft" | "selesai" | "batal";
    order_penawaran?: OrderPenawaranSource | null;
};
type SortField = keyof Penjualan | "pembeli";

type FormType = {
    tanggal: string;
    status: "draft" | "selesai" | "batal";
};

type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    tanggal: "",
    status: "draft",
};

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

const formatRupiah = (value: string | number) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat("id-ID").format(number);
};

const formatTanggal = (value: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function Page() {
    const router = useRouter();

    const [data, setData] = useState<Penjualan[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [form, setForm] = useState<FormType>(initialForm);
    const [editTarget, setEditTarget] = useState<Penjualan | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Penjualan | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("tanggal");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = async () => {
        try {
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Penjualan>>("/penjualan", {
                params: {
                    search: search || undefined,
                    sort_field: sortField === "pembeli" ? "tanggal" : sortField,
                    sort_order: sortOrder,
                    page: currentPage,
                    per_page: perPage,
                },
            });

            setData(response.data.data ?? []);
            setMeta(response.data.meta ?? initialMeta);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
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

    const resetForm = () => {
        setForm(initialForm);
        setEditTarget(null);
        setFieldErrors({});
        setErrorMessage("");
        setOpenForm(false);
    };

    const openCreateForm = () => {
        setForm(initialForm);
        setEditTarget(null);
        setFieldErrors({});
        setErrorMessage("");
        setSuccessMessage("");
        setOpenForm(true);
    };

    const clearFieldError = (field: keyof FormType) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setErrorMessage("");
    };

    const handleEdit = (item: Penjualan) => {
        setEditTarget(item);
        setForm({
            tanggal: item.tanggal ?? "",
            status: item.status,
        });
        setFieldErrors({});
        setErrorMessage("");
        setOpenForm(true);
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};
        if (!form.tanggal) nextFieldErrors.tanggal = "Tanggal wajib diisi.";

        if (!form.status) nextFieldErrors.status = "Status wajib dipilih.";

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setSuccessMessage("");
            return;
        }

        try {
            setSubmitting(true);
            setFieldErrors({});
            setErrorMessage("");
            setSuccessMessage("");

            if (editTarget) {
                await api.put(`/penjualan/${editTarget.id}`, {
                    order_penawaran_id: editTarget.order_penawaran_id,
                    kode_penjualan: editTarget.kode_penjualan,
                    tanggal: form.tanggal,
                    status: form.status,
                });
                setSuccessMessage("Penjualan berhasil diperbarui.");
            } else {
                await api.post("/penjualan", {
                    tanggal: form.tanggal,
                });
                setSuccessMessage("Penjualan berhasil disinkronkan dari order penawaran pada tanggal tersebut.");
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
                        if (typeof firstMessage === "string" && key in initialForm) {
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
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.delete(`/penjualan/${deleteTarget.id}`);
            setDeleteTarget(null);
            setErrorMessage("");
            setSuccessMessage("Penjualan berhasil dihapus.");
            if (data.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await fetchData();
            }
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
            setSuccessMessage("");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    };

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);
    const sortedData = useMemo(() => {
        if (sortField !== "pembeli") return data;
        const rows = [...data];
        rows.sort((a, b) => {
            const aText = (a.order_penawaran?.nama_pembeli ?? "").toLowerCase();
            const bText = (b.order_penawaran?.nama_pembeli ?? "").toLowerCase();
            return sortOrder === "asc" ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });
        return rows;
    }, [data, sortField, sortOrder]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">List Penjualan</h1>
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
                    placeholder="Cari kode / status / pembeli..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 bg-white shadow"
                />

                <button
                    onClick={openCreateForm}
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
                                <button onClick={() => handleSort("id")} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("kode_penjualan")} className="flex gap-2">
                                    Kode Penjualan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal")} className="flex gap-2">
                                    Tanggal <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("pembeli")} className="flex items-center gap-2">
                                    Pembeli <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("total_harga")} className="flex gap-2">
                                    Total Harga <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("status")} className="flex gap-2">
                                    Status <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            sortedData.map((item, index) => (
                                <tr key={item.id} className="border-t border-primary/20 hover:bg-white/50">
                                    <td className="p-3 text-center">
                                        {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3">{item.kode_penjualan}</td>
                                    <td className="p-3">{formatTanggal(item.tanggal)}</td>
                                    <td className="p-3">{item.order_penawaran?.nama_pembeli ?? "-"}</td>
                                    <td className="p-3">Rp {formatRupiah(item.total_harga)}</td>
                                    <td className="p-3 capitalize">{item.status}</td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/transaksi-penjualan/penjualan/detail/${item.id}`)}
                                            className="p-2 bg-green-500/30 text-green-700 rounded-md"
                                        >
                                            <Eye size={14} />
                                        </button>

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
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    Belum ada data penjualan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                        className={`px-3 py-1 border rounded-md ${currentPage === i + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    disabled={currentPage === totalPages || totalPages === 0}
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
                                {editTarget ? "Edit Data" : "Tambah Data"}
                            </h2>

                            {errorMessage ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errorMessage}
                                </div>
                            ) : null}

                            {editTarget ? (
                                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    Penjualan ini terhubung ke order penawaran. Kode penjualan dan total harga mengikuti order sumber.
                                </div>
                            ) : (
                                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    Saat disimpan, semua order penawaran dengan tanggal kirim yang sama akan ikut dibuat menjadi data penjualan.
                                </div>
                            )}

                            <input
                                type="date"
                                value={form.tanggal}
                                onChange={(e) => {
                                    setForm({ ...form, tanggal: e.target.value });
                                    clearFieldError("tanggal");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.tanggal ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.tanggal ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.tanggal}</p> : null}

                            <select
                                value={form.status}
                                onChange={(e) => {
                                    setForm({ ...form, status: e.target.value as FormType["status"] });
                                    clearFieldError("status");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.status ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="draft">Draft</option>
                                <option value="selesai">Selesai</option>
                                <option value="batal">Batal</option>
                            </select>
                            {fieldErrors.status ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.status}</p> : null}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-gray-200 rounded-md"
                                >
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
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <Modal onClose={() => setDeleteTarget(null)}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
                            <h2 className="text-lg font-semibold">Hapus Data?</h2>
                            <p className="text-sm text-gray-600">
                                Penjualan <strong>{deleteTarget.kode_penjualan}</strong> akan dihapus.
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
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </motion.div>
    );
}


