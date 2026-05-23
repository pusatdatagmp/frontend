"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";
import { extractErrorMessage, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";

type Pengeluaran = {
    id: number;
    nama_operasional: string;
    tanggal_keluar: string;
    qty: number | string;
    satuan: string;
    harga_satuan: number | string;
};
type SortField = keyof Pengeluaran | "total";

type FormType = {
    nama_operasional: string;
    tanggal_keluar: string;
    qty: string;
    satuan: string;
    harga_satuan: string;
};

type FormErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    nama_operasional: "",
    tanggal_keluar: "",
    qty: "",
    satuan: "",
    harga_satuan: "",
};

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

const operasionalOptions = [
    "Bebas Transportasi",
    "Bebas Admin Bank",
    "Bebas Gaji",
    "Bebas Cashback",
    "Bebas Angkut Pembelian",
    "Bebas Kerugian Persediaan",
    "Bebas Perlengkapan Kantor",
    "Bebas Belanja",
    "Bebas Lain-Lain",
];

const formatRupiah = (value: number | string) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function Page() {
    const [data, setData] = useState<Pengeluaran[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<FormType>(initialForm);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Pengeluaran | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("tanggal_keluar");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Pengeluaran>>("/pengeluaran", {
                params: {
                    search: search || undefined,
                    sort_field: sortField === "total" ? "harga_satuan" : sortField,
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

        if (!form.nama_operasional) nextErrors.nama_operasional = "Jenis operasional wajib dipilih.";
        if (!form.tanggal_keluar) nextErrors.tanggal_keluar = "Tanggal wajib diisi.";
        if (!form.qty || Number(form.qty) <= 0) nextErrors.qty = "Qty harus lebih besar dari 0.";
        if (!form.satuan.trim()) nextErrors.satuan = "Satuan wajib diisi.";
        if (!form.harga_satuan || Number(form.harga_satuan) <= 0) nextErrors.harga_satuan = "Harga harus lebih besar dari 0.";

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
                nama_operasional: form.nama_operasional,
                tanggal_keluar: form.tanggal_keluar,
                qty: Number(form.qty),
                satuan: form.satuan.trim(),
                harga_satuan: Number(form.harga_satuan),
            };

            if (editId) {
                await api.put(`/pengeluaran/${editId}`, payload);
                setSuccessMessage("Data pengeluaran berhasil diperbarui.");
            } else {
                await api.post("/pengeluaran", payload);
                setSuccessMessage("Data pengeluaran berhasil ditambahkan.");
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
                            (key === "nama_operasional" ||
                                key === "tanggal_keluar" ||
                                key === "qty" ||
                                key === "satuan" ||
                                key === "harga_satuan")
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

    const handleEdit = (item: Pengeluaran) => {
        setForm({
            nama_operasional: item.nama_operasional,
            tanggal_keluar: item.tanggal_keluar,
            qty: String(Number(item.qty)),
            satuan: item.satuan,
            harga_satuan: String(Number(item.harga_satuan)),
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
            await api.delete(`/pengeluaran/${deleteTarget.id}`);
            setSuccessMessage("Data pengeluaran berhasil dihapus.");
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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder(field === "tanggal_keluar" ? "desc" : "asc");
    };

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);
    const sortedData = useMemo(() => {
        if (sortField !== "total") return data;
        const rows = [...data];
        rows.sort((a, b) => {
            const aTotal = Number(a.qty) * Number(a.harga_satuan);
            const bTotal = Number(b.qty) * Number(b.harga_satuan);
            return sortOrder === "asc" ? aTotal - bTotal : bTotal - aTotal;
        });
        return rows;
    }, [data, sortField, sortOrder]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Pengeluaran</h1>
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
                    placeholder="Cari barang..."
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
                    className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition"
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
                                <button onClick={() => handleSort("id")} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_operasional")} className="flex items-center gap-2">
                                    Jenis Operasional <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal_keluar")} className="flex items-center gap-2">
                                    Tanggal <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("qty")} className="flex items-center gap-2">
                                    Qty <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("satuan")} className="flex items-center gap-2">
                                    Satuan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("harga_satuan")} className="flex items-center gap-2">
                                    Harga <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("total")} className="flex items-center gap-2">
                                    Total <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Belum ada data pengeluaran.
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item, index) => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-3 text-center">
                                        {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3">{item.nama_operasional}</td>
                                    <td className="p-3">{item.tanggal_keluar}</td>
                                    <td className="p-3">{Number(item.qty)}</td>
                                    <td className="p-3">{item.satuan}</td>
                                    <td className="p-3">{formatRupiah(item.harga_satuan)}</td>
                                    <td className="p-3">{formatRupiah(Number(item.qty) * Number(item.harga_satuan))}</td>
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
                                <select
                                    value={form.nama_operasional}
                                    onChange={(e) => {
                                        setForm({ ...form, nama_operasional: e.target.value });
                                        setFormErrors((prev) => ({ ...prev, nama_operasional: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.nama_operasional ? "border-red-500" : ""}`}
                                >
                                    <option value="">Pilih Jenis Operasional</option>
                                    {operasionalOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.nama_operasional ? (
                                    <p className="text-sm text-red-600">{formErrors.nama_operasional}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <input
                                    type="date"
                                    value={form.tanggal_keluar}
                                    onChange={(e) => {
                                        setForm({ ...form, tanggal_keluar: e.target.value });
                                        setFormErrors((prev) => ({ ...prev, tanggal_keluar: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.tanggal_keluar ? "border-red-500" : ""}`}
                                />
                                {formErrors.tanggal_keluar ? (
                                    <p className="text-sm text-red-600">{formErrors.tanggal_keluar}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <input
                                    placeholder="Qty"
                                    inputMode="decimal"
                                    value={form.qty}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                                        setForm({ ...form, qty: raw });
                                        setFormErrors((prev) => ({ ...prev, qty: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.qty ? "border-red-500" : ""}`}
                                />
                                {formErrors.qty ? (
                                    <p className="text-sm text-red-600">{formErrors.qty}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <input
                                    placeholder="Satuan"
                                    value={form.satuan}
                                    onChange={(e) => {
                                        setForm({ ...form, satuan: e.target.value });
                                        setFormErrors((prev) => ({ ...prev, satuan: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.satuan ? "border-red-500" : ""}`}
                                />
                                {formErrors.satuan ? (
                                    <p className="text-sm text-red-600">{formErrors.satuan}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <input
                                    placeholder="Harga"
                                    inputMode="numeric"
                                    value={form.harga_satuan ? Number(form.harga_satuan).toLocaleString("id-ID") : ""}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        setForm({ ...form, harga_satuan: raw });
                                        setFormErrors((prev) => ({ ...prev, harga_satuan: "" }));
                                    }}
                                    className={`w-full border p-2 rounded-md ${formErrors.harga_satuan ? "border-red-500" : ""}`}
                                />
                                {formErrors.harga_satuan ? (
                                    <p className="text-sm text-red-600">{formErrors.harga_satuan}</p>
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
                                Data pengeluaran <span className="font-medium">{deleteTarget.nama_operasional}</span> akan dihapus.
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


