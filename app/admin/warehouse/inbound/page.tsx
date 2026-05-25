"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
    extractErrorMessage,
    type ApiListResponse,
    type Meta,
} from "@/lib/transaksiPembelian";
import axios from "axios";
import { getSortClass } from "@/lib/getSortClass";

type GudangOption = {
    id: number;
    nama_gudang: string;
};

type SupplierOption = {
    id: number;
    nama: string;
};

type ProdukOption = {
    id: number;
    nama: string;
    satuan: string;
};

type Product = {
    id: number;
    gudang_id: number;
    nama_barang: string;
    kategori: "basah" | "kering";
    tanggal_masuk: string;
    qty: number | string;
    satuan: string;
    harga_satuan: number | string;
    total_harga: number | string;
    nama_supplier: string;
    gudang?: GudangOption | null;
};

type FormType = {
    gudang_id: number | null;
    nama_barang: string;
    kategori: "" | "basah" | "kering";
    tanggal_masuk: string;
    qty: number;
    satuan: string;
    harga_satuan: number;
    nama_supplier: string;
};

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
    const [supplierData, setSupplierData] = useState<SupplierOption[]>([]);
    const [gudangData, setGudangData] = useState<GudangOption[]>([]);
    const [produkData, setProdukData] = useState<ProdukOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [form, setForm] = useState<FormType>({
        gudang_id: null,
        nama_barang: "",
        kategori: "",
        tanggal_masuk: "",
        qty: 0,
        satuan: "",
        harga_satuan: 0,
        nama_supplier: "",
    });

    const [hargaInput, setHargaInput] = useState("");
    const [qtyInput, setQtyInput] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Product>("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const formatRupiah = (value: number | string) => {
        const number = Number(value) || 0;
        return number.toLocaleString("id-ID");
    };

    const formatTanggal = (value: string) => {
        if (!value) return "-";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const clearFieldError = (field: keyof FormType) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setErrorMessage("");
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Product>>("/inbound", {
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
        if (supplierData.length > 0 && gudangData.length > 0 && produkData.length > 0) return;

        try {
            setLoadingOptions(true);
            const [supplierRes, gudangRes, produkRes] = await Promise.all([
                api.get<ApiListResponse<SupplierOption>>("/supplier", { params: { per_page: 100 } }),
                api.get<ApiListResponse<GudangOption>>("/gudang", { params: { per_page: 100 } }),
                api.get<ApiListResponse<ProdukOption>>("/produk", { params: { per_page: 100 } }),
            ]);

            setSupplierData(supplierRes.data.data ?? []);
            setGudangData(gudangRes.data.data ?? []);
            setProdukData(produkRes.data.data ?? []);
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
    }, [search, currentPage, sortField, sortOrder]);

    const handleSort = (field: keyof Product) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    };

    const openCreateForm = () => {
        setForm({
            gudang_id: null,
            nama_barang: "",
            kategori: "",
            tanggal_masuk: "",
            qty: 0,
            satuan: "",
            harga_satuan: 0,
            nama_supplier: "",
        });
        setHargaInput("");
        setQtyInput("");
        setFieldErrors({});
        setErrorMessage("");
        setSuccessMessage("");
        setEditId(null);
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.gudang_id) nextFieldErrors.gudang_id = "Gudang wajib dipilih.";
        if (!form.nama_barang.trim()) nextFieldErrors.nama_barang = "Nama barang wajib dipilih.";
        if (!form.kategori) nextFieldErrors.kategori = "Kategori wajib dipilih.";
        if (!form.tanggal_masuk) nextFieldErrors.tanggal_masuk = "Tanggal masuk wajib diisi.";
        if (form.qty <= 0) nextFieldErrors.qty = "Qty harus lebih dari 0.";
        if (!form.satuan.trim()) nextFieldErrors.satuan = "Satuan wajib dipilih.";
        if (form.harga_satuan < 0) nextFieldErrors.harga_satuan = "Harga satuan tidak boleh negatif.";
        if (!form.nama_supplier.trim()) nextFieldErrors.nama_supplier = "Supplier wajib dipilih.";

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
                await api.put(`/inbound/${editId}`, form);
                setSuccessMessage("Data inbound berhasil diperbarui.");
            } else {
                await api.post("/inbound", form);
                setSuccessMessage("Data inbound berhasil ditambahkan.");
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
        setForm({
            gudang_id: item.gudang_id,
            nama_barang: item.nama_barang,
            kategori: item.kategori,
            tanggal_masuk: item.tanggal_masuk,
            qty: Number(item.qty),
            satuan: item.satuan,
            harga_satuan: Number(item.harga_satuan),
            nama_supplier: item.nama_supplier,
        });
        setQtyInput(String(Number(item.qty)));
        setHargaInput(formatRupiah(item.harga_satuan));
        setFieldErrors({});
        setErrorMessage("");
        setEditId(item.id);
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/inbound/${deleteId}`);
            setDeleteId(null);
            setErrorMessage("");
            setSuccessMessage("Data inbound berhasil dihapus.");

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
            gudang_id: null,
            nama_barang: "",
            kategori: "",
            tanggal_masuk: "",
            qty: 0,
            satuan: "",
            harga_satuan: 0,
            nama_supplier: "",
        });
        setHargaInput("");
        setQtyInput("");
        setFieldErrors({});
        setErrorMessage("");
        setEditId(null);
        setOpenForm(false);
    };

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Data Barang Masuk</h1>
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
                    placeholder="Cari barang / supplier / gudang..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 bg-white shadow"
                />

                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition"
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
                                <button onClick={() => handleSort("id")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "id")}`}>
                                    No
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_barang")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "nama_barang")}`}>
                                    Nama Barang
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("gudang_id")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "gudang_id")}`}>
                                    Gudang
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("kategori")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "kategori")}`}>
                                    Kategori
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal_masuk")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "tanggal_masuk")}`}>
                                    Tanggal
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("qty")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "qty")}`}>
                                    Qty
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("satuan")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "satuan")}`}>
                                    Satuan
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("harga_satuan")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "harga_satuan")}`}>
                                    Harga
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("total_harga")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "total_harga")}`}>
                                    Total
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_supplier")} className={`flex items-center gap-2 text-left transition-colors ${getSortClass(sortField, "nama_supplier")}`}>
                                    Supplier
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((item, index) => (
                            <tr key={item.id} className="border-t border-primary/20 hover:bg-lime-100/80">
                                <td className="p-3 text-center">
                                    {item.id}
                                </td>
                                <td className="p-3">{item.nama_barang}</td>
                                <td className="p-3">{item.gudang?.nama_gudang ?? "-"}</td>
                                <td className="p-3 capitalize">{item.kategori}</td>
                                <td className="p-3">{formatTanggal(item.tanggal_masuk)}</td>
                                <td className="p-3">{Number(item.qty)}</td>
                                <td className="p-3">{item.satuan}</td>
                                <td className="p-3">Rp {formatRupiah(item.harga_satuan)}</td>
                                <td className="p-3">Rp {formatRupiah(item.total_harga)}</td>
                                <td className="p-3">{item.nama_supplier}</td>

                                <td className="p-3 flex justify-center gap-2">
                                    <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/30 text-blue-700 rounded-md">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => setDeleteId(item.id)} className="p-2 bg-red-500/30 text-red-700 rounded-md">
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
                    className="px-3 py-1 border border-white rounded-md"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        disabled={loading}
                        className={`px-3 py-1 border border-white rounded-md ${meta.current_page === i + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    disabled={(meta.current_page || 1) === totalPages || totalPages === 0 || loading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 border border-white rounded-md"
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

                            <select
                                value={form.gudang_id ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, gudang_id: e.target.value ? Number(e.target.value) : null });
                                    clearFieldError("gudang_id");
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
                                value={form.nama_barang}
                                onChange={(e) => {
                                    const selectedNama = e.target.value;
                                    const selectedProduk = produkData.find((item) => item.nama === selectedNama);

                                    setForm((prev) => ({
                                        ...prev,
                                        nama_barang: selectedNama,
                                        satuan: selectedProduk?.satuan ?? prev.satuan,
                                    }));
                                    clearFieldError("nama_barang");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama_barang ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Barang</option>
                                {produkData.map((item) => (
                                    <option key={item.id} value={item.nama}>
                                        {item.nama}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.nama_barang ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama_barang}</p> : null}

                            <select
                                value={form.kategori}
                                onChange={(e) => {
                                    setForm({ ...form, kategori: e.target.value as FormType["kategori"] });
                                    clearFieldError("kategori");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.kategori ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Kategori</option>
                                <option value="basah">Basah</option>
                                <option value="kering">Kering</option>
                            </select>
                            {fieldErrors.kategori ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.kategori}</p> : null}

                            <input
                                type="date"
                                value={form.tanggal_masuk}
                                onChange={(e) => {
                                    setForm({ ...form, tanggal_masuk: e.target.value });
                                    clearFieldError("tanggal_masuk");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.tanggal_masuk ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.tanggal_masuk ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.tanggal_masuk}</p> : null}

                            <input
                                placeholder="Qty"
                                value={qtyInput}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d.]/g, "");
                                    setQtyInput(val);
                                    setForm({ ...form, qty: Number(val || 0) });
                                    clearFieldError("qty");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.qty ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.qty ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.qty}</p> : null}

                            <input
                                value={form.satuan}
                                readOnly
                                placeholder="Satuan"
                                className={`w-full border p-2 rounded-md bg-slate-50 text-slate-700 ${fieldErrors.satuan ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.satuan ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.satuan}</p>
                            ) : (
                                <p className="text-xs text-gray-500 -mt-2">
                                    Satuan otomatis mengikuti barang yang dipilih.
                                </p>
                            )}

                            <input
                                placeholder="Harga Satuan"
                                value={hargaInput}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    setHargaInput(formatRupiah(raw));
                                    setForm({ ...form, harga_satuan: Number(raw || 0) });
                                    clearFieldError("harga_satuan");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.harga_satuan ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.harga_satuan ? (
                                <p className="text-xs text-red-600 -mt-2">{fieldErrors.harga_satuan}</p>
                            ) : (
                                <p className="text-xs text-gray-500 -mt-2">
                                    Isi 0 jika barang tidak memiliki harga beli.
                                </p>
                            )}

                            <select
                                value={form.nama_supplier}
                                onChange={(e) => {
                                    setForm({ ...form, nama_supplier: e.target.value });
                                    clearFieldError("nama_supplier");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama_supplier ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Supplier</option>
                                {supplierData.map((item) => (
                                    <option key={item.id} value={item.nama}>
                                        {item.nama}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.nama_supplier ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama_supplier}</p> : null}

                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                Total harga otomatis: <span className="font-semibold">Rp {formatRupiah(form.qty * form.harga_satuan)}</span>
                            </div>

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
                                <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-200 rounded-md">
                                    Batal
                                </button>
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
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
