"use client";

import { useEffect, useMemo, useState } from "react";

import api from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  BadgeDollarSign,
  Boxes,
  CalendarDays,
  CloudSun,
  CircleDollarSign,
  MoonStar,
  Sun,
  TrendingDown,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardSummary = {
  tanggal_awal: string;
  tanggal_akhir: string;
  omset_periode: number;
  pengeluaran_periode: number;
  keuntungan_periode: number;
  invoice_belum_lunas: number;
  nilai_stok: number;
};

type CashflowPoint = {
  label: string;
  pendapatan: number;
  pemasukan_lain: number;
  pengeluaran: number;
  laba_bersih: number;
};

type SalesBreakdown = {
  sppg_id: number;
  nama_sppg: string;
  total_penjualan: number;
  persentase: number;
};

type ExpenseItem = {
  nama_operasional: string;
  total_pengeluaran: number;
};

type InventorySummary = {
  total_qty: number;
  total_nilai_stok: number;
  total_baris_stok: number;
  gudang_aktif: number;
};

type DashboardFilters = {
  tanggal_awal: string;
  tanggal_akhir: string;
};

type DayPhase = "pagi" | "siang" | "sore" | "malam";

const PIE_COLORS = ["#7f1d1d", "#15803d", "#d97706", "#2563eb", "#7c3aed", "#0891b2"];

const toRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const toCompactNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStartOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const createDefaultFilters = (): DashboardFilters => ({
  tanggal_awal: formatInputDate(getStartOfMonth(new Date())),
  tanggal_akhir: formatInputDate(new Date()),
});

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

function MorningGreetingIcon() {
  return (
    <span
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-amber-300 to-sky-400 shadow-sm"
      aria-hidden="true"
    >
      <CloudSun className="h-9 w-9 text-white drop-shadow-sm" strokeWidth={2.25} />
    </span>
  );
}

