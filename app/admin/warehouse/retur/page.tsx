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

type GudangOption = {
    id: number;
    nama_gudang: string;
};

type StockItem = {
    id: number;
    gudang_id: number;
    nama_barang: string;
    qty: number | string;
    satuan_terkecil: string;
    harga_beli: number | string;
    gudang?: GudangOption | null;
};

type GroupedStockItem = {
    key: string;
    gudang_id: number;
    nama_barang: string;
    qty: number;
    satuan_terkecil: string;
    harga_beli: number;
    gudang?: GudangOption | null;
};

type ReturItem = {
    id: number;
    gudang_id: number;
    jenis_stok: "kering" | "basah";
    nama_barang: string;
    qty_retur: number | string;
    satuan_terkecil: string;
    harga_beli: number | string;
    alasan: string;
    gudang?: GudangOption | null;
};

type FormType = {
    gudang_id: number | null;
    jenis_stok: "" | "kering" | "basah";
    nama_barang: string;
    qty_retur: number;
    satuan_terkecil: string;
    harga_beli: number;
    alasan: string;
};

type FieldErrors = Partial<Record<keyof FormType | "stok_item", string>>;

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

function buildStockKey(item: {
    nama_barang: string;
    gudang_id: number;
    satuan_terkecil: string;
    harga_beli: number;
}) {
    return [
        item.nama_barang.trim().toLowerCase(),
        item.gudang_id,
        item.satuan_terkecil.trim().toLowerCase(),
        item.harga_beli,
    ].join("|");
}

function groupStockItems(items: StockItem[]): GroupedStockItem[] {
    const groupedMap = new Map<string, GroupedStockItem>();

    for (const item of items) {
        const normalizedItem = {
            nama_barang: item.nama_barang,
            gudang_id: item.gudang_id,
            satuan_terkecil: item.satuan_terkecil,
            harga_beli: Number(item.harga_beli),
        };

        const key = buildStockKey(normalizedItem);
        const existing = groupedMap.get(key);

        if (existing) {
            existing.qty += Number(item.qty);
            continue;
        }

        groupedMap.set(key, {
            key,
            gudang_id: item.gudang_id,
            nama_barang: item.nama_barang,
            qty: Number(item.qty),
            satuan_terkecil: item.satuan_terkecil,
            harga_beli: Number(item.harga_beli),
            gudang: item.gudang ?? null,
        });
    }

    return Array.from(groupedMap.values());
}

