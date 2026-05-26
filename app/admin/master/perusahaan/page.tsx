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
import { DEFAULT_INVOICE_THEME_CODE, INVOICE_THEMES } from "@/lib/invoiceThemes";
import axios from "axios";
import { getSortClass } from "@/lib/getSortClass";

const API_BASE_URL = api.defaults.baseURL ?? "";
const API_ORIGIN = (() => {
    if (!API_BASE_URL) {
        return "";
    }

    try {
        return new URL(API_BASE_URL, "http://localhost").origin;
    } catch {
        return "";
    }
})();

const resolvePerusahaanLogoUrl = (item: Product): string | null => {
    if (!item.logo_url) {
        return null;
    }

    const previewUrl = API_ORIGIN ? `${API_ORIGIN}/api/perusahaan/${item.id}/logo` : item.logo_url;

    if (API_ORIGIN && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(item.logo_url)) {
        return previewUrl;
    }

    if (API_ORIGIN && item.logo_url.startsWith("/")) {
        return previewUrl;
    }

    return previewUrl;
};

/* ================= TYPE ================= */
type Product = {
    id: number;
    nama_perusahaan: string;
    alamat: string;
    nama_pic: string;
    tema_invoice: string;
    logo_url: string | null;
};

type FormType = {
    nama_perusahaan: string;
    alamat: string;
    nama_pic: string;
    tema_invoice: string;
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

    const [form, setForm] = useState<FormType>({
        nama_perusahaan: "",
        alamat: "",
        nama_pic: "",
        tema_invoice: DEFAULT_INVOICE_THEME_CODE,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

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
    const [sortField, setSortField] = useState<keyof Product>("nama_perusahaan");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    /* ================= PAGINATION ================= */
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    /* ================= HANDLE ================= */
    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<Product>>("/perusahaan", {
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

        if (!form.nama_perusahaan.trim()) nextFieldErrors.nama_perusahaan = "Nama perusahaan wajib diisi.";
        if (!form.alamat.trim()) nextFieldErrors.alamat = "Alamat wajib diisi.";
        if (!form.nama_pic.trim()) nextFieldErrors.nama_pic = "Nama PIC wajib diisi.";
        if (!form.tema_invoice.trim()) nextFieldErrors.tema_invoice = "Tema perusahaan wajib dipilih.";

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setSuccessMessage("");
            return;
        }

        try {
            setFieldErrors({});
            setErrorMessage("");
            setSuccessMessage("");

            const formData = new FormData();
            formData.append("nama_perusahaan", form.nama_perusahaan);
            formData.append("alamat", form.alamat);
            formData.append("nama_pic", form.nama_pic);
            formData.append("tema_invoice", form.tema_invoice);
            if (logoFile) {
                formData.append("logo", logoFile);
            }

            if (editId) {
                formData.append("_method", "PUT");
                await api.post(`/perusahaan/${editId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setSuccessMessage("Perusahaan berhasil diperbarui.");
            } else {
                await api.post("/perusahaan", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setSuccessMessage("Perusahaan berhasil ditambahkan.");
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
            nama_perusahaan: item.nama_perusahaan,
            alamat: item.alamat,
            nama_pic: item.nama_pic,
            tema_invoice: item.tema_invoice || DEFAULT_INVOICE_THEME_CODE,
        });
        setLogoFile(null);
        setLogoPreviewUrl(resolvePerusahaanLogoUrl(item));
        setEditId(item.id);
        setOpenForm(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/perusahaan/${deleteId}`);
            setDeleteId(null);
            setErrorMessage("");
            setSuccessMessage("Perusahaan berhasil dihapus.");

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
        setForm({ nama_perusahaan: "", alamat: "", nama_pic: "", tema_invoice: DEFAULT_INVOICE_THEME_CODE });
        setLogoFile(null);
        setLogoPreviewUrl(null);
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
                <h1 className="text-3xl font-bold">Data Perusahaan</h1>
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
                    placeholder="Cari nama perusahaan atau alamat..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 bg-white shadow"
                />

                <button
                    onClick={() => {
                        setForm({ nama_perusahaan: "", alamat: "", nama_pic: "", tema_invoice: DEFAULT_INVOICE_THEME_CODE });
                        setLogoFile(null);
                        setLogoPreviewUrl(null);
                        setFieldErrors({});
                        setEditId(null);
                        setErrorMessage("");
                        setOpenForm(true);
                    }}
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
                                <button onClick={() => handleSort("id")} className={`flex w-full items-center justify-center gap-2 transition-colors ${getSortClass(
                                    sortField,
                                    "id"
                                )}`}>
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("nama_perusahaan")} className={`flex items-center gap-2 transition-colors ${getSortClass(
                                    sortField,
                                    "nama_perusahaan"
                                )}`}>
                                    Nama Perusahaan <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("alamat")} className={`flex items-center gap-2 transition-colors ${getSortClass(
                                    sortField,
                                    "alamat"
                                )}`}>
                                    Alamat <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3">
                                <button onClick={() => handleSort("nama_pic")} className={`flex items-center gap-2 transition-colors ${getSortClass(
                                    sortField,
                                    "nama_pic"
                                )}`}>
                                    Nama PIC <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tema_invoice")} className={`flex items-center gap-2 transition-colors ${getSortClass(
                                    sortField,
                                    "tema_invoice"
                                )}`}>
                                    Tema <ArrowUpDown size={14} />
                                </button>
                            </th>

                            <th className="p-3 text-center">Logo</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((item, index) => (
                            <tr key={item.id} className="border-t border-primary/20 hover:bg-lime-100/80">
                                <td className="p-3 text-center">
                                    {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * (meta.per_page || perPage) + index + 1}
                                </td>
                                <td className="p-3">{item.nama_perusahaan}</td>
                                <td className="p-3">{item.alamat}</td>
                                <td className="p-3">{item.nama_pic}</td>
                                <td className="p-3">{INVOICE_THEMES.find((theme) => theme.code === item.tema_invoice)?.label ?? "Maroon Klasik"}</td>
                                <td className="p-3 text-center">
                                    {resolvePerusahaanLogoUrl(item) ? (
                                        <a
                                            href={resolvePerusahaanLogoUrl(item) ?? "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                        >
                                            Lihat Logo
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
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
                                placeholder="Nama Perusahaan"
                                value={form.nama_perusahaan}
                                onChange={(e) => {
                                    setForm({ ...form, nama_perusahaan: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, nama_perusahaan: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama_perusahaan ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.nama_perusahaan ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama_perusahaan}</p> : null}

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
                                placeholder="Nama PIC"
                                value={form.nama_pic}
                                onChange={(e) => {
                                    setForm({ ...form, nama_pic: e.target.value });
                                    setFieldErrors((prev) => ({ ...prev, nama_pic: undefined }));
                                    setErrorMessage("");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nama_pic ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.nama_pic ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nama_pic}</p> : null}

                            <div className="space-y-1">
                                <label className="text-sm text-gray-700">Tema Perusahaan</label>
                                <select
                                    value={form.tema_invoice}
                                    onChange={(e) => {
                                        setForm({ ...form, tema_invoice: e.target.value });
                                        setFieldErrors((prev) => ({ ...prev, tema_invoice: undefined }));
                                        setErrorMessage("");
                                    }}
                                    className={`w-full border p-2 rounded-md ${fieldErrors.tema_invoice ? "border-red-500 focus:outline-red-500" : ""}`}
                                >
                                    {INVOICE_THEMES.map((theme) => (
                                        <option key={theme.code} value={theme.code}>
                                            {theme.label}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.tema_invoice ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.tema_invoice}</p> : null}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Logo Perusahaan (opsional)</label>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0] ?? null;
                                        setLogoFile(selectedFile);
                                        setErrorMessage("");
                                        if (selectedFile) {
                                            setLogoPreviewUrl(URL.createObjectURL(selectedFile));
                                        } else if (editId) {
                                            setLogoPreviewUrl((prev) => prev);
                                        } else {
                                            setLogoPreviewUrl(null);
                                        }
                                    }}
                                    className="w-full border p-2 rounded-md"
                                />
                                {logoPreviewUrl ? (
                                    <img
                                        src={logoPreviewUrl}
                                        alt="Preview logo perusahaan"
                                        className="h-16 w-16 rounded object-contain border border-gray-200 bg-white p-1"
                                    />
                                ) : null}
                                <p className="text-xs text-gray-500">Format: JPG/PNG/WEBP, maksimal 2MB.</p>
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

/* MODAL tetap sama */
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