export default function Dashboard() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [nama, setNama] = useState("User");
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [dayPhase, setDayPhase] = useState<DayPhase>("pagi");
  const [filters, setFilters] = useState<DashboardFilters>({ tanggal_awal: "", tanggal_akhir: "" });
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({ tanggal_awal: "", tanggal_akhir: "" });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflowPoints, setCashflowPoints] = useState<CashflowPoint[]>([]);
  const [salesBreakdown, setSalesBreakdown] = useState<SalesBreakdown[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);

    const defaultFilters = createDefaultFilters();
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);

    const user = window.localStorage.getItem("user");

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setNama(parsed.nama || parsed.name || "User");
      } catch {
        setNama("User");
      }
    }

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Selamat Pagi");
      setDayPhase("pagi");
      return;
    }

    if (hour >= 12 && hour < 18) {
      setGreeting("Selamat Siang");
      setDayPhase("siang");
      return;
    }

    if (hour >= 18 && hour < 22) {
      setGreeting("Selamat Sore");
      setDayPhase("sore");
      return;
    }

    setGreeting("Selamat Malam");
    setDayPhase("malam");
  }, []);

  useEffect(() => {
    if (!appliedFilters.tanggal_awal || !appliedFilters.tanggal_akhir) return;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryRes, trendRes, salesRes, expenseRes, inventoryRes] = await Promise.all([
          api.get("/dashboard/summary", { params: appliedFilters }),
          api.get("/dashboard/cashflow-trend", { params: appliedFilters }),
          api.get("/dashboard/penjualan-per-sppg", { params: appliedFilters }),
          api.get("/dashboard/beban-operasional", { params: appliedFilters }),
          api.get("/dashboard/persediaan"),
        ]);

        setSummary(summaryRes.data.data);
        setCashflowPoints(trendRes.data.data?.points ?? []);
        setSalesBreakdown(salesRes.data.data?.breakdown ?? []);
        setExpenseItems(expenseRes.data.data?.items ?? []);
        setInventory(inventoryRes.data.data);
      } catch {
        setError("Dashboard belum berhasil dimuat penuh.");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [appliedFilters]);

  const selectedDateLabel = useMemo(() => {
    if (!appliedFilters.tanggal_awal || !appliedFilters.tanggal_akhir) return "-";

    return `${formatDateLabel(appliedFilters.tanggal_awal)} - ${formatDateLabel(
      appliedFilters.tanggal_akhir
    )}`;
  }, [appliedFilters.tanggal_akhir, appliedFilters.tanggal_awal]);

  const totalPendapatanCashflow = cashflowPoints.reduce((sum, item) => sum + item.pendapatan, 0);
  const totalPemasukanLainCashflow = cashflowPoints.reduce((sum, item) => sum + item.pemasukan_lain, 0);
  const totalPengeluaranCashflow = cashflowPoints.reduce((sum, item) => sum + item.pengeluaran, 0);

  const greetingIcon = useMemo(() => {
    switch (dayPhase) {
      case "pagi":
        return <MorningGreetingIcon />;
      case "siang":
        return (
          <span className="select-none text-4xl leading-none" aria-hidden="true">
            <Sun className="h-10 w-10 text-amber-500" strokeWidth={2.25} />
          </span>
        );
      case "sore":
        return (
          <span className="select-none text-4xl leading-none" aria-hidden="true">
            <CloudSun className="h-10 w-10 text-sky-500" strokeWidth={2.25} />
          </span>
        );
      case "malam":
      default:
        return (
          <span className="select-none text-4xl leading-none" aria-hidden="true">
            <MoonStar className="h-10 w-10 text-indigo-500" strokeWidth={2.25} />
          </span>
        );
    }
  }, [dayPhase]);

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 space-y-6 rounded-3xl border border-white bg-white/30 p-6 backdrop-blur-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-start gap-4">
              {greetingIcon}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {greeting}, {nama}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Semoga operasional hari ini berjalan lancar.
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-base font-medium text-black">{selectedDateLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">Rentang Tanggal</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-5">
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
                min={filters.tanggal_awal || undefined}
                onChange={(e) => setFilters((prev) => ({ ...prev, tanggal_akhir: e.target.value }))}
                className="w-full rounded-md border p-2"
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-3">
              <Button
                onClick={() => {
                  if (
                    filters.tanggal_awal &&
                    filters.tanggal_akhir &&
                    filters.tanggal_awal <= filters.tanggal_akhir
                  ) {
                    setAppliedFilters(filters);
                  } else {
                    setError("Tanggal akhir harus sama atau setelah tanggal awal.");
                  }
                }}
                className="bg-[#7f1d1d] hover:bg-[#6b1616]"
              >
                Terapkan Filter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const defaultFilters = createDefaultFilters();
                  setError("");
                  setFilters(defaultFilters);
                  setAppliedFilters(defaultFilters);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Omset Periode Dipilih</p>
                <h2 className="mt-2 text-3xl font-bold text-[#2563eb]">
                  {toRupiah(summary?.omset_periode ?? 0)}
                </h2>
              </div>
              <CircleDollarSign className="h-10 w-10 text-[#2563eb]" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Belum Lunas</p>
                <h2 className="mt-2 text-3xl font-bold text-[#d97706]">
                  {toRupiah(summary?.invoice_belum_lunas ?? 0)}
                </h2>
              </div>
              <BadgeDollarSign className="h-10 w-10 text-[#d97706]" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Pengeluaran Periode Dipilih</p>
                <h2 className="mt-2 text-3xl font-bold text-[#dc2626]">
                  {toRupiah(summary?.pengeluaran_periode ?? 0)}
                </h2>
              </div>
              <TrendingDown className="h-10 w-10 text-[#dc2626]" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Nilai Stok</p>
                <h2 className="mt-2 text-3xl font-bold text-[#15803d]">
                  {toRupiah(summary?.nilai_stok ?? 0)}
                </h2>
              </div>
              <Boxes className="h-10 w-10 text-[#15803d]" />
            </CardContent>
          </Card>
        </div>

        {!isHydrated ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Menyiapkan dashboard...
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border bg-white">
            <CardHeader>
              <CardTitle>Tren Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="text-xs text-muted-foreground">Pendapatan</p>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    {toRupiah(totalPendapatanCashflow)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-xs text-muted-foreground">Pemasukan Lain</p>
                  <p className="mt-1 text-sm font-semibold text-blue-700">
                    {toRupiah(totalPemasukanLainCashflow)}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs text-muted-foreground">Pengeluaran</p>
                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {toRupiah(totalPengeluaranCashflow)}
                  </p>
                </div>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashflowPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => toRupiah(Number(value ?? 0))} />
                    <Legend />
                    <Line type="monotone" dataKey="pendapatan" stroke="#15803d" strokeWidth={3} name="Pendapatan" />
                    <Line type="monotone" dataKey="pemasukan_lain" stroke="#2563eb" strokeWidth={3} name="Pemasukan Lain" />
                    <Line type="monotone" dataKey="pengeluaran" stroke="#dc2626" strokeWidth={3} name="Pengeluaran" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 bg-gradient-to-br from-lime-600 to-green-400 text-white shadow-sm">
            <CardHeader>
              <CardTitle>Penjualan per SPPG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-white/90">Total penjualan global</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {toRupiah(salesBreakdown.reduce((sum, item) => sum + item.total_penjualan, 0))}
                </h2>
              </div>

              <div className="grid items-center gap-4 md:grid-cols-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesBreakdown}
                        dataKey="total_penjualan"
                        nameKey="nama_sppg"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {salesBreakdown.map((item, index) => (
                          <Cell key={item.sppg_id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => toRupiah(Number(value ?? 0))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {salesBreakdown.length ? (
                    salesBreakdown.map((item, index) => (
                      <div key={item.sppg_id} className="rounded-xl bg-white/95 p-3 text-slate-900">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium">{item.nama_sppg}</p>
                              <p className="text-xs text-muted-foreground">{item.persentase}%</p>
                            </div>
                          </div>
                          <p className="font-semibold">{toRupiah(item.total_penjualan)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-white/95 p-4 text-sm text-slate-600">
                      Belum ada penjualan selesai pada periode ini.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="rounded-2xl border bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Beban Operasional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseItems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nama_operasional" />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => toRupiah(Number(value ?? 0))} />
                    <Legend />
                    <Bar dataKey="total_pengeluaran" name="Pengeluaran" fill="#7f1d1d" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white">
            <CardHeader>
              <CardTitle>Ringkasan Persediaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Total Qty Stok</p>
                <h3 className="mt-2 text-2xl font-bold">{toCompactNumber(inventory?.total_qty ?? 0)}</h3>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Total Baris Stok</p>
                <h3 className="mt-2 text-2xl font-bold">{toCompactNumber(inventory?.total_baris_stok ?? 0)}</h3>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Gudang Aktif</p>
                <h3 className="mt-2 text-2xl font-bold">{toCompactNumber(inventory?.gudang_aktif ?? 0)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white">
            <CardHeader>
              <CardTitle>Laba Tanggal Dipilih</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-muted-foreground">Keuntungan Periode Dipilih</p>
                <h3 className="mt-2 text-2xl font-bold text-emerald-700">
                  {toRupiah(summary?.keuntungan_periode ?? 0)}
                </h3>
              </div>
              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-sm text-muted-foreground">Piutang Belum Lunas</p>
                <h3 className="mt-2 text-2xl font-bold text-orange-700">
                  {toRupiah(summary?.invoice_belum_lunas ?? 0)}
                </h3>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-muted-foreground">Periode Dipilih</p>
                <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-blue-700">
                  <CalendarDays className="h-5 w-5" />
                  <span>{selectedDateLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Memuat data dashboard...
          </div>
        ) : null}
      </main>
    </div>
  );
}
