"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Eye, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { extractErrorMessage, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";
import axios from "axios";
import { getSortClass } from "@/lib/getSortClass";

type SppgOption = {
    id: number;
    nama_sppg: string;
};

type ArmadaOption = {
    id: number;
    nama_unit: string;
    no_pol: string;
};

type KaryawanOption = {
    id: number;
    nama: string;
};

type TandaTerimaRecord = {
    id: number;
    nomor_tanda_terima: string;
    nomor_surat_jalan: string;
    no_po: string | null;
    tanggal: string;
    status: "draft" | "selesai" | "batal";
    sppg_id: number | null;
    armada_id: number | null;
    akuntan_id: number | null;
    driver_id: number | null;
    sppg?: SppgOption | null;
    armadaRef?: ArmadaOption | null;
    akuntan?: KaryawanOption | null;
    driver?: KaryawanOption | null;
};
type SortField = "id" | "nomor_surat_jalan" | "no_po" | "tanggal" | "status" | "sppg" | "driver";

type FormType = {
    tanggal: string;
};

type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    tanggal: "",
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

    const [records, setRecords] = useState<TandaTerimaRecord[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [form, setForm] = useState<FormType>(initialForm);
    const [openForm, setOpenForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<TandaTerimaRecord | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("tanggal");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const [
                recordsResponse,
            ] = await Promise.all([
                api.get<ApiListResponse<TandaTerimaRecord>>("/tanda-terima", {
                    params: {
                        search: search || undefined,
                        sort_field: sortField === "sppg" || sortField === "driver" ? "tanggal" : sortField,
                        sort_order: sortOrder,
                        page: currentPage,
                        per_page: perPage,
                    },
                }),
            ]);

            setRecords(recordsResponse.data.data ?? []);
            setMeta(recordsResponse.data.meta ?? initialMeta);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
  }, [currentPage, perPage, search, sortField, sortOrder]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setForm(initialForm);
        setFieldErrors({});
        setErrorMessage("");
        setOpenForm(false);
    };

    const clearFieldError = (field: keyof FormType) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        setErrorMessage("");
    };

    const openCreateForm = () => {
        setForm(initialForm);
        setFieldErrors({});
        setErrorMessage("");
        setSuccessMessage("");
        setOpenForm(true);
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.tanggal) nextFieldErrors.tanggal = "Tanggal wajib diisi.";
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

            await api.post("/tanda-terima", {
                tanggal: form.tanggal,
            });
            setSuccessMessage("Data tanda terima berhasil disinkronkan dari surat jalan.");

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
            setErrorMessage("");
            setSuccessMessage("");
            await api.delete(`/tanda-terima/${deleteTarget.id}`);
            setDeleteTarget(null);
            setSuccessMessage("Data tanda terima berhasil dihapus.");
            if (records.length === 1 && currentPage > 1) {
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
        setSortOrder("asc");
    };
    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);
    const sortedRecords = useMemo(() => {
        if (sortField !== "sppg" && sortField !== "driver") return records;
        const rows = [...records];
        rows.sort((a, b) => {
            const aText = (
                sortField === "sppg"
                    ? a.sppg?.nama_sppg
                    : a.driver?.nama
            )?.toLowerCase() || "";
            const bText = (
                sortField === "sppg"
                    ? b.sppg?.nama_sppg
                    : b.driver?.nama
            )?.toLowerCase() || "";
            return sortOrder === "asc" ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });
        return rows;
    }, [records, sortField, sortOrder]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Tanda Terima</h1>
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
                    placeholder="Cari surat jalan / no PO / SPPG..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border p-2 rounded-md w-1/4 min-w-60 bg-white shadow"
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
                                <button onClick={() => handleSort("id")} className={`flex w-full items-center justify-center gap-2 transition-colors ${getSortClass(sortField, "id")}`}>
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nomor_surat_jalan")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "nomor_surat_jalan")}`}>
                                    No. Surat Jalan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("no_po")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "no_po")}`}>
                                    No. PO <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "tanggal")}`}>
                                    Tanggal <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("sppg")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "sppg")}`}>
                                    SPPG <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("driver")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "driver")}`}>
                                    Driver <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("status")} className={`flex items-center gap-2 transition-colors ${getSortClass(sortField, "status")}`}>
                                    Status <ArrowUpDown size={14} />
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
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Belum ada data tanda terima.
                                </td>
                            </tr>
                        ) : (
                            sortedRecords.map((item, index) => (
                                <tr key={item.id} className="border-t border-primary/20 hover:bg-lime-100/80">
                                    <td className="p-3 text-center">
                                        {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3">{item.nomor_surat_jalan}</td>
                                    <td className="p-3">{item.no_po || "-"}</td>
                                    <td className="p-3">{formatTanggal(item.tanggal)}</td>
                                    <td className="p-3">{item.sppg?.nama_sppg || "-"}</td>
                                    <td className="p-3">{item.driver?.nama || "-"}</td>
                                    <td className="p-3 capitalize">{item.status}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/transaksi-penjualan/tanda-terima/detail/${item.id}`)}
                                                className="p-2 bg-green-500/30 text-green-700 rounded-md"
                                            >
                                                <Eye size={14} />
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
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-xl space-y-4">
                            <h2 className="text-lg font-semibold">Tambah Data</h2>

                            {errorMessage ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errorMessage}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <input
                                    type="date"
                                    value={form.tanggal}
                                    onChange={(e) => {
                                        setForm((prev) => ({ ...prev, tanggal: e.target.value }));
                                        clearFieldError("tanggal");
                                    }}
                                    className={`w-full border p-2 rounded-md ${fieldErrors.tanggal ? "border-red-500 focus:outline-red-500" : ""}`}
                                />
                                {fieldErrors.tanggal ? <p className="text-xs text-red-600">{fieldErrors.tanggal}</p> : null}
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
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget ? (
                    <Modal onClose={() => setDeleteTarget(null)}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
                            <h2 className="text-lg font-semibold">Hapus Data?</h2>
                            <p className="text-sm text-gray-600">
                                Tanda terima <strong>{deleteTarget.nomor_tanda_terima}</strong> akan dihapus.
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
