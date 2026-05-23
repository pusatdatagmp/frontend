"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ArrowUpDown, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { extractErrorMessage, type ApiListResponse, type Meta } from "@/lib/transaksiPembelian";
import axios from "axios";

type SppgOption = {
    id: number;
    nama_sppg: string;
};

type ArmadaOption = {
    id: number;
    nama_unit: string;
    no_pol: string;
};

type DriverOption = {
    id: number;
    nama: string;
    jabatan?: string;
    status?: string;
};

type PerusahaanOption = {
    id: number;
    nama_perusahaan: string;
    alamat: string;
    nama_pic: string;
    tema_invoice: string;
    logo_url: string | null;
};

type SuratJalan = {
    id: number;
    nomor_surat_jalan: string;
    no_po: string | null;
    tanggal: string;
    status: "draft" | "selesai" | "batal";
    sppg_id: number | null;
    armada_id: number | null;
    driver_id: number | null;
    perusahaan_id: number | null;
    sppg?: SppgOption | null;
    armada_ref?: ArmadaOption | null;
    driver?: DriverOption | null;
    perusahaan_ref?: PerusahaanOption | null;
};
type SortField = keyof SuratJalan | "sppg" | "armada" | "no_pol" | "driver" | "perusahaan";

type FormType = {
    nomor_surat_jalan: string;
    no_po: string;
    tanggal: string;
    sppg_id: number | null;
    armada_id: number | null;
    driver_id: number | null;
    perusahaan_id: number | null;
    status: "draft" | "selesai" | "batal";
};

type FieldErrors = Partial<Record<keyof FormType, string>>;

