"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { extractErrorMessage, formatCurrency, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";
import axios from "axios";

type GudangOption = {
    id: number;
    nama_gudang: string;
};

type PenjualanSource = {
    id: number;
    tanggal_dikirim: string | null;
    nama_pembeli: string;
    keterangan: string | null;
};

type PenjualanDetail = {
    id: number;
    order_penawaran_id: number | null;
    kode_penjualan: string;
    tanggal: string;
    status: "draft" | "selesai" | "batal";
    total_harga: string | number;
    orderPenawaran?: PenjualanSource | null;
};

type PenjualanItem = {
    id: number;
    penjualan_id: number | null;
    order_penawaran_item_id: number;
    produk_id: number | null;
    gudang_id: number | null;
    gudang?: GudangOption | null;
    nama_barang: string;
    qty: number | string;
    satuan: string;
    harga_satuan: number | string;
    total_harga: number | string;
    keterangan?: string | null;
    stok_tersedia: number | string;
    status_stok: "berhasil" | "pending";
};

type OpsiBarang = {
    order_penawaran_item_id: number;
    produk_id: number | null;
    nama_barang: string;
    harga_satuan: number | string;
    satuan: string;
};

type FormType = {
    order_penawaran_item_id: number | null;
    gudang_id: number | null;
    qty: string;
};

