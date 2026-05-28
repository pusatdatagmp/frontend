"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getStoredPermissionCodes, getStoredUser, isSuperAdminRole } from "@/lib/permissions";

type MenuChild = {
  icon: React.ReactNode;
  label: string;
  path: string;
  permission?: string;
};

type MenuConfig = {
  label: string;
  icon: React.ReactNode;
  key: string;
  children: MenuChild[];
};

/* ================= MENU CONFIG (TIDAK DIUBAH) ================= */
const menus: MenuConfig[] = [
  {
    label: "Master",
    icon: <Landmark />,
    key: "master",
    children: [
      { icon: <MapPin size={16} />, label: "Wilayah & Lokasi", path: "/admin/master/wilayah", permission: "master.wilayah.view" },
      { icon: <Truck size={16} />, label: "Supplier", path: "/admin/master/supplier", permission: "master.supplier.view" },
      { icon: <Users size={16} />, label: "Mitra", path: "/admin/master/mitra", permission: "master.mitra.view" },
      { icon: <Building2 size={16} />, label: "SPPG", path: "/admin/master/sppg", permission: "master.sppg.view" },
      { icon: <Boxes size={16} />, label: "Produk & Barang", path: "/admin/master/produk", permission: "master.produk.view" },
      { icon: <Warehouse size={16} />, label: "Gudang", path: "/admin/master/gudang", permission: "master.gudang.view" },
      { icon: <Car size={16} />, label: "Armada", path: "/admin/master/armada", permission: "master.armada.view" },
      { icon: <Users size={16} />, label: "Karyawan", path: "/admin/master/karyawan", permission: "master.karyawan.view" },
      { icon: <Banknote size={16} />, label: "Bank & Rekening", path: "/admin/master/bank", permission: "master.bank_rekening.view" },
      { icon: <Building size={16} />, label: "Perusahaan", path: "/admin/master/perusahaan", permission: "master.perusahaan.view" },
      { icon: <ShieldCheck size={16} />, label: "Kategori & Satuan", path: "/admin/master/kategori", permission: "master.kategori.view" },
      { icon: <ShieldCheck size={16} />, label: "Role", path: "/admin/master/role", permission: "master.role.view" },
    ],
  },
  {
    label: "Warehouse System",
    icon: <Warehouse />,
    key: "warehouse",
    children: [
      { icon: <ArrowDownUp size={16} />, label: "Inbound", path: "/admin/warehouse/inbound", permission: "warehouse.inbound.view" },
      { icon: <ScanLine size={16} />, label: "Cek Stok (Kering)", path: "/admin/warehouse/stokKering", permission: "warehouse.stok_kering.view" },
      { icon: <ScanLine size={16} />, label: "Cek Stok (Basah)", path: "/admin/warehouse/stokBasah", permission: "warehouse.stok_basah.view" },
      { icon: <PackageSearch size={16} />, label: "Retur/Rusak", path: "/admin/warehouse/retur", permission: "warehouse.retur.view" },
    ],
  },
  {
    label: "Transaksi Pembelian",
    icon: <ArrowLeftRight />,
    key: "pembelian",
    children: [
      { icon: <ClipboardList size={16} />, label: "List Order & Penawaran", path: "/admin/transaksiPembelian/listorderpenawaran", permission: "pembelian.order_penawaran.view" },
      { icon: <BaggageClaim size={16} />, label: "Daftar Pembelanjaan", path: "/admin/transaksiPembelian/daftarpembelanjaan", permission: "pembelian.daftar_pembelanjaan.view" },
      { icon: <Handbag size={16} />, label: "Daftar Pembelanjaan Supplier", path: "/admin/transaksiPembelian/daftarpembelanjaansupplier", permission: "pembelian.daftar_pembelanjaan_supplier.view" },
    ],
  },
  {
    label: "Transaksi Penjualan",
    icon: <ShoppingCart />,
    key: "transaksipenjualan",
    children: [
      { icon: <CircleDollarSign size={16} />, label: "Penjualan", path: "/admin/transaksi-penjualan/penjualan", permission: "penjualan.penjualan.view" },
      { icon: <Mails size={16} />, label: "Surat Jalan", path: "/admin/transaksi-penjualan/surat-jalan", permission: "penjualan.surat_jalan.view" },
      { icon: <FileText size={16} />, label: "Tanda Terima", path: "/admin/transaksi-penjualan/tanda-terima", permission: "penjualan.tanda_terima.view" },
      { icon: <ScrollText size={16} />, label: "Invoice Penjualan", path: "/admin/transaksi-penjualan/invoice-penjualan", permission: "penjualan.invoice_penjualan.view" },
    ],
  },
  {
    label: "Keuangan & Akuntansi",
    icon: <Wallet />,
    key: "keuangan",
    children: [
      { icon: <Boxes size={16} />, label: "Pemasukan", path: "/admin/keuangan/pemasukan", permission: "keuangan.pemasukan.view" },
      { icon: <TrendingUp size={16} />, label: "Pengeluaran", path: "/admin/keuangan/pengeluaran", permission: "keuangan.pengeluaran.view" },
    ],
  },
  {
    label: "Laporan & Analisa",
    icon: <BarChart3 />,
    key: "laporandananalisa",
    children: [
      { icon: <Boxes size={16} />, label: "Laporan Stok Barang", path: "/admin/laporan/laporan-stok-barang", permission: "laporan.stok_barang.view" },
      { icon: <FileText size={16} />, label: "Laba Rugi Transaksional", path: "/admin/laporan/laporan-laba-rugi", permission: "laporan.laba_rugi.view" },
    ],
  },
];

export default function Sidebar({ open }: { open: boolean }) {
  const [openMenu, setOpenMenu] = useState<Record<string, boolean>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissionCodes, setPermissionCodes] = useState<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = getStoredUser();
    setIsSuperAdmin(isSuperAdminRole(user?.role));
    setPermissionCodes(getStoredPermissionCodes(user));
  }, []);

  const visibleMenus = useMemo(
    () =>
      menus
        .map((menu) => ({
          ...menu,
          children: menu.children.filter((sub) => {
            if (!sub.permission) return true;
            return isSuperAdmin || permissionCodes.has(sub.permission);
          }),
        }))
        .filter((menu) => menu.children.length > 0),
    [isSuperAdmin, permissionCodes]
  );

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

        {visibleMenus.map((menu) => (
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
