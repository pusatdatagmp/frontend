"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Boxes, Package2, Warehouse, Wallet } from "lucide-react";
import api from "@/lib/api";
import { extractErrorMessage, formatCurrency } from "@/lib/transaksiPembelian";

type GudangOption = {
    id: number;
    nama_gudang: string;
};

type StockRow = {
    id: number;
    nama_barang: string;
    nama_gudang: string | null;
    qty: number;
    satuan_terkecil: string;
    harga_beli: number;
    jenis_stok: "kering" | "basah";
    tanggal_masuk: string | null;
    nilai_stok: number;
};

type SummaryPerGudang = {
    nama_gudang: string;
    total_qty: number;
    total_nilai_stok: number;
    items: StockRow[];
};

type ReportData = {
    message?: string;
    data: StockRow[];
    meta: {
        periode: "harian" | "mingguan" | "bulanan" | "tahunan";
        tanggal_acuan: string;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    summary: {
        total_qty: number;
        total_nilai_stok: number;
        per_gudang: SummaryPerGudang[];
    };
};

type FilterState = {
    search: string;
    gudang_id: string;
    jenis_stok: "" | "kering" | "basah";
    periode: "harian" | "mingguan" | "bulanan" | "tahunan";
    tanggal: string;
    sort_field: "id" | "nama_barang" | "nama_gudang" | "qty" | "satuan_terkecil" | "harga_beli" | "jenis_stok" | "nilai_stok" | "tanggal_masuk";
    sort_order: "asc" | "desc";
    page: number;
};

const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const today = new Date();

const initialFilters: FilterState = {
    search: "",
    gudang_id: "",
    jenis_stok: "",
    periode: "harian",
    tanggal: formatInputDate(today),
    sort_field: "nama_barang",
    sort_order: "asc",
    page: 1,
};

const formatDate = (value: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
};

const formatJenisStok = (value: "kering" | "basah") => (value === "kering" ? "Kering" : "Basah");

export default function Page() {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [draftSearch, setDraftSearch] = useState("");
    const [report, setReport] = useState<ReportData | null>(null);
    const [gudangOptions, setGudangOptions] = useState<GudangOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchGudangOptions = async () => {
        try {
            const response = await api.get<{ data: GudangOption[] }>("/gudang", {
                params: {
                    per_page: 100,
                },
            });

            setGudangOptions(response.data.data ?? []);
        } catch {
            setGudangOptions([]);
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ReportData>("/laporan/stok-barang", {
                params: {
                    search: filters.search || undefined,
                    gudang_id: filters.gudang_id || undefined,
                    jenis_stok: filters.jenis_stok || undefined,
                    periode: filters.periode,
                    tanggal: filters.tanggal || undefined,
                    sort_field: filters.sort_field,
                    sort_order: filters.sort_order,
                    page: filters.page,
                    per_page: 10,
                },
            });

            setReport(response.data);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchGudangOptions();
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setFilters((prev) => ({
                ...prev,
                search: draftSearch.trim(),
                page: 1,
            }));
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [draftSearch]);

    useEffect(() => {
        void fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const summaryCards = useMemo(() => {
        if (!report) return [];

        const totalBaris = report.meta.total;
        const totalGudang = report.summary.per_gudang.length;

        return [
            {
                label: "Total Baris Stok",
                value: totalBaris.toLocaleString("id-ID"),
                icon: Boxes,
                tone: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
                label: "Total Qty",
                value: report.summary.total_qty.toLocaleString("id-ID"),
                icon: Package2,
                tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
            },
            {
                label: "Total Nilai Stok",
                value: formatCurrency(report.summary.total_nilai_stok),
                icon: Wallet,
                tone: "text-amber-700 bg-amber-50 border-amber-200",
            },
            {
                label: "Gudang Aktif",
                value: totalGudang.toLocaleString("id-ID"),
                icon: Warehouse,
                tone: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200",
            },
        ];
    }, [report]);

    const handleSort = (field: FilterState["sort_field"]) => {
        setFilters((prev) => {
            if (prev.sort_field === field) {
                return {
                    ...prev,
                    sort_order: prev.sort_order === "asc" ? "desc" : "asc",
                    page: 1,
                };
            }

            return {
                ...prev,
                sort_field: field,
                sort_order: field === "tanggal_masuk" ? "desc" : "asc",
                page: 1,
            };
        });
    };

    const totalPages = Math.max(report?.meta.last_page ?? 1, 1);
    const sortedRows = report?.data ?? [];

    return (
        <main className="space-y-6 rounded-3xl border border-white bg-white/30 p-6 backdrop-blur-2xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Laporan Stok Barang</h1>
                    <p className="text-sm text-muted-foreground">
                        Posisi stok aktual dari gudang kering dan basah, lengkap dengan nilai persediaannya.
                    </p>
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Cari Barang / Gudang</label>
                        <input
                            value={draftSearch}
                            onChange={(e) => setDraftSearch(e.target.value)}
                            placeholder="Cari nama barang atau gudang..."
                            className="w-full rounded-md border p-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Tanggal</label>
                        <input
                            type="date"
                            value={filters.tanggal}
                            onChange={(e) => setFilters((prev) => ({ ...prev, tanggal: e.target.value, page: 1 }))}
                            className="w-full rounded-md border p-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Periode</label>
                        <select
                            value={filters.periode}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    periode: e.target.value as FilterState["periode"],
                                    page: 1,
                                }))
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="harian">Harian</option>
                            <option value="mingguan">Mingguan</option>
                            <option value="bulanan">Bulanan</option>
                            <option value="tahunan">Tahunan</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Jenis Stok</label>
                        <select
                            value={filters.jenis_stok}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    jenis_stok: e.target.value as FilterState["jenis_stok"],
                                    page: 1,
                                }))
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">Semua Jenis</option>
                            <option value="kering">Kering</option>
                            <option value="basah">Basah</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Gudang</label>
                        <select
                            value={filters.gudang_id}
                            onChange={(e) => setFilters((prev) => ({ ...prev, gudang_id: e.target.value, page: 1 }))}
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">Semua Gudang</option>
                            {gudangOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.nama_gudang}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setDraftSearch("");
                                setFilters(initialFilters);
                            }}
                            className="rounded-lg border bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${card.tone}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{card.label}</p>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                </div>
                                <Icon size={22} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="border-b px-4 py-3">
                    <h2 className="text-lg font-semibold">Posisi Stok Barang</h2>
                    <p className="text-sm text-gray-500">
                        Menampilkan stok gabungan gudang kering dan basah berdasarkan filter yang dipilih.
                    </p>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("id")} className="flex items-center gap-2">
                                        No <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("nama_barang")} className="flex items-center gap-2">
                                        Nama Barang <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("nama_gudang")} className="flex items-center gap-2">
                                        Gudang <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("jenis_stok")} className="flex items-center gap-2">
                                        Jenis Stok <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("qty")} className="flex items-center gap-2">
                                        Qty <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("satuan_terkecil")} className="flex items-center gap-2">
                                        Satuan <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("harga_beli")} className="flex items-center gap-2">
                                        Harga Beli <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("nilai_stok")} className="flex items-center gap-2">
                                        Nilai Stok <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="p-3 text-left">
                                    <button onClick={() => handleSort("tanggal_masuk")} className="flex items-center gap-2">
                                        Tanggal Masuk <ArrowUpDown size={14} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-6 text-center text-gray-500">
                                        Memuat laporan...
                                    </td>
                                </tr>
                            ) : (report?.data.length ?? 0) === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-6 text-center text-gray-500">
                                        Belum ada data stok pada filter ini.
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map((row, index) => (
                                    <tr key={`${row.jenis_stok}-${row.id}`} className="border-t">
                                        <td className="p-3">
                                            {filters.sort_field === "id"
                                                ? row.id
                                                : ((report?.meta?.current_page || 1) - 1) * (report?.meta.per_page || 10) + index + 1}
                                        </td>
                                        <td className="p-3">{row.nama_barang}</td>
                                        <td className="p-3">{row.nama_gudang ?? "-"}</td>
                                        <td className="p-3">{formatJenisStok(row.jenis_stok)}</td>
                                        <td className="p-3">{row.qty.toLocaleString("id-ID")}</td>
                                        <td className="p-3">{row.satuan_terkecil}</td>
                                        <td className="p-3">{formatCurrency(row.harga_beli)}</td>
                                        <td className="p-3">{formatCurrency(row.nilai_stok)}</td>
                                        <td className="p-3">{formatDate(row.tanggal_masuk)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="border-b px-4 py-3">
                    <h2 className="text-lg font-semibold">Ringkasan per Gudang</h2>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Gudang</th>
                                <th className="p-3 text-left">Jumlah Baris</th>
                                <th className="p-3 text-left">Total Qty</th>
                                <th className="p-3 text-left">Total Nilai Stok</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-500">
                                        Memuat ringkasan...
                                    </td>
                                </tr>
                            ) : (report?.summary.per_gudang.length ?? 0) === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-500">
                                        Belum ada ringkasan gudang pada filter ini.
                                    </td>
                                </tr>
                            ) : (
                                report?.summary.per_gudang.map((row) => (
                                    <tr key={row.nama_gudang} className="border-t">
                                        <td className="p-3">{row.nama_gudang}</td>
                                        <td className="p-3">{row.items.length.toLocaleString("id-ID")}</td>
                                        <td className="p-3">{row.total_qty.toLocaleString("id-ID")}</td>
                                        <td className="p-3">{formatCurrency(row.total_nilai_stok)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    disabled={(report?.meta.current_page ?? 1) === 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => setFilters((prev) => ({ ...prev, page: index + 1 }))}
                        className={`px-3 py-1 border rounded-md ${report?.meta.current_page === index + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {index + 1}
                    </button>
                ))}

                <button
                    disabled={(report?.meta.current_page ?? 1) === totalPages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </main>
    );
}
