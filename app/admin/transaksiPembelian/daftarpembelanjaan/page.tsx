
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";
import {
    ApiListResponse,
    DaftarPembelanjaan,
    Meta,
    extractErrorMessage,
} from "@/lib/transaksiPembelian";

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

export default function Page() {
    const router = useRouter();

    const [data, setData] = useState<DaftarPembelanjaan[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filterDate, setFilterDate] = useState("");

    const [openForm, setOpenForm] = useState(false);
    const [tanggalPesan, setTanggalPesan] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<"id" | "tanggal_pesan">("tanggal_pesan");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const perPage = 10;

    async function fetchData() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get<ApiListResponse<DaftarPembelanjaan>>(
                "/daftar-pembelanjaan",
                {
                    params: {
                        search: filterDate || undefined,
                        sort_field: sortField,
                        sort_order: sortOrder,
                        page: currentPage,
                        per_page: perPage,
                    },
                }
            );

            setData(response.data.data ?? []);
            setMeta(response.data.meta ?? initialMeta);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchData();
    }, [currentPage, filterDate, sortField, sortOrder]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate]);

    function handleSort(field: "id" | "tanggal_pesan") {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
        setCurrentPage(1);
    }
    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    async function handleCreate() {
        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            await api.post("/daftar-pembelanjaan", {
                tanggal_pesan: tanggalPesan,
            });

            setSuccess("Daftar pembelanjaan berhasil dibuat dari order penawaran pada tanggal tersebut.");
            setTanggalPesan("");
            setOpenForm(false);
            await fetchData();
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Daftar Pembelanjaan</h1>
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
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border p-2 rounded-md w-52 bg-white shadow"
                />

                <button
                    onClick={() => setOpenForm(true)}
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
                                <button onClick={() => handleSort("tanggal_pesan")} className="flex w-full items-center justify-center gap-2">
                                    Tgl Pesan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-gray-500">
                                    Belum ada data daftar pembelanjaan.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-primary/20 hover:bg-white/50"
                                >
                                    <td className="p-3 text-center">
                                        {sortField === "id"
                                            ? item.id
                                            : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3 text-center">{item.tanggal_pesan}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/transaksiPembelian/daftarpembelanjaan/detail/${item.id}`
                                                    )
                                                }
                                                className="p-2 bg-green-500/30 text-green-700 rounded-md"
                                            >
                                                <Eye size={14} />
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
                    <Modal onClose={() => setOpenForm(false)}>
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                            <h2 className="text-lg font-semibold">Tambah Data</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Pesan</label>
                                <input
                                    type="date"
                                    value={tanggalPesan}
                                    onChange={(e) => setTanggalPesan(e.target.value)}
                                    className="w-full border p-2 rounded-md"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setOpenForm(false)}
                                    className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => void handleCreate()}
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
