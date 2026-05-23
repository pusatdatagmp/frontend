import axios from "axios";

export type Meta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type ApiListResponse<T> = {
    message: string;
    data: T[];
    meta?: Meta;
};

export type ApiDetailResponse<T> = {
    message: string;
    data: T;
};

export type SppgOption = {
    id: number;
    nama_sppg: string;
    alamat: string;
    nama_yayasan: string;
    nama_penanggungjawab: string;
    no_penanggungjawab: string;
};

export type SupplierOption = {
    id: number;
    nama: string;
    alamat: string;
    no_telp: string;
    kategori: string;
};

export type ProdukOption = {
    id: number;
    sku: string;
    nama: string;
    kategori: string;
    satuan: string;
};

export type KategoriOption = {
    id: number;
    kode: string;
    nama_satuan: string;
};

export type OrderPenawaranItem = {
    id: number;
    produk_id: number | null;
    kategori_id: number | null;
    supplier_id: number | null;
    nama_barang: string;
    qty: number;
    satuan: string;
    harga_satuan: number;
    keterangan: string | null;
    produk?: ProdukOption | null;
    kategori?: KategoriOption | null;
    supplier?: SupplierOption | null;
};

export type OrderPenawaran = {
    id: number;
    tanggal_pesan: string;
    tanggal_dikirim: string | null;
    nama_pembeli: string;
    keterangan: string | null;
    items?: OrderPenawaranItem[];
};

export type DaftarPembelanjaanItem = {
    id: number;
    produk_id: number | null;
    kategori_id: number | null;
    supplier_id: number | null;
    nama_barang: string;
    qty: number;
    satuan: string;
    stok: number;
    kebutuhan: number;
    nama_supplier: string;
    keterangan?: string | null;
    produk?: ProdukOption | null;
    kategori?: KategoriOption | null;
    supplier?: SupplierOption | null;
};

export type DaftarPembelanjaan = {
    id: number;
    tanggal_pesan: string;
    items?: DaftarPembelanjaanItem[];
    supplier_count?: number;
    item_count?: number;
};

export type SupplierGroup = {
    supplier: SupplierOption | null;
    items: DaftarPembelanjaanItem[];
};

export type DaftarPembelanjaanSupplierDetail = {
    id: number;
    tanggal_pesan: string;
    suppliers: SupplierGroup[];
};

export function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;

        if (typeof message === "string" && message.trim()) {
            return message;
        }

        const errors = error.response?.data?.errors;
        if (errors && typeof errors === "object") {
            const firstError = Object.values(errors)[0];
            if (Array.isArray(firstError) && firstError[0]) {
                return String(firstError[0]);
            }
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Terjadi kesalahan saat memproses data.";
};

export function formatCurrency(value: number): string {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}