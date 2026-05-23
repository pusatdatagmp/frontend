"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import {
    ApiDetailResponse,
    ApiListResponse,
    DaftarPembelanjaan,
    DaftarPembelanjaanItem,
    Meta,
    SupplierOption,
    extractErrorMessage,
} from "@/lib/transaksiPembelian";

type EditForm = {
    supplier_id: number | "";
};

type WarehouseStockItem = {
    nama_barang: string;
    qty: number | string;
    satuan_terkecil: string;
};
type SortField = "id" | "nama_barang" | "qty" | "satuan" | "stok" | "kebutuhan" | "nama_supplier";

function calculateKebutuhan(qty: number | string, stok: number | string) {
    return Math.max(Number(qty || 0) - Number(stok || 0), 0);
}

function normalizeUnit(value: string) {
    const normalized = value.trim().toLowerCase();

    if (["pcs", "pc", "piece", "pieces", "piecis", "picis"].includes(normalized)) {
        return "pcs";
    }

    if (["kg", "kgs", "kilogram"].includes(normalized)) {
        return "kg";
    }

    if (["ltr", "lt", "liter", "litre"].includes(normalized)) {
        return "liter";
    }

    return normalized;
}

function createStockKey(namaBarang: string, satuan: string) {
    return `${namaBarang.trim().toLowerCase()}|${normalizeUnit(satuan)}`;
}

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