type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    order_penawaran_item_id: null,
    gudang_id: null,
    qty: "",
};

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
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
    const params = useParams<{ id: string }>();
    const penjualanId = Number(params.id);

    const [detail, setDetail] = useState<PenjualanDetail | null>(null);
    const [items, setItems] = useState<PenjualanItem[]>([]);
    const [opsiBarang, setOpsiBarang] = useState<OpsiBarang[]>([]);
    const [gudangOptions, setGudangOptions] = useState<GudangOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [form, setForm] = useState<FormType>(initialForm);
    const [editTarget, setEditTarget] = useState<PenjualanItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PenjualanItem | null>(null);
    const [openForm, setOpenForm] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof PenjualanItem>("nama_barang");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const [detailResponse, itemsResponse] = await Promise.all([
                api.get(`/penjualan/${penjualanId}`),
                api.get<ApiListResponse<PenjualanItem>>(`/penjualan/${penjualanId}/items`, {
                    params: {
                        search: search || undefined,
                        sort_field: sortField,
                        sort_order: sortOrder,
                        page: currentPage,
                        per_page: perPage,
                    },
                }),
            ]);

            setDetail(detailResponse.data.data);
            setItems(itemsResponse.data.data ?? []);
            setMeta(itemsResponse.data.meta ?? initialMeta);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [currentPage, penjualanId, perPage, search, sortField, sortOrder]);

    const fetchFormOptions = useCallback(async () => {
        if (loadingOptions) return;
        if (opsiBarang.length > 0 && gudangOptions.length > 0) return;

        try {
            setLoadingOptions(true);
            const [opsiResponse, gudangResponse] = await Promise.all([
                api.get(`/penjualan/${penjualanId}/opsi-barang`),
                api.get("/gudang", { params: { per_page: 100 } }),
            ]);

            setOpsiBarang(opsiResponse.data.data ?? []);
            setGudangOptions(gudangResponse.data.data ?? []);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoadingOptions(false);
        }
    }, [gudangOptions.length, loadingOptions, opsiBarang.length, penjualanId]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        if (!Number.isNaN(penjualanId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void fetchData();
        }
    }, [fetchData, penjualanId]);

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
        void fetchFormOptions();
    };

    const clearFieldError = (field: keyof FormType) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setErrorMessage("");
    };

    const handleEdit = (item: PenjualanItem) => {
        if (item.penjualan_id === null) {
            setErrorMessage("Item bawaan order belum menjadi item penjualan. Tambahkan lewat form terlebih dahulu.");
            return;
        }

        setEditTarget(item);
        setForm({
            order_penawaran_item_id: item.order_penawaran_item_id,
            gudang_id: item.gudang_id,
            qty: String(Number(item.qty)),
        });
        setFieldErrors({});
        setErrorMessage("");
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.order_penawaran_item_id) nextFieldErrors.order_penawaran_item_id = "Barang wajib dipilih.";
        if (!form.gudang_id) nextFieldErrors.gudang_id = "Gudang wajib dipilih.";
        if (!form.qty.trim()) {
            nextFieldErrors.qty = "Qty wajib diisi.";
        } else if (Number(form.qty) <= 0) {
            nextFieldErrors.qty = "Qty harus lebih dari 0.";
        }

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

            const payload = {
                order_penawaran_item_id: form.order_penawaran_item_id,
                gudang_id: form.gudang_id,
                qty: Number(form.qty),
            };

            if (editTarget) {
                await api.put(`/penjualan/${penjualanId}/items/${editTarget.id}`, payload);
                setSuccessMessage("Item penjualan berhasil diperbarui.");
            } else {
                await api.post(`/penjualan/${penjualanId}/items`, payload);
                setSuccessMessage("Item penjualan berhasil ditambahkan.");
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
            await api.delete(`/penjualan/${penjualanId}/items/${deleteTarget.id}`);
            setDeleteTarget(null);
            setErrorMessage("");
            setSuccessMessage("Item penjualan berhasil dihapus.");
            if (items.length === 1 && currentPage > 1) {
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

    const selectedBarang = useMemo(
        () => opsiBarang.find((item) => item.order_penawaran_item_id === form.order_penawaran_item_id) ?? null,
        [form.order_penawaran_item_id, opsiBarang]
    );

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    const handleSort = (field: keyof PenjualanItem) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Detail Penjualan #{penjualanId}</h1>
                    {detail ? (
                        <p className="text-sm text-gray-600 mt-1">
                            {detail.kode_penjualan} | {detail.orderPenawaran?.nama_pembeli ?? "Manual"} | {formatTanggal(detail.tanggal)}
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white rounded-md"
                >
                    Kembali
                </button>
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

            <div className="flex justify-between">
                <input
                    placeholder="Cari barang..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 bg-white shadow"
                />

                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary text-white px-4 py-2 rounded-lg"
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
                                <button onClick={() => handleSort("id" as any)} className="flex items-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_barang")} className="flex items-center gap-2">
                                    Barang <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-left">Gudang</th>
                            <th className="p-3">
                                <button onClick={() => handleSort("qty")} className="flex items-center gap-2">
                                    Qty <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-left">Satuan</th>
                            <th className="p-3 text-left">Stok</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3">
                                <button onClick={() => handleSort("harga_satuan")} className="flex items-center gap-2">
                                    Harga <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-left">Total</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={10} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : items.length > 0 ? (
                            items.map((item, index) => (
                                <tr key={`${item.penjualan_id ?? "source"}-${item.id}`} className="border-t border-primary/20 hover:bg-white/50">
                                    <td className="p-3 text-center">{sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}</td>
                                    <td className="p-3">{item.nama_barang}</td>
                                    <td className="p-3">{item.gudang?.nama_gudang ?? "-"}</td>
                                    <td className="p-3">{Number(item.qty)}</td>
                                    <td className="p-3">{item.satuan}</td>
                                    <td className="p-3">{Number(item.stok_tersedia)}</td>
                                    <td className="p-3">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                item.status_stok === "berhasil"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}
                                        >
                                            {item.status_stok === "berhasil" ? "Berhasil" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="p-3"> {formatCurrency(Number(item.harga_satuan))}</td>
                                    <td className="p-3"> {formatCurrency(Number(item.total_harga))}</td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 bg-blue-500/30 text-blue-700 rounded"
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (item.penjualan_id === null) {
                                                    setErrorMessage("Item bawaan order belum menjadi item penjualan, jadi belum bisa dihapus.");
                                                    return;
                                                }
                                                setDeleteTarget(item);
                                            }}
                                            className="p-2 bg-red-500/30 text-red-700 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="p-6 text-center text-gray-500">
                                    Belum ada item penjualan.
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
                            {loadingOptions ? (
                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                    Memuat opsi barang dan gudang...
                                </div>
                            ) : null}

                            <select
                                value={form.order_penawaran_item_id ?? ""}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        order_penawaran_item_id: e.target.value ? Number(e.target.value) : null,
                                    });
                                    clearFieldError("order_penawaran_item_id");
                                }}
                                disabled={editTarget !== null}
                                className={`w-full border p-2 rounded-md ${fieldErrors.order_penawaran_item_id ? "border-red-500 focus:outline-red-500" : ""} ${editTarget ? "bg-slate-50 text-slate-500" : ""}`}
                            >
                                <option value="">Pilih Barang</option>
                                {opsiBarang.map((item) => (
                                    <option key={item.order_penawaran_item_id} value={item.order_penawaran_item_id}>
                                        {item.nama_barang} - {item.satuan} - Rp {formatCurrency(Number(item.harga_satuan))}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.order_penawaran_item_id ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.order_penawaran_item_id}</p>
                            ) : null}

                            {selectedBarang ? (
                                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    Harga sumber: <span className="font-semibold">{formatCurrency(Number(selectedBarang.harga_satuan))}</span>
                                    {" | "}
                                    Satuan: <span className="font-semibold">{selectedBarang.satuan}</span>
                                </div>
                            ) : null}

                            <select
                                value={form.gudang_id ?? ""}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        gudang_id: e.target.value ? Number(e.target.value) : null,
                                    });
                                    clearFieldError("gudang_id");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.gudang_id ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Gudang</option>
                                {gudangOptions.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama_gudang}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.gudang_id ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.gudang_id}</p> : null}

                            <input
                                type="number"
                                min="1"
                                placeholder="Masukkan Qty"
                                value={form.qty}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        qty: e.target.value,
                                    });
                                    clearFieldError("qty");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.qty ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.qty ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.qty}</p> : null}

                            <div className="text-right font-semibold">
                                Total:{" "}
                                {selectedBarang
                                    ? `Rp ${formatCurrency(Number(form.qty || 0) * Number(selectedBarang.harga_satuan))}`
                                    : "Rp 0"}
                            </div>

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


