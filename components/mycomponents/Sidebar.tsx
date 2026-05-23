"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ChevronDown,
  Users,
  MapPin,
  Truck,
  Building2,
  Boxes,
  Warehouse,
  Car,
  ShieldCheck,
  Banknote,
  ShoppingCart,
  ClipboardList,
  ArrowDownUp,
  ScanLine,
  PackageSearch,
  BarChart3,
  FileText,
  TrendingUp,
  Landmark,
  BaggageClaim,
  ScrollText,
  ArrowLeftRight,
  CircleDollarSign,
  Mails,
  Building,
  Handbag,
  Wallet,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";


/* ================= MENU CONFIG (TIDAK DIUBAH) ================= */
const menus = [
  {
    label: "Master",
    icon: <Landmark />,
    key: "master",
    children: [
      { icon: <MapPin size={16} />, label: "Wilayah & Lokasi", path: "/admin/master/wilayah" },
      { icon: <Truck size={16} />, label: "Supplier", path: "/admin/master/supplier" },
      { icon: <Users size={16} />, label: "Mitra", path: "/admin/master/mitra" },
      { icon: <Building2 size={16} />, label: "SPPG", path: "/admin/master/sppg" },
      { icon: <Boxes size={16} />, label: "Produk & Barang", path: "/admin/master/produk" },
      { icon: <Warehouse size={16} />, label: "Gudang", path: "/admin/master/gudang" },
      { icon: <Car size={16} />, label: "Armada", path: "/admin/master/armada" },
      { icon: <Users size={16} />, label: "Karyawan", path: "/admin/master/karyawan" },
      { icon: <Banknote size={16} />, label: "Bank & Rekening", path: "/admin/master/bank" },
      { icon: <Building size={16} />, label: "Perusahaan", path: "/admin/master/perusahaan" },
      { icon: <ShieldCheck size={16} />, label: "Kategori & Satuan", path: "/admin/master/kategori" },
    ],
  },
  {
    label: "Warehouse System",
    icon: <Warehouse />,
    key: "warehouse",
    children: [
      { icon: <ArrowDownUp size={16} />, label: "Inbound", path: "/admin/warehouse/inbound" },
      { icon: <ScanLine size={16} />, label: "Cek Stok (Kering)", path: "/admin/warehouse/stokKering" },
      { icon: <ScanLine size={16} />, label: "Cek Stok (Basah)", path: "/admin/warehouse/stokBasah" },
      { icon: <PackageSearch size={16} />, label: "Retur/Rusak", path: "/admin/warehouse/retur" },
    ],
  },
  {
    label: "Transaksi Pembelian",
    icon: <ArrowLeftRight />,
    key: "pembelian",
    children: [
      { icon: <ClipboardList size={16} />, label: "List Order & Penawaran", path: "/admin/transaksiPembelian/listorderpenawaran" },
      { icon: <BaggageClaim size={16} />, label: "Daftar Pembelanjaan", path: "/admin/transaksiPembelian/daftarpembelanjaan" },
      { icon: <Handbag size={16} />, label: "Daftar Pembelanjaan Supplier", path: "/admin/transaksiPembelian/daftarpembelanjaansupplier" },
    ],
  },
  {
    label: "Transaksi Penjualan",
    icon: <ShoppingCart />,
    key: "transaksipenjualan",
    children: [
      { icon: <CircleDollarSign size={16} />, label: "Penjualan", path: "/admin/transaksi-penjualan/penjualan" },
      { icon: <Mails size={16} />, label: "Surat Jalan", path: "/admin/transaksi-penjualan/surat-jalan" },
      { icon: <FileText size={16} />, label: "Tanda Terima", path: "/admin/transaksi-penjualan/tanda-terima" },
      { icon: <ScrollText size={16} />, label: "Invoice Penjualan", path: "/admin/transaksi-penjualan/invoice-penjualan" },
    ],
  },
   {
    label: "Keuangan & Akuntansi",
    icon: <Wallet />,
    key: "keuangan",
    children: [
      { icon: <Boxes size={16} />, label: "Pemasukan", path: "/admin/keuangan/pemasukan" },
      { icon: <TrendingUp size={16} />, label: "Pengeluaran", path: "/admin/keuangan/pengeluaran" },
    ],
  },
  {
    label: "Laporan & Analisa",
    icon: <BarChart3 />,
    key: "laporandananalisa",
    children: [
      { icon: <Boxes size={16} />, label: "Laporan Stok Barang", path: "/admin/laporan/laporan-stok-barang" },
      { icon: <FileText size={16} />, label: "Laba Rugi Transaksional", path: "/admin/laporan/laporan-laba-rugi" },
    ],
  },
];

export default function Sidebar({ open }: { open: boolean }) {
  const [openMenu, setOpenMenu] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = (key: string) => {
    setOpenMenu((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen text-gray-200 bg-primary backdrop-blur-lg transition-all duration-300 flex flex-col
      ${open ? "w-64" : "w-20"}`}
    >
      {/* HEADER */}
      <div className="h-16 flex items-center justify-center font-bold text-lg text-white">
        {open ? "Garuda Merah Putih" : "GMP"}
      </div>

      {/* 🔥 SCROLL FIX DI SINI */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2 sidebar-scroll">

        <SidebarItem
          icon={<LayoutDashboard />}
          label="Overview"
          open={open}
          active={pathname === "/admin"}
          onClick={() => router.push("/admin")}
        />

        <SidebarItem
          icon={<History />}
          label="Log Aktivitas"
          open={open}
          active={pathname === "/admin/log-aktivitas"}
          onClick={() => router.push("/admin/log-aktivitas")}
        />

        <p className="bg-white relative border-b-2 w-auto mt-6"></p>

        {menus.map((menu) => (
          <div key={menu.key}>
            <div
              onClick={() => toggleMenu(menu.key)}
              className={`flex items-center ${open ? "justify-between px-3" : "justify-center"} py-3 rounded-lg hover:bg-gray-200/20 cursor-pointer group relative`}
            >
              <div className="flex items-center gap-3">
                {menu.icon}
                {open && <span className="text-sm">{menu.label}</span>}
              </div>

              {open && (
                <ChevronDown
                  size={18}
                  className={`transition-transform ${openMenu[menu.key] ? "rotate-180" : ""}`}
                />
              )}
            </div>

            <AnimatePresence>
              {open && openMenu[menu.key] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="ml-10 mt-1 space-y-1">
                    {menu.children.map((sub, i) => (
                      <SubItem
                        key={i}
                        icon={sub.icon}
                        label={sub.label}
                        active={pathname === sub.path}
                        onClick={() => router.push(sub.path)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </aside>
  );
}

/* COMPONENT TETAP */
type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onClick: () => void;
  active: boolean;
};

type SubItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
};

function SidebarItem({ icon, label, open, onClick, active }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${open ? "gap-3 px-3" : "justify-center"
        } py-3 rounded-lg cursor-pointer text-gray-200
      ${active ? "bg-gray-200 text-primary font-semibold" : "hover:bg-gray-200/20"}`}
    >
      {icon}
      {open && <span className="text-sm">{label}</span>}
    </div>
  );
}

function SubItem({ icon, label, onClick, active }: SubItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm
      ${active
          ? "bg-gray-200 text-primary font-medium"
          : "text-gray-200 hover:bg-gray-200/20"
        }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
