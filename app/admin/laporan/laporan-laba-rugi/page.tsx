"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CalendarRange, HandCoins, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import api from "@/lib/api";
import { extractErrorMessage, formatCurrency } from "@/lib/transaksiPembelian";

type SppgOption = {
    id: number;
    nama_sppg: string;
};

type InvoiceRow = {
    id: number;
    tanggal_kirim: string | null;
    tanggal_invoice: string | null;
    nomor_invoice: string;
    no_po: string;
    sppg: string;
    pendapatan: number;
    status_pembayaran: string;
};

type PemasukanRow = {
    id: number;
    tanggal: string | null;
    jenis: string;
    jumlah: number;
    keterangan: string;
};

type PengeluaranPembelanjaanRow = {
    id: number;
    tanggal: string | null;
    nama_barang: string;
    kategori: string;
    nama_supplier: string;
    qty: number;
    satuan: string;
    harga_satuan: number;
    total: number;
};

type PengeluaranRow = {
    id: number;
    tanggal: string | null;
    nama_operasional: string;
    qty: number;
    satuan: string;
    harga_satuan: number;
    total: number;
};

type ReportData = {
    filters: {
        tanggal_awal: string;
        tanggal_akhir: string;
        sppg_id: number | null;
        sppg: string | null;
    };
    summary: {
        total_pendapatan_penjualan: number;
        total_pemasukan_lain: number;
        total_pengeluaran_pembelanjaan: number;
        total_pengeluaran_operasional: number;
        total_pengeluaran: number;
        laba_bersih: number;
    };
    invoice_rows: InvoiceRow[];
    pemasukan_rows: PemasukanRow[];
    pengeluaran_pembelanjaan_rows: PengeluaranPembelanjaanRow[];
    pengeluaran_rows: PengeluaranRow[];
    sppg_options: SppgOption[];
};

type ApiDetailResponse<T> = {
    message: string;
    data: T;
};

type FilterState = {
    tanggal_awal: string;
    tanggal_akhir: string;
    sppg_id: string;
};

const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const today = new Date();
const defaultFilters: FilterState = {
    tanggal_awal: formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    tanggal_akhir: formatInputDate(today),
    sppg_id: "",
};

const formatDate = (value: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
};

const formatStatus = (value: string) =>
    value === "lunas" ? "Lunas" : value === "belum lunas" ? "Belum Lunas" : value;

