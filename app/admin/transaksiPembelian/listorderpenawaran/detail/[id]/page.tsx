"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import {
    ApiDetailResponse,
    ApiListResponse,
    KategoriOption,
    Meta,
    OrderPenawaran,
    OrderPenawaranItem,
    ProdukOption,
    extractErrorMessage,
    formatCurrency,
} from "@/lib/transaksiPembelian";

type FormType = {
    produk_id: number | "";
    kategori_id: number | "";
    nama_barang: string;
    qty: string;
    satuan: string;
    harga_satuan: string;
    keterangan: string;
};

type FieldErrors = Partial<Record<keyof FormType, string>>;

type SortField = "nama_barang" | "qty" | "satuan" | "harga_satuan";

const initialForm: FormType = {
    produk_id: "",
    kategori_id: "",
    nama_barang: "",
    qty: "",
    satuan: "",
    harga_satuan: "",
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

function formatQty(value: number | string): string {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return String(value);
    }

    return Number.isInteger(numericValue)
        ? numericValue.toLocaleString("id-ID")
        : numericValue.toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
}

export default function Page() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const orderId = Number(params.id);

    const [order, setOrder] = useState<OrderPenawaran | null>(null);
    const [items, setItems] = useState<OrderPenawaranItem[]>([]);
    const [produkOptions, setProdukOptions] = useState<ProdukOption[]>([]);
    const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [form, setForm] = useState<FormType>(initialForm);
    const [editTarget, setEditTarget] = useState<OrderPenawaranItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<OrderPenawaranItem | null>(null);
    const [openForm, setOpenForm] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("nama_barang");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [detailResponse, itemsResponse, produkResponse, kategoriResponse] =
                await Promise.all([
                    api.get<ApiDetailResponse<OrderPenawaran>>(`/order-penawaran/${orderId}`),
                    api.get<ApiListResponse<OrderPenawaranItem>>(`/order-penawaran/${orderId}/items`, {
                        params: {
                            search: search || undefined,
                            sort_field: sortField,
                            sort_order: sortOrder,
                            page: currentPage,
                            per_page: perPage,
                        },
                    }),
                    api.get<ApiListResponse<ProdukOption>>("/produk", {
                        params: { per_page: 100 },
                    }),
                    api.get<ApiListResponse<KategoriOption>>("/kategori", {
                        params: { per_page: 100 },
                    }),
                ]);

            setOrder(detailResponse.data.data);
            setItems(itemsResponse.data.data ?? []);
            setMeta(itemsResponse.data.meta ?? initialMeta);
            setProdukOptions(produkResponse.data.data ?? []);
            setKategoriOptions(kategoriResponse.data.data ?? []);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [currentPage, orderId, perPage, search, sortField, sortOrder]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        if (!Number.isNaN(orderId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void fetchData();
        }
    }, [fetchData, orderId]);

    function resetForm() {
        setForm(initialForm);
        setFieldErrors({});
        setEditTarget(null);
        setOpenForm(false);
    }

    function clearFieldError(field: keyof FormType) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setError("");
    }

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    }

    function handleProdukChange(value: string) {
        const produkId = Number(value);
        const selectedProduk = produkOptions.find((item) => item.id === produkId);
        const matchedKategori =
            kategoriOptions.find(
                (item) =>
                    item.nama_satuan.trim().toLowerCase() ===
                    (selectedProduk?.satuan ?? "").trim().toLowerCase()
            ) ?? null;

        setForm((prev) => ({
            ...prev,
            produk_id: Number.isNaN(produkId) ? "" : produkId,
            kategori_id: matchedKategori?.id ?? "",
            nama_barang: selectedProduk?.nama ?? "",
            satuan: selectedProduk?.satuan ?? "",
        }));
        clearFieldError("produk_id");
        clearFieldError("nama_barang");
        clearFieldError("kategori_id");
        clearFieldError("satuan");
    }

    function handleEdit(item: OrderPenawaranItem) {
        setEditTarget(item);
        setForm({
            produk_id: item.produk_id ?? "",
            kategori_id: item.kategori_id ?? "",
            nama_barang: item.nama_barang,
            qty: String(item.qty),
            satuan: item.satuan,
            harga_satuan: String(item.harga_satuan),
            keterangan: item.keterangan ?? "",
        });
        setFieldErrors({});
        setOpenForm(true);
    }

    function formatDate(value: string) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    async function handleSubmit() {
        const nextFieldErrors: FieldErrors = {};

        if (form.produk_id === "") nextFieldErrors.produk_id = "Nama barang wajib dipilih.";
        if (!form.nama_barang.trim()) nextFieldErrors.nama_barang = "Nama barang wajib diisi.";
        if (!form.qty.trim()) {
            nextFieldErrors.qty = "Qty wajib diisi.";
        } else if (Number(form.qty) <= 0) {
            nextFieldErrors.qty = "Qty harus lebih dari 0.";
        }
        if (!form.satuan.trim()) nextFieldErrors.satuan = "Satuan wajib diisi.";
        if (!form.harga_satuan.trim()) {
            nextFieldErrors.harga_satuan = "Harga penawaran wajib diisi.";
        } else if (Number(form.harga_satuan) < 0) {
            nextFieldErrors.harga_satuan = "Harga penawaran tidak boleh negatif.";
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setSuccess("");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");
            setFieldErrors({});

            const payload = {
                produk_id: form.produk_id === "" ? null : Number(form.produk_id),
                kategori_id: form.kategori_id === "" ? null : Number(form.kategori_id),
                supplier_id: null,
                nama_barang: form.nama_barang,
                qty: Number(form.qty),
                satuan: form.satuan,
                harga_satuan: Number(form.harga_satuan),
                keterangan: form.keterangan || null,
            };

            if (editTarget) {
                await api.put(
                    `/order-penawaran/${orderId}/items/${editTarget.id}`,
                    payload
                );
                setSuccess("Detail order penawaran berhasil diperbarui.");
            } else {
                await api.post(`/order-penawaran/${orderId}/items`, payload);
                setSuccess("Barang berhasil ditambahkan ke order penawaran.");
            }

            resetForm();
            await fetchData();
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            await api.delete(`/order-penawaran/${orderId}/items/${deleteTarget.id}`);
            setSuccess("Barang berhasil dihapus dari order penawaran.");
            setDeleteTarget(null);

            if (items.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await fetchData();
            }
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }
    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Detail Order #{orderId}</h1>
                    {order ? (
                        <p className="text-sm text-gray-600 mt-1">
                            {order.nama_pembeli} | {formatDate(order.tanggal_pesan)}
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-100 rounded-lg shadow"
                >
                    Kembali
                </button>
            </div>

            {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
                <input
                    placeholder="Cari barang atau keterangan..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 min-w-60 bg-white shadow"
                />

                <button
                    onClick={() => {
                        resetForm();
                        setOpenForm(true);
                    }}
                    className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg shadow-black/20 text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition cursor-pointer"
                >
                    <Plus size={16} />
                    Tambah Barang
                </button>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-white shadow-lg">
                        <tr>
                            <th className="p-3">
                                <button onClick={() => handleSort("id" as any)} className="flex items-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button
                                    onClick={() => handleSort("nama_barang")}
                                    className="flex items-center gap-2"
                                >
                                    Nama Barang <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button
                                    onClick={() => handleSort("qty")}
                                    className="flex items-center gap-2"
                                >
                                    Qty <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button
                                    onClick={() => handleSort("satuan")}
                                    className="flex items-center gap-2"
                                >
                                    Satuan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button
                                    onClick={() => handleSort("harga_satuan")}
                                    className="flex items-center gap-2"
                                >
                                    Harga Penawaran <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">Keterangan</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    Belum ada barang pada order ini.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-primary/20 hover:bg-white/50"
                                >
                                    <td className="p-3 text-center">{item.id}</td>
                                    <td className="p-3">{item.nama_barang}</td>
                                    <td className="p-3">{formatQty(item.qty)}</td>
                                    <td className="p-3">{item.satuan}</td>
                                    <td className="p-3">{formatCurrency(item.harga_satuan)}</td>
                                    <td className="p-3">{item.keterangan ?? "-"}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2 justify-center">
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
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-3 py-1 border rounded-md ${currentPage === index + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {index + 1}
                    </button>
                ))}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            <AnimatePresence>
                {openForm ? (
                    <Modal onClose={resetForm}>
                        <motion.div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    {editTarget ? "Edit Barang" : "Tambah Barang"}
                                </h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Pilih Nama Barang</label>
                                <select
                                    value={form.produk_id}
                                    onChange={(e) => handleProdukChange(e.target.value)}
                                    className={`w-full rounded-xl border px-3 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.produk_id ? "border-red-500" : "border-slate-200"}`}
                                >
                                    <option value="">Pilih Nama Barang</option>
                                    {produkOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nama}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.produk_id ? (
                                    <p className="text-xs text-red-600">{fieldErrors.produk_id}</p>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.qty}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, qty: e.target.value }));
                                            clearFieldError("qty");
                                        }}
                                        className={`w-full rounded-xl border px-3 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.qty ? "border-red-500" : "border-slate-200"}`}
                                        placeholder="Masukkan qty"
                                    />
                                    {fieldErrors.qty ? (
                                        <p className="text-xs text-red-600">{fieldErrors.qty}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Harga Penawaran</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.harga_satuan}
                                        onChange={(e) => {
                                            setForm((prev) => ({
                                                ...prev,
                                                harga_satuan: e.target.value,
                                            }));
                                            clearFieldError("harga_satuan");
                                        }}
                                        className={`w-full rounded-xl border px-3 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.harga_satuan ? "border-red-500" : "border-slate-200"}`}
                                        placeholder="Masukkan harga penawaran"
                                    />
                                    {fieldErrors.harga_satuan ? (
                                        <p className="text-xs text-red-600">{fieldErrors.harga_satuan}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Satuan</label>
                                    <input
                                        value={form.satuan}
                                        readOnly
                                        className={`w-full rounded-xl border px-3 py-3 text-sm text-slate-700 shadow-sm ${fieldErrors.satuan ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                                        placeholder="Satuan"
                                    />
                                    {fieldErrors.satuan ? (
                                        <p className="text-xs text-red-600">{fieldErrors.satuan}</p>
                                    ) : (
                                        <p className="text-xs text-slate-500">Satuan otomatis mengikuti barang yang dipilih.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Estimasi Total</label>
                                    <div className="flex min-h-[74px] items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <p className="text-xs font-medium text-emerald-700">Preview</p>
                                        <p className="text-lg font-semibold text-emerald-800">
                                            {formatCurrency(Number(form.qty || 0) * Number(form.harga_satuan || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Keterangan</label>
                                <input
                                    value={form.keterangan}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, keterangan: e.target.value }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Tambahkan keterangan bila diperlukan"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={resetForm}
                                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => void handleSubmit()}
                                    disabled={submitting}
                                    className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
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
                            <h2 className="text-lg font-semibold">Hapus Barang?</h2>
                            <p className="text-sm text-gray-600">
                                Barang <strong>{deleteTarget.nama_barang}</strong> akan dihapus dari order ini.
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