export default function Page() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const daftarPembelanjaanId = Number(params.id);

    const [detail, setDetail] = useState<DaftarPembelanjaan | null>(null);
    const [items, setItems] = useState<DaftarPembelanjaanItem[]>([]);
    const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
    const [warehouseStockMap, setWarehouseStockMap] = useState<Record<string, number>>({});
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingSupplierOptions, setLoadingSupplierOptions] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("nama_barang");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [editTarget, setEditTarget] = useState<DaftarPembelanjaanItem | null>(null);
    const [form, setForm] = useState<EditForm>({ supplier_id: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [detailResponse, itemsResponse, stokKeringResponse, stokBasahResponse] = await Promise.all([
                api.get<ApiDetailResponse<DaftarPembelanjaan>>(
                    `/daftar-pembelanjaan/${daftarPembelanjaanId}`
                ),
                api.get<ApiListResponse<DaftarPembelanjaanItem>>(
                    `/daftar-pembelanjaan/${daftarPembelanjaanId}/items`,
                    {
                        params: {
                            search: search || undefined,
                            sort_field: sortField,
                            sort_order: sortOrder,
                            page: currentPage,
                            per_page: perPage,
                        },
                    }
                ),
                api.get<ApiListResponse<WarehouseStockItem>>("/stok-kering", {
                    params: { per_page: 100 },
                }),
                api.get<ApiListResponse<WarehouseStockItem>>("/stok-basah", {
                    params: { per_page: 100 },
                }),
            ]);

            const detailData = detailResponse.data.data;
            setDetail(detailData);
            setItems(itemsResponse.data.data ?? []);
            setMeta(itemsResponse.data.meta ?? initialMeta);

            const stockMap: Record<string, number> = {};
            const warehouseStocks = [
                ...(stokKeringResponse.data.data ?? []),
                ...(stokBasahResponse.data.data ?? []),
            ];

            warehouseStocks.forEach((item) => {
                const key = createStockKey(item.nama_barang, item.satuan_terkecil);
                stockMap[key] = (stockMap[key] ?? 0) + Number(item.qty || 0);
            });

            setWarehouseStockMap(stockMap);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [currentPage, daftarPembelanjaanId, perPage, search, sortField, sortOrder]);

    const fetchSupplierOptions = useCallback(async () => {
        if (loadingSupplierOptions) return;
        if (supplierOptions.length > 0) return;

        try {
            setLoadingSupplierOptions(true);
            const supplierResponse = await api.get<ApiListResponse<SupplierOption>>("/supplier", {
                params: { per_page: 100 },
            });
            setSupplierOptions(supplierResponse.data.data ?? []);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoadingSupplierOptions(false);
        }
    }, [loadingSupplierOptions, supplierOptions.length]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        if (!Number.isNaN(daftarPembelanjaanId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void fetchData();
        }
    }, [daftarPembelanjaanId, fetchData]);

    const displayItems = useMemo(
        () =>
            items.map((item) => {
                const stok = warehouseStockMap[createStockKey(item.nama_barang, item.satuan)] ?? 0;
                const qty = Number(item.qty);

                return {
                    ...item,
                    qty,
                    stok,
                    kebutuhan: calculateKebutuhan(qty, stok),
                };
            }),
        [items, warehouseStockMap]
    );

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder("asc");
    };

    function openEditModal(item: DaftarPembelanjaanItem) {
        setEditTarget(item);
        setForm({
            supplier_id: item.supplier_id ?? "",
        });
        void fetchSupplierOptions();
    }

    async function handleSubmit() {
        if (!editTarget) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const selectedSupplier =
                supplierOptions.find((item) => item.id === Number(form.supplier_id)) ?? null;

            await api.put(
                `/daftar-pembelanjaan/${daftarPembelanjaanId}/items/${editTarget.id}`,
                {
                    produk_id: editTarget.produk_id,
                    kategori_id: editTarget.kategori_id,
                    supplier_id: form.supplier_id === "" ? null : Number(form.supplier_id),
                    nama_barang: editTarget.nama_barang,
                    qty: editTarget.qty,
                    satuan: editTarget.satuan,
                    stok: editTarget.stok,
                    kebutuhan: calculateKebutuhan(editTarget.qty, editTarget.stok),
                    nama_supplier: selectedSupplier?.nama ?? "",
                }
            );

            setSuccess("Supplier barang berhasil diperbarui.");
            setEditTarget(null);
            setForm({ supplier_id: "" });
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
                <div>
                    <h1 className="text-xl font-bold">Detail Order #{daftarPembelanjaanId}</h1>
                    {detail ? (
                        <p className="text-sm text-gray-600 mt-1">{detail.tanggal_pesan}</p>
                    ) : null}
                </div>

                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-100 rounded-lg shadow"
                >
                    Kembali
                </button>
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

            <input
                placeholder="Cari barang / supplier..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border p-2 rounded-md w-1/4 min-w-60 bg-white shadow"
            />

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
                                <button onClick={() => handleSort("nama_barang")} className="flex items-center gap-2">
                                    Barang <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("qty")} className="flex items-center gap-2">
                                    Qty <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("satuan")} className="flex items-center gap-2">
                                    Satuan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("stok")} className="flex items-center gap-2">
                                    Stok <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("kebutuhan")} className="flex items-center gap-2">
                                    Kebutuhan <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("nama_supplier")} className="flex items-center gap-2">
                                    Supplier <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : displayItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Belum ada item daftar pembelanjaan.
                                </td>
                            </tr>
                        ) : (
                            displayItems.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-primary/20 hover:bg-white/50"
                                >
                                    <td className="p-3 text-center">
                                        {sortField === "id" ? item.id : ((meta.current_page || 1) - 1) * perPage + index + 1}
                                    </td>
                                    <td className="p-3">{item.nama_barang}</td>
                                    <td className="p-3 text-center">{item.qty}</td>
                                    <td className="p-3 text-center">{item.satuan}</td>
                                    <td className="p-3 text-center">{item.stok}</td>
                                    <td className="text-center"><p className="bg-yellow-500/30 text-yellow-700 py-0.5 font-semibold w-1/3 rounded-full mx-auto">{item.kebutuhan}</p></td>
                                    <td className="p-3">{item.nama_supplier || "-"}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-2 bg-blue-500/30 text-blue-700 rounded-md"
                                            >
                                                <Pencil size={14} />
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
                {editTarget ? (
                    <Modal
                        onClose={() => {
                            setEditTarget(null);
                            setForm({ supplier_id: "" });
                        }}
                    >
                        <motion.div className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
                            <h2 className="text-lg font-semibold">Pilih Supplier</h2>
                            {loadingSupplierOptions ? (
                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                    Memuat opsi supplier...
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-gray-600">Barang</p>
                                    <p>{editTarget.nama_barang}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Qty</p>
                                    <p>{editTarget.qty}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Satuan</p>
                                    <p>{editTarget.satuan}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Kebutuhan</p>
                                    <p>{editTarget.kebutuhan}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Supplier</label>
                                <select
                                    value={form.supplier_id}
                                    onChange={(e) =>
                                        setForm({ supplier_id: e.target.value ? Number(e.target.value) : "" })
                                    }
                                    className="w-full border p-2 rounded-md"
                                >
                                    <option value="">Pilih Supplier</option>
                                    {supplierOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setEditTarget(null);
                                        setForm({ supplier_id: "" });
                                    }}
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