export default function Page() {
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [invoiceSortField, setInvoiceSortField] = useState<"id" | "tanggal_kirim" | "tanggal_invoice" | "sppg" | "nomor_invoice" | "pendapatan" | "status_pembayaran">("tanggal_invoice");
    const [invoiceSortOrder, setInvoiceSortOrder] = useState<"asc" | "desc">("desc");
    const [pemasukanSortField, setPemasukanSortField] = useState<"tanggal" | "jenis" | "jumlah" | "keterangan">("tanggal");
    const [pemasukanSortOrder, setPemasukanSortOrder] = useState<"asc" | "desc">("desc");
    const [pengeluaranPembelanjaanSortField, setPengeluaranPembelanjaanSortField] = useState<"tanggal" | "nama_barang" | "kategori" | "nama_supplier" | "qty" | "satuan" | "harga_satuan" | "total">("tanggal");
    const [pengeluaranPembelanjaanSortOrder, setPengeluaranPembelanjaanSortOrder] = useState<"asc" | "desc">("desc");
    const [pengeluaranSortField, setPengeluaranSortField] = useState<"tanggal" | "nama_operasional" | "qty" | "satuan" | "total">("tanggal");
    const [pengeluaranSortOrder, setPengeluaranSortOrder] = useState<"asc" | "desc">("desc");

    const fetchReport = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiDetailResponse<ReportData>>("/laporan/laba-rugi-transaksional", {
                params: {
                    tanggal_awal: appliedFilters.tanggal_awal || undefined,
                    tanggal_akhir: appliedFilters.tanggal_akhir || undefined,
                    sppg_id: appliedFilters.sppg_id || undefined,
                },
            });

            setReportData(response.data.data);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    const summaryCards = useMemo(() => {
        if (!reportData) return [];

        return [
            {
                label: "Pendapatan Penjualan",
                value: formatCurrency(reportData.summary.total_pendapatan_penjualan),
                icon: ReceiptText,
                tone: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
                label: "Pemasukan Lain",
                value: formatCurrency(reportData.summary.total_pemasukan_lain),
                icon: HandCoins,
                tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
            },
            {
                label: "Pengeluaran Pembelanjaan",
                value: formatCurrency(reportData.summary.total_pengeluaran_pembelanjaan),
                icon: ShoppingCart,
                tone: "text-orange-700 bg-orange-50 border-orange-200",
            },
            {
                label: "Pengeluaran Operasional",
                value: formatCurrency(reportData.summary.total_pengeluaran_operasional),
                icon: Wallet,
                tone: "text-amber-700 bg-amber-50 border-amber-200",
            },
            {
                label: "Laba Bersih",
                value: formatCurrency(reportData.summary.laba_bersih),
                icon: CalendarRange,
                tone:
                    reportData.summary.laba_bersih >= 0
                        ? "text-green-700 bg-green-50 border-green-200"
                        : "text-red-700 bg-red-50 border-red-200",
            },
        ];
    }, [reportData]);

    const sortedInvoiceRows = useMemo(() => {
        const rows = [...(reportData?.invoice_rows ?? [])];
        rows.sort((a, b) => {
            const av = a[invoiceSortField] ?? "";
            const bv = b[invoiceSortField] ?? "";
            if (typeof av === "number" && typeof bv === "number") {
                return invoiceSortOrder === "asc" ? av - bv : bv - av;
            }
            return invoiceSortOrder === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return rows;
    }, [reportData?.invoice_rows, invoiceSortField, invoiceSortOrder]);

    const sortedPemasukanRows = useMemo(() => {
        const rows = [...(reportData?.pemasukan_rows ?? [])];
        rows.sort((a, b) => {
            const av = a[pemasukanSortField] ?? "";
            const bv = b[pemasukanSortField] ?? "";
            if (typeof av === "number" && typeof bv === "number") {
                return pemasukanSortOrder === "asc" ? av - bv : bv - av;
            }
            return pemasukanSortOrder === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return rows;
    }, [reportData?.pemasukan_rows, pemasukanSortField, pemasukanSortOrder]);

    const sortedPengeluaranPembelanjaanRows = useMemo(() => {
        const rows = [...(reportData?.pengeluaran_pembelanjaan_rows ?? [])];
        rows.sort((a, b) => {
            const av = a[pengeluaranPembelanjaanSortField] ?? "";
            const bv = b[pengeluaranPembelanjaanSortField] ?? "";
            if (typeof av === "number" && typeof bv === "number") {
                return pengeluaranPembelanjaanSortOrder === "asc" ? av - bv : bv - av;
            }
            return pengeluaranPembelanjaanSortOrder === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return rows;
    }, [
        reportData?.pengeluaran_pembelanjaan_rows,
        pengeluaranPembelanjaanSortField,
        pengeluaranPembelanjaanSortOrder,
    ]);

    const sortedPengeluaranRows = useMemo(() => {
        const rows = [...(reportData?.pengeluaran_rows ?? [])];
        rows.sort((a, b) => {
            const av = a[pengeluaranSortField] ?? "";
            const bv = b[pengeluaranSortField] ?? "";
            if (typeof av === "number" && typeof bv === "number") {
                return pengeluaranSortOrder === "asc" ? av - bv : bv - av;
            }
            return pengeluaranSortOrder === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return rows;
    }, [reportData?.pengeluaran_rows, pengeluaranSortField, pengeluaranSortOrder]);

    const toggleInvoiceSort = (field: typeof invoiceSortField) => {
        if (invoiceSortField === field) {
            setInvoiceSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setInvoiceSortField(field);
        setInvoiceSortOrder(field === "tanggal_invoice" || field === "tanggal_kirim" ? "desc" : "asc");
    };
    const togglePemasukanSort = (field: typeof pemasukanSortField) => {
        if (pemasukanSortField === field) {
            setPemasukanSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setPemasukanSortField(field);
        setPemasukanSortOrder(field === "tanggal" ? "desc" : "asc");
    };
    const togglePengeluaranPembelanjaanSort = (field: typeof pengeluaranPembelanjaanSortField) => {
        if (pengeluaranPembelanjaanSortField === field) {
            setPengeluaranPembelanjaanSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setPengeluaranPembelanjaanSortField(field);
        setPengeluaranPembelanjaanSortOrder(field === "tanggal" ? "desc" : "asc");
    };
    const togglePengeluaranSort = (field: typeof pengeluaranSortField) => {
        if (pengeluaranSortField === field) {
            setPengeluaranSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setPengeluaranSortField(field);
        setPengeluaranSortOrder(field === "tanggal" ? "desc" : "asc");
    };

    return (
        <main className="space-y-6 rounded-3xl border border-white bg-white/30 p-6 backdrop-blur-2xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Laporan Laba Rugi Transaksional</h1>
                    <p className="text-sm text-muted-foreground">
                        Ringkasan pendapatan dan pengeluaran per periode dengan opsi filter SPPG.
                    </p>
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Tanggal Awal</label>
                        <input
                            type="date"
                            value={filters.tanggal_awal}
                            onChange={(e) => setFilters((prev) => ({ ...prev, tanggal_awal: e.target.value }))}
                            className="w-full rounded-md border p-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Tanggal Akhir</label>
                        <input
                            type="date"
                            value={filters.tanggal_akhir}
                            onChange={(e) => setFilters((prev) => ({ ...prev, tanggal_akhir: e.target.value }))}
                            className="w-full rounded-md border p-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">SPPG</label>
                        <select
                            value={filters.sppg_id}
                            onChange={(e) => setFilters((prev) => ({ ...prev, sppg_id: e.target.value }))}
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">Semua SPPG</option>
                            {(reportData?.sppg_options ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.nama_sppg}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => setAppliedFilters(filters)}
                            className="rounded-lg bg-[#7f1d1d] px-4 py-2 text-white shadow-sm transition hover:bg-[#6b1616]"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={() => {
                                setFilters(defaultFilters);
                                setAppliedFilters(defaultFilters);
                            }}
                            className="rounded-lg border bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {appliedFilters.sppg_id ? (
                    <p className="text-sm text-gray-500">
                        Filter SPPG hanya memengaruhi tabel pendapatan penjualan. Pemasukan lain dan pengeluaran tetap ditampilkan global per periode.
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                    <h2 className="text-lg font-semibold">Pendapatan Penjualan per SPPG</h2>
                    <p className="text-sm text-gray-500">
                        Data pendapatan diambil dari invoice penjualan pada periode yang dipilih.
                    </p>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("id")} className="flex items-center gap-2">No <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("tanggal_kirim")} className="flex items-center gap-2">Tanggal Kirim <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("tanggal_invoice")} className="flex items-center gap-2">Tanggal Invoice <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("sppg")} className="flex items-center gap-2">SPPG <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("nomor_invoice")} className="flex items-center gap-2">Nomor Invoice <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("pendapatan")} className="flex items-center gap-2">Pendapatan <ArrowUpDown size={14} /></button></th>
                                <th className="p-3 text-left"><button onClick={() => toggleInvoiceSort("status_pembayaran")} className="flex items-center gap-2">Status <ArrowUpDown size={14} /></button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500">
                                        Memuat laporan...
                                    </td>
                                </tr>
                            ) : (reportData?.invoice_rows.length ?? 0) === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500">
                                        Belum ada data invoice pada periode ini.
                                    </td>
                                </tr>
                            ) : (
                                sortedInvoiceRows.map((row, index) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{formatDate(row.tanggal_kirim)}</td>
                                        <td className="p-3">{formatDate(row.tanggal_invoice)}</td>
                                        <td className="p-3">{row.sppg}</td>
                                        <td className="p-3">{row.nomor_invoice}</td>
                                        <td className="p-3">{formatCurrency(row.pendapatan)}</td>
                                        <td className="p-3">{formatStatus(row.status_pembayaran)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Pemasukan Lain</h2>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left"><button onClick={() => togglePemasukanSort("tanggal")} className="flex items-center gap-2">Tanggal <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePemasukanSort("jenis")} className="flex items-center gap-2">Jenis <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePemasukanSort("jumlah")} className="flex items-center gap-2">Jumlah <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePemasukanSort("keterangan")} className="flex items-center gap-2">Keterangan <ArrowUpDown size={14} /></button></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : (reportData?.pemasukan_rows.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-gray-500">
                                            Belum ada pemasukan lain pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPemasukanRows.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="p-3">{formatDate(row.tanggal)}</td>
                                            <td className="p-3 capitalize">{row.jenis}</td>
                                            <td className="p-3">{formatCurrency(row.jumlah)}</td>
                                            <td className="p-3">{row.keterangan}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Pengeluaran Pembelanjaan</h2>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranPembelanjaanSort("tanggal")} className="flex items-center gap-2">Tanggal <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranPembelanjaanSort("nama_barang")} className="flex items-center gap-2">Barang <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranPembelanjaanSort("nama_supplier")} className="flex items-center gap-2">Supplier <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranPembelanjaanSort("qty")} className="flex items-center gap-2">Qty <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranPembelanjaanSort("total")} className="flex items-center gap-2">Total <ArrowUpDown size={14} /></button></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : (reportData?.pengeluaran_pembelanjaan_rows.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            Belum ada pengeluaran pembelanjaan pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPengeluaranPembelanjaanRows.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="p-3">{formatDate(row.tanggal)}</td>
                                            <td className="p-3">{row.nama_barang}</td>
                                            <td className="p-3">{row.nama_supplier}</td>
                                            <td className="p-3">{row.qty} {row.satuan}</td>
                                            <td className="p-3">{formatCurrency(row.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Pengeluaran Operasional</h2>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranSort("tanggal")} className="flex items-center gap-2">Tanggal <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranSort("nama_operasional")} className="flex items-center gap-2">Operasional <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranSort("qty")} className="flex items-center gap-2">Qty <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranSort("satuan")} className="flex items-center gap-2">Satuan <ArrowUpDown size={14} /></button></th>
                                    <th className="p-3 text-left"><button onClick={() => togglePengeluaranSort("total")} className="flex items-center gap-2">Total <ArrowUpDown size={14} /></button></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : (reportData?.pengeluaran_rows.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            Belum ada pengeluaran pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPengeluaranRows.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="p-3">{formatDate(row.tanggal)}</td>
                                            <td className="p-3">{row.nama_operasional}</td>
                                            <td className="p-3">{row.qty}</td>
                                            <td className="p-3">{row.satuan}</td>
                                            <td className="p-3">{formatCurrency(row.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