const initialForm: FormType = {
    nomor_surat_jalan: "",
    no_po: "",
    tanggal: "",
    sppg_id: null,
    armada_id: null,
    driver_id: null,
    perusahaan_id: null,
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
    const [data, setData] = useState<SuratJalan[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [sppgData, setSppgData] = useState<SppgOption[]>([]);
    const [armadaData, setArmadaData] = useState<ArmadaOption[]>([]);
    const [driverData, setDriverData] = useState<DriverOption[]>([]);
    const [perusahaanData, setPerusahaanData] = useState<PerusahaanOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [form, setForm] = useState<FormType>(initialForm);
    const [editTarget, setEditTarget] = useState<SuratJalan | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SuratJalan | null>(null);
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

            const response = await api.get<ApiListResponse<SuratJalan>>("/surat-jalan", {
                params: {
                    search: search || undefined,
                    sort_field: sortField === "sppg" || sortField === "armada" || sortField === "no_pol" || sortField === "driver" || sortField === "perusahaan"
                        ? "tanggal"
                        : sortField,
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

    const fetchFormOptions = async () => {
        if (loadingOptions) return;
        if (sppgData.length > 0 && armadaData.length > 0 && driverData.length > 0 && perusahaanData.length > 0) return;

        try {
            setLoadingOptions(true);
            const [sppgRes, armadaRes, driverRes, perusahaanRes] = await Promise.all([
                api.get<ApiListResponse<SppgOption>>("/sppg", { params: { per_page: 100 } }),
                api.get<ApiListResponse<ArmadaOption>>("/armada", { params: { per_page: 100 } }),
                api.get<ApiListResponse<DriverOption>>("/karyawan", { params: { search: "driver", per_page: 100 } }),
                api.get<ApiListResponse<PerusahaanOption>>("/surat-jalan/opsi-perusahaan"),
            ]);

            setSppgData(sppgRes.data.data ?? []);
            setArmadaData(armadaRes.data.data ?? []);
            setDriverData(driverRes.data.data ?? []);
            setPerusahaanData(perusahaanRes.data.data ?? []);
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

    const resetForm = () => {
        setForm(initialForm);
        setEditTarget(null);
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
        setEditTarget(null);
        setFieldErrors({});
        setErrorMessage("");
        setSuccessMessage("");
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleEdit = (item: SuratJalan) => {
        setEditTarget(item);
        setForm({
            nomor_surat_jalan: item.nomor_surat_jalan,
            no_po: item.no_po ?? "",
            tanggal: item.tanggal,
            sppg_id: item.sppg_id,
            armada_id: item.armada_id,
            driver_id: item.driver_id,
            perusahaan_id: item.perusahaan_id,
            status: item.status,
        });
        setFieldErrors({});
        setErrorMessage("");
        setOpenForm(true);
        void fetchFormOptions();
    };

    const handleSubmit = async () => {
        const nextFieldErrors: FieldErrors = {};

        if (!form.nomor_surat_jalan.trim()) nextFieldErrors.nomor_surat_jalan = "Nomor surat jalan wajib diisi.";
        if (!form.tanggal) nextFieldErrors.tanggal = "Tanggal wajib diisi.";
        if (!form.perusahaan_id) nextFieldErrors.perusahaan_id = "Perusahaan wajib dipilih.";
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

            const payload = {
                nomor_surat_jalan: form.nomor_surat_jalan,
                no_po: form.no_po || null,
                tanggal: form.tanggal,
                sppg_id: form.sppg_id,
                armada_id: form.armada_id,
                driver_id: form.driver_id,
                perusahaan_id: form.perusahaan_id,
                status: form.status,
            };

            if (editTarget) {
                await api.put(`/surat-jalan/${editTarget.id}`, payload);
                setSuccessMessage("Surat jalan berhasil diperbarui.");
            } else {
                await api.post("/surat-jalan", payload);
                setSuccessMessage("Surat jalan berhasil ditambahkan.");
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
            await api.delete(`/surat-jalan/${deleteTarget.id}`);
            setDeleteTarget(null);
            setErrorMessage("");
            setSuccessMessage("Surat jalan berhasil dihapus.");
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
        if (!["sppg", "armada", "no_pol", "driver", "perusahaan"].includes(sortField)) return data;
        const rows = [...data];
        rows.sort((a, b) => {
            const getValue = (item: SuratJalan) => {
                if (sortField === "sppg") return item.sppg?.nama_sppg ?? "";
                if (sortField === "armada") return item.armada_ref?.nama_unit ?? "";
                if (sortField === "no_pol") return item.armada_ref?.no_pol ?? "";
                if (sortField === "perusahaan") return item.perusahaan_ref?.nama_perusahaan ?? "";
                return item.driver?.nama ?? "";
            };
            const aText = getValue(a).toLowerCase();
            const bText = getValue(b).toLowerCase();
            return sortOrder === "asc" ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });
        return rows;
    }, [data, sortField, sortOrder]);

    const selectedArmada = armadaData.find((item) => item.id === form.armada_id) ?? null;
    const filteredDriverData = useMemo(
        () =>
            driverData.filter((item) =>
                item.jabatan?.toLowerCase().includes("driver") &&
                item.status?.toLowerCase() === "aktif"
            ),
        [driverData]
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Surat Jalan</h1>
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
                    placeholder="Cari nomor surat jalan / no PO / perusahaan..."
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
                                <button onClick={() => handleSort("nomor_surat_jalan")} className="flex items-center gap-2">
                                    No Surat Jalan
                                    <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("sppg")} className="flex items-center gap-2">
                                    SPPG <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("tanggal")} className="flex items-center gap-2">
                                    Tanggal <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("no_po")} className="flex items-center gap-2">
                                    No PO <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("armada")} className="flex items-center gap-2">
                                    Armada <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("no_pol")} className="flex items-center gap-2">
                                    No Pol <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("driver")} className="flex items-center gap-2">
                                    Driver <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("perusahaan")} className="flex items-center gap-2">
                                    Perusahaan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("status")} className="flex items-center gap-2">
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
                                    <td className="p-3">{item.nomor_surat_jalan}</td>
                                    <td className="p-3">{item.sppg?.nama_sppg ?? "-"}</td>
                                    <td className="p-3">{formatTanggal(item.tanggal)}</td>
                                    <td className="p-3">{item.no_po ?? "-"}</td>
                                    <td className="p-3">{item.armada_ref?.nama_unit ?? "-"}</td>
                                    <td className="p-3">{item.armada_ref?.no_pol ?? "-"}</td>
                                    <td className="p-3">{item.driver?.nama ?? "-"}</td>
                                    <td className="p-3">{item.perusahaan_ref?.nama_perusahaan ?? "-"}</td>
                                    <td className="p-3 capitalize">{item.status}</td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/transaksi-penjualan/surat-jalan/detail/${item.id}`)}
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
                                <td colSpan={11} className="p-6 text-center text-gray-500">
                                    Belum ada data surat jalan.
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
                                    Memuat opsi SPPG, armada, driver, dan perusahaan...
                                </div>
                            ) : null}

                            <input
                                placeholder="Nomor Surat Jalan"
                                value={form.nomor_surat_jalan}
                                onChange={(e) => {
                                    setForm({ ...form, nomor_surat_jalan: e.target.value });
                                    clearFieldError("nomor_surat_jalan");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.nomor_surat_jalan ? "border-red-500 focus:outline-red-500" : ""}`}
                            />
                            {fieldErrors.nomor_surat_jalan ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.nomor_surat_jalan}</p> : null}

                            <select
                                value={form.sppg_id ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, sppg_id: e.target.value ? Number(e.target.value) : null });
                                    clearFieldError("sppg_id");
                                }}
                                className="w-full border p-2 rounded-md"
                            >
                                <option value="">Pilih SPPG</option>
                                {sppgData.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama_sppg}
                                    </option>
                                ))}
                            </select>

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

                            <input
                                placeholder="No PO"
                                value={form.no_po}
                                onChange={(e) => setForm({ ...form, no_po: e.target.value })}
                                className="w-full border p-2 rounded-md"
                            />

                            <select
                                value={form.armada_id ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, armada_id: e.target.value ? Number(e.target.value) : null });
                                    clearFieldError("armada_id");
                                }}
                                className="w-full border p-2 rounded-md"
                            >
                                <option value="">Pilih Armada</option>
                                {armadaData.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama_unit}
                                    </option>
                                ))}
                            </select>

                            <input
                                value={selectedArmada?.no_pol ?? ""}
                                readOnly
                                placeholder="No Polisi Auto"
                                className="w-full border p-2 rounded-md bg-gray-100"
                            />

                            <select
                                value={form.driver_id ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, driver_id: e.target.value ? Number(e.target.value) : null });
                                    clearFieldError("driver_id");
                                }}
                                className="w-full border p-2 rounded-md"
                            >
                                <option value="">Pilih Driver</option>
                                {filteredDriverData.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={form.perusahaan_id ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, perusahaan_id: e.target.value ? Number(e.target.value) : null });
                                    clearFieldError("perusahaan_id");
                                }}
                                className={`w-full border p-2 rounded-md ${fieldErrors.perusahaan_id ? "border-red-500 focus:outline-red-500" : ""}`}
                            >
                                <option value="">Pilih Perusahaan</option>
                                {perusahaanData.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama_perusahaan}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.perusahaan_id ? <p className="text-xs text-red-600 -mt-2">{fieldErrors.perusahaan_id}</p> : null}

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
            <div onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </motion.div>
    );
}