export default function Page() {
    const [data, setData] = useState<ReturItem[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [gudangData, setGudangData] = useState<GudangOption[]>([]);
    const [stokKeringData, setStokKeringData] = useState<StockItem[]>([]);
    const [stokBasahData, setStokBasahData] = useState<StockItem[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [form, setForm] = useState<FormType>({
        gudang_id: null,
        jenis_stok: "",
        nama_barang: "",
        qty_retur: 0,
        satuan_terkecil: "",
        harga_beli: 0,
        alasan: "",
    });

    const [qtyInput, setQtyInput] = useState("");
    const [selectedStockKey, setSelectedStockKey] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof ReturItem>("nama_barang");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const groupedStokKering = useMemo(() => groupStockItems(stokKeringData), [stokKeringData]);
    const groupedStokBasah = useMemo(() => groupStockItems(stokBasahData), [stokBasahData]);

    const availableStockOptions = useMemo(() => {
        const source = form.jenis_stok === "kering" ? groupedStokKering : groupedStokBasah;

        const options = source.filter((item) => !form.gudang_id || item.gudang_id === form.gudang_id);

        if (!editId || !form.gudang_id || !form.nama_barang || !form.satuan_terkecil) {
            return options;
        }

        const currentKey = buildStockKey({
            nama_barang: form.nama_barang,
            gudang_id: form.gudang_id,
            satuan_terkecil: form.satuan_terkecil,
            harga_beli: form.harga_beli,
        });

        const alreadyExists = options.some((item) => item.key === currentKey);
        if (alreadyExists) {
            return options;
        }

        return [
            ...options,
            {
                key: currentKey,
                gudang_id: form.gudang_id,
                nama_barang: form.nama_barang,
                qty: form.qty_retur,
                satuan_terkecil: form.satuan_terkecil,
                harga_beli: form.harga_beli,
                gudang: gudangData.find((item) => item.id === form.gudang_id) ?? null,
            },
        ];
    }, [
        editId,
        form.gudang_id,
        form.harga_beli,
        form.jenis_stok,
        form.nama_barang,
        form.qty_retur,
        form.satuan_terkecil,
        groupedStokBasah,
        groupedStokKering,
        gudangData,
    ]);

    const selectedStock = useMemo(
        () => availableStockOptions.find((item) => item.key === selectedStockKey) ?? null,
        [availableStockOptions, selectedStockKey]
    );

    const formatRupiah = (value: number | string) => {
        const number = Number(value) || 0;
        return number.toLocaleString("id-ID");
    };

    const clearFieldError = (field: keyof FieldErrors) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setErrorMessage("");
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<ReturItem>>("/retur-rusak", {
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

    const fetchFormOptions = async () => {
        if (loadingOptions) return;
        if (gudangData.length > 0 && stokKeringData.length > 0 && stokBasahData.length > 0) return;

        try {
            setLoadingOptions(true);
            const [gudangRes, stokKeringRes, stokBasahRes] = await Promise.all([
                api.get<ApiListResponse<GudangOption>>("/gudang", { params: { per_page: 100 } }),
                api.get<ApiListResponse<StockItem>>("/stok-kering", { params: { per_page: 100 } }),
                api.get<ApiListResponse<StockItem>>("/stok-basah", { params: { per_page: 100 } }),
            ]);

            setGudangData(gudangRes.data.data ?? []);
            setStokKeringData(stokKeringRes.data.data ?? []);
            setStokBasahData(stokBasahRes.data.data ?? []);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoadingOptions(false);
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

    const handleSort = (field: keyof ReturItem) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    };

    const resetForm = () => {
        setForm({
            gudang_id: null,
            jenis_stok: "",
            nama_barang: "",
            qty_retur: 0,
            satuan_terkecil: "",
            harga_beli: 0,
            alasan: "",
        });
        setQtyInput("");
        setSelectedStockKey("");
        setFieldErrors({});
        setErrorMessage("");
        setEditId(null);
        setOpenForm(false);
    };

    const openCreateForm = () => {
        resetForm();
        setSuccessMessage("");
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.jenis_stok) nextFieldErrors.jenis_stok = "Jenis stok wajib dipilih.";
        if (!form.gudang_id) nextFieldErrors.gudang_id = "Gudang wajib dipilih.";
        if (!selectedStockKey) nextFieldErrors.stok_item = "Barang stok wajib dipilih.";
        if (form.qty_retur <= 0) {
            nextFieldErrors.qty_retur = "Qty retur harus lebih dari 0.";
        } else if (selectedStock && form.qty_retur > selectedStock.qty) {
            nextFieldErrors.qty_retur = `Qty retur melebihi stok tersedia (${selectedStock.qty}).`;
        }
        if (!form.alasan.trim()) nextFieldErrors.alasan = "Alasan retur wajib diisi.";

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
                await api.put(`/retur-rusak/${editId}`, form);
                setSuccessMessage("Data retur/rusak berhasil diperbarui.");
            } else {
                await api.post("/retur-rusak", form);
                setSuccessMessage("Data retur/rusak berhasil ditambahkan.");
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
                            mappedErrors[key as keyof FieldErrors] = firstMessage;
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

    const handleEdit = (item: ReturItem) => {
        const stockKey = buildStockKey({
            nama_barang: item.nama_barang,
            gudang_id: item.gudang_id,
            satuan_terkecil: item.satuan_terkecil,
            harga_beli: Number(item.harga_beli),
        });

        setForm({
            gudang_id: item.gudang_id,
            jenis_stok: item.jenis_stok,
            nama_barang: item.nama_barang,
            qty_retur: Number(item.qty_retur),
            satuan_terkecil: item.satuan_terkecil,
            harga_beli: Number(item.harga_beli),
            alasan: item.alasan,
        });
        setQtyInput(String(Number(item.qty_retur)));
        setSelectedStockKey(stockKey);
        setFieldErrors({});
        setErrorMessage("");
        setEditId(item.id);
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/retur-rusak/${deleteId}`);
            setDeleteId(null);
            setErrorMessage("");
            setSuccessMessage("Data retur/rusak berhasil dihapus.");

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
    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Data Retur Barang</h1>
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
                    placeholder="Cari barang, alasan, atau gudang..."
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
                                <button onClick={() => handleSort("id" as any)} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("nama_barang")} className="flex items-center gap-2">
                                    Nama Barang <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("gudang_id")} className="flex items-center gap-2">
                                    Gudang <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("jenis_stok")} className="flex items-center gap-2">
                                    Jenis Stok <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("qty_retur")} className="flex items-center gap-2">
                                    Qty Retur <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("satuan_terkecil")} className="flex items-center gap-2">
                                    Satuan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("harga_beli")} className="flex items-center gap-2">
                                    Harga Beli <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("alasan")} className="flex items-center gap-2">
                                    Alasan <ArrowUpDown size={14} />
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

                                <td className="p-3">{item.nama_barang}</td>
                                <td className="p-3">{item.gudang?.nama_gudang ?? "-"}</td>
                                <td className="p-3 capitalize">{item.jenis_stok}</td>
                                <td className="p-3">{Number(item.qty_retur)}</td>
                                <td className="p-3">{item.satuan_terkecil}</td>
                                <td className="p-3">Rp {formatRupiah(item.harga_beli)}</td>
                                <td className="p-3">{item.alasan}</td>

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
                            {loadingOptions ? (
                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                    Memuat opsi gudang dan stok...
                                </div>
                            ) : null}

                            <select
                                value={form.jenis_stok}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        jenis_stok: e.target.value as FormType["jenis_stok"],
                                        nama_barang: "",
                                        qty_retur: 0,
                                        satuan_terkecil: "",
                                        harga_beli: 0,
                                    });
                                    setQtyInput("");
                                    setSelectedStockKey("");
                                    clearFieldError("jenis_stok");
                                    clearFieldError("stok_item");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.jenis_stok ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Jenis Stok</option>
                                <option value="kering">Kering</option>
                                <option value="basah">Basah</option>
                            </select>
                            {fieldErrors.jenis_stok ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.jenis_stok}</p> : null}

                            <select
                                value={form.gudang_id ?? ""}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        gudang_id: e.target.value ? Number(e.target.value) : null,
                                        nama_barang: "",
                                        qty_retur: 0,
                                        satuan_terkecil: "",
                                        harga_beli: 0,
                                    });
                                    setQtyInput("");
                                    setSelectedStockKey("");
                                    clearFieldError("gudang_id");
                                    clearFieldError("stok_item");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.gudang_id ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Gudang</option>
                                {gudangData.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama_gudang}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.gudang_id ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.gudang_id}</p> : null}

                            <select
                                value={selectedStockKey}
                                onChange={(e) => {
                                    const option = availableStockOptions.find((item) => item.key === e.target.value);
                                    setSelectedStockKey(e.target.value);

                                    if (option) {
                                        setForm((prev) => ({
                                            ...prev,
                                            nama_barang: option.nama_barang,
                                            qty_retur: 0,
                                            satuan_terkecil: option.satuan_terkecil,
                                            harga_beli: option.harga_beli,
                                        }));
                                        setQtyInput("");
                                    }

                                    clearFieldError("stok_item");
                                    clearFieldError("qty_retur");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.stok_item ? "border-red-500 focus:outline-red-500" : ""}`}
                                disabled={!form.jenis_stok || !form.gudang_id}
                            >
                                <option value="">Pilih Barang Stok</option>
                                {availableStockOptions.map((item) => (
                                    <option key={item.key} value={item.key}>
                                        {item.nama_barang} - {item.satuan_terkecil} - Rp {formatRupiah(item.harga_beli)} - stok {item.qty}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.stok_item ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.stok_item}</p>
                            ) : (
                                <p className="text-xs text-gray-500 -mt-2">
                                    Pilih barang dari stok yang tersedia pada gudang dan jenis stok tersebut.
                                </p>
                            )}

                            <input
                                placeholder="Qty Retur"
                                value={qtyInput}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^\d.]/g, "");
                                    setQtyInput(raw);
                                    setForm({ ...form, qty_retur: Number(raw || 0) });
                                    clearFieldError("qty_retur");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.qty_retur ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.qty_retur ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.qty_retur}</p>
                            ) : selectedStock ? (
                                <p className="text-xs text-gray-500 -mt-2">Stok tersedia: {selectedStock.qty}</p>
                            ) : null}

                            <input
                                value={form.satuan_terkecil}
                                readOnly
                                placeholder="Satuan"
                                className="w-full border p-2 rounded-md bg-slate-50 text-slate-700"
                            />

                            <input
                                value={form.harga_beli ? `Rp ${formatRupiah(form.harga_beli)}` : ""}
                                readOnly
                                placeholder="Harga Beli"
                                className="w-full border p-2 rounded-md bg-slate-50 text-slate-700"
                            />

                            <input
                                placeholder="Alasan Retur"
                                value={form.alasan}
                                onChange={(e) => {
                                    setForm({ ...form, alasan: e.target.value });
                                    clearFieldError("alasan");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.alasan ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.alasan ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.alasan}</p> : null}

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
                            <h2 className="text-lg font-semibold">Hapus Data?</h2>

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


