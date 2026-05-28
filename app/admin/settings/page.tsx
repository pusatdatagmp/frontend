"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import axios from "axios";
import { ArrowUpDown } from "lucide-react";

type LoginRole = "admin" | "superadmin";
type RoleOption = { label: string; value: string };
type MasterRoleRow = { id: number; no?: number; role: string };

type ProfileForm = {
    nama: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type CreateUserForm = {
    nama: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
};

type PermissionItem = {
    id: number;
    code: string;
    name: string;
    description?: string;
};

type PermissionGroup = {
    group_name: string;
    permissions: PermissionItem[];
};

type ManagedUser = {
    id: number;
    nama: string;
    email: string;
    role: string;
    permissions: PermissionItem[];
};

type EditUserForm = {
    id: number;
    nama: string;
    email: string;
    role: string;
    password: string;
    confirmPassword: string;
    permissionIds: number[];
};

type PermissionMatrixItem = {
    label: string;
    viewCode?: string;
    createCode?: string;
    updateCode?: string;
    deleteCode?: string;
};

type PermissionMatrixSection = {
    title: string;
    items: PermissionMatrixItem[];
};
type UserSortField = "no" | "nama" | "email" | "role";
type CreateUserFieldErrors = Partial<Record<keyof CreateUserForm, string>>;

const emptyProfile: ProfileForm = {
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const emptyCreateUser: CreateUserForm = {
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
};

const emptyEditUser: EditUserForm = {
    id: 0,
    nama: "",
    email: "",
    role: "admin",
    password: "",
    confirmPassword: "",
    permissionIds: [],
};

const ROLE_STORAGE_KEY = "master_role_rows_v1";
const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
    { label: "Admin", value: "admin" },
    { label: "Super Admin", value: "superadmin" },
];

const PERMISSION_MATRIX_SECTIONS: PermissionMatrixSection[] = [
    {
        title: "Dashboard",
        items: [
            {
                label: "Dashboard",
                viewCode: "dashboard.view",
            },
        ],
    },
    {
        title: "Master",
        items: [
            { label: "Wilayah & Lokasi", viewCode: "master.wilayah.view", createCode: "master.wilayah.create", updateCode: "master.wilayah.update", deleteCode: "master.wilayah.delete" },
            { label: "Supplier", viewCode: "master.supplier.view", createCode: "master.supplier.create", updateCode: "master.supplier.update", deleteCode: "master.supplier.delete" },
            { label: "Mitra", viewCode: "master.mitra.view", createCode: "master.mitra.create", updateCode: "master.mitra.update", deleteCode: "master.mitra.delete" },
            { label: "SPPG", viewCode: "master.sppg.view", createCode: "master.sppg.create", updateCode: "master.sppg.update", deleteCode: "master.sppg.delete" },
            { label: "Produk & Barang", viewCode: "master.produk.view", createCode: "master.produk.create", updateCode: "master.produk.update", deleteCode: "master.produk.delete" },
            { label: "Gudang", viewCode: "master.gudang.view", createCode: "master.gudang.create", updateCode: "master.gudang.update", deleteCode: "master.gudang.delete" },
            { label: "Armada", viewCode: "master.armada.view", createCode: "master.armada.create", updateCode: "master.armada.update", deleteCode: "master.armada.delete" },
            { label: "Karyawan", viewCode: "master.karyawan.view", createCode: "master.karyawan.create", updateCode: "master.karyawan.update", deleteCode: "master.karyawan.delete" },
            { label: "Bank & Rekening", viewCode: "master.bank_rekening.view", createCode: "master.bank_rekening.create", updateCode: "master.bank_rekening.update", deleteCode: "master.bank_rekening.delete" },
            { label: "Perusahaan", viewCode: "master.perusahaan.view", createCode: "master.perusahaan.create", updateCode: "master.perusahaan.update", deleteCode: "master.perusahaan.delete" },
            { label: "Kategori & Satuan", viewCode: "master.kategori.view", createCode: "master.kategori.create", updateCode: "master.kategori.update", deleteCode: "master.kategori.delete" },
            { label: "Role", viewCode: "master.role.view", createCode: "master.role.create", updateCode: "master.role.update", deleteCode: "master.role.delete" },
        ],
    },
    {
        title: "Warehouse System",
        items: [
            { label: "Inbound", viewCode: "warehouse.inbound.view", createCode: "warehouse.inbound.create", updateCode: "warehouse.inbound.update", deleteCode: "warehouse.inbound.delete" },
            { label: "Cek Stok (Kering)", viewCode: "warehouse.stok_kering.view", createCode: "warehouse.stok_kering.create", updateCode: "warehouse.stok_kering.update", deleteCode: "warehouse.stok_kering.delete" },
            { label: "Cek Stok (Basah)", viewCode: "warehouse.stok_basah.view", createCode: "warehouse.stok_basah.create", updateCode: "warehouse.stok_basah.update", deleteCode: "warehouse.stok_basah.delete" },
            { label: "Retur/Rusak", viewCode: "warehouse.retur.view", createCode: "warehouse.retur.create", updateCode: "warehouse.retur.update", deleteCode: "warehouse.retur.delete" },
        ],
    },
    {
        title: "Transaksi Pembelian",
        items: [
            { label: "List Order & Penawaran", viewCode: "pembelian.order_penawaran.view", createCode: "pembelian.order_penawaran.create", updateCode: "pembelian.order_penawaran.update", deleteCode: "pembelian.order_penawaran.delete" },
            { label: "Daftar Pembelanjaan", viewCode: "pembelian.daftar_pembelanjaan.view", createCode: "pembelian.daftar_pembelanjaan.create", updateCode: "pembelian.daftar_pembelanjaan.update", deleteCode: "pembelian.daftar_pembelanjaan.delete" },
            { label: "Daftar Pembelanjaan Supplier", viewCode: "pembelian.daftar_pembelanjaan_supplier.view" },
        ],
    },
    {
        title: "Transaksi Penjualan",
        items: [
            { label: "Penjualan", viewCode: "penjualan.penjualan.view", createCode: "penjualan.penjualan.create", updateCode: "penjualan.penjualan.update", deleteCode: "penjualan.penjualan.delete" },
            { label: "Surat Jalan", viewCode: "penjualan.surat_jalan.view", createCode: "penjualan.surat_jalan.create", updateCode: "penjualan.surat_jalan.update", deleteCode: "penjualan.surat_jalan.delete" },
            { label: "Tanda Terima", viewCode: "penjualan.tanda_terima.view", createCode: "penjualan.tanda_terima.create", updateCode: "penjualan.tanda_terima.update", deleteCode: "penjualan.tanda_terima.delete" },
            { label: "Invoice Penjualan", viewCode: "penjualan.invoice_penjualan.view", createCode: "penjualan.invoice_penjualan.create", updateCode: "penjualan.invoice_penjualan.update", deleteCode: "penjualan.invoice_penjualan.delete" },
        ],
    },
    {
        title: "Keuangan & Akuntansi",
        items: [
            { label: "Pemasukan", viewCode: "keuangan.pemasukan.view", createCode: "keuangan.pemasukan.create", updateCode: "keuangan.pemasukan.update", deleteCode: "keuangan.pemasukan.delete" },
            { label: "Pengeluaran", viewCode: "keuangan.pengeluaran.view", createCode: "keuangan.pengeluaran.create", updateCode: "keuangan.pengeluaran.update", deleteCode: "keuangan.pengeluaran.delete" },
        ],
    },
    {
        title: "Laporan & Analisa",
        items: [
            { label: "Laporan Stok Barang", viewCode: "laporan.stok_barang.view" },
            { label: "Laba Rugi Transaksional", viewCode: "laporan.laba_rugi.view" },
        ],
    },
];

const MATRIX_PERMISSION_CODES = new Set(
    PERMISSION_MATRIX_SECTIONS.flatMap((section) =>
        section.items.flatMap((item) =>
            [item.viewCode, item.createCode, item.updateCode, item.deleteCode].filter(Boolean)
        )
    ) as string[]
);

const isSuperAdminRole = (role: string): boolean =>
    role.toLowerCase().replace(/[\s_-]+/g, "") === "superadmin";

const normalizeRoleToLogin = (role: string): LoginRole =>
    isSuperAdminRole(role) ? "superadmin" : "admin";

const normalizeRoleForApi = (role: string): string =>
    isSuperAdminRole(role) ? "superadmin" : role.trim();

const formatRoleLabel = (role: string): string => {
    if (isSuperAdminRole(role)) return "Super Admin";
    if (role.toLowerCase().replace(/[\s_-]+/g, "") === "admin") return "Admin";
    return role;
};

const loadRoleOptionsFromMasterStorage = (): RoleOption[] => {
    try {
        const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
        if (!raw) return DEFAULT_ROLE_OPTIONS;

        const parsed = JSON.parse(raw) as MasterRoleRow[];
        if (!Array.isArray(parsed)) return DEFAULT_ROLE_OPTIONS;

        const mapped = parsed
            .map((row) => String(row?.role ?? "").trim())
            .filter((value) => value.length > 0)
            .map((value) => ({ label: value, value }));

        const defaults = DEFAULT_ROLE_OPTIONS.filter(
            (item) =>
                !mapped.some(
                    (x) =>
                        x.value.toLowerCase().replace(/[\s_-]+/g, "") ===
                        item.value.toLowerCase().replace(/[\s_-]+/g, "")
                )
        );

        const merged = [...mapped, ...defaults];

        const deduped = merged.filter((item, index, arr) => {
            const key = item.value.toLowerCase().replace(/[\s_-]+/g, "");
            return arr.findIndex((x) => x.value.toLowerCase().replace(/[\s_-]+/g, "") === key) === index;
        });

        return deduped.length > 0 ? deduped : DEFAULT_ROLE_OPTIONS;
    } catch {
        return DEFAULT_ROLE_OPTIONS;
    }
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const apiErrors = error.response?.data?.errors;
        if (apiErrors && typeof apiErrors === "object") {
            const firstKey = Object.keys(apiErrors)[0];
            const firstMessage = apiErrors[firstKey]?.[0];
            if (typeof firstMessage === "string") {
                return firstMessage;
            }
        }

        if (typeof error.response?.data?.message === "string" && error.response.data.message.length > 0) {
            return error.response.data.message;
        }
    }

    return fallback;
};

const getApiFieldErrors = (error: unknown): Record<string, string> => {
    if (!axios.isAxiosError(error)) return {};

    const apiErrors = error.response?.data?.errors;
    if (!apiErrors || typeof apiErrors !== "object") return {};

    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(apiErrors)) {
        if (Array.isArray(value) && typeof value[0] === "string") {
            mapped[key] = value[0];
        }
    }

    return mapped;
};

export default function Page() {
    const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
    const [createUserForm, setCreateUserForm] = useState<CreateUserForm>(emptyCreateUser);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [createPermissionIds, setCreatePermissionIds] = useState<number[]>([]);
    const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
    const [loadingUserManagement, setLoadingUserManagement] = useState(false);
    const [editingUser, setEditingUser] = useState<EditUserForm>(emptyEditUser);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [userSearch, setUserSearch] = useState("");
    const [currentRole, setCurrentRole] = useState<LoginRole>("admin");
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    const [savingEditUser, setSavingEditUser] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [roleOptions, setRoleOptions] = useState<RoleOption[]>(DEFAULT_ROLE_OPTIONS);
    const [mounted, setMounted] = useState(false);
    const [userSortField, setUserSortField] = useState<UserSortField>("no");
    const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("asc");
    const [createUserFieldErrors, setCreateUserFieldErrors] = useState<CreateUserFieldErrors>({});
    const reloadRoleOptions = () => setRoleOptions(loadRoleOptionsFromMasterStorage());

    const loadUserManagementData = async () => {
        setLoadingUserManagement(true);
        try {
            const [permissionResponse, usersResponse] = await Promise.all([
                api.get("/permissions"),
                api.get("/users", {
                    params: {
                        per_page: 100,
                        sort_field: "id",
                        sort_order: "desc",
                    },
                }),
            ]);

            const groups = Array.isArray(permissionResponse.data?.data)
                ? (permissionResponse.data.data as PermissionGroup[])
                : [];

            const users = Array.isArray(usersResponse.data?.data)
                ? (usersResponse.data.data as ManagedUser[])
                : [];

            setPermissionGroups(groups);
            setManagedUsers(users);
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, "Gagal memuat data user dan permission."));
        } finally {
            setLoadingUserManagement(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        reloadRoleOptions();
    }, []);

    useEffect(() => {
        const handleStorage = () => reloadRoleOptions();
        const handleFocus = () => reloadRoleOptions();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    useEffect(() => {
        if (roleOptions.length === 0) return;

        const hasCurrentCreateRole = roleOptions.some((option) => option.value === createUserForm.role);
        if (!hasCurrentCreateRole) {
            setCreateUserForm((prev) => ({ ...prev, role: roleOptions[0].value }));
        }
    }, [roleOptions, createUserForm.role]);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                setErrorMessage("");

                const response = await api.get("/auth/me");
                const user = response.data?.user;

                if (!user?.id) {
                    throw new Error("Data user tidak valid.");
                }

                window.localStorage.setItem("user", JSON.stringify(user));

                const loginRole = normalizeRoleToLogin(String(user.role ?? "admin"));
                setCurrentRole(loginRole);
                setCurrentUserId(Number(user.id));
                setProfileForm({
                    nama: String(user.nama ?? ""),
                    email: String(user.email ?? ""),
                    password: "",
                    confirmPassword: "",
                });

                if (loginRole === "superadmin") {
                    await loadUserManagementData();
                }
            } catch (error) {
                setErrorMessage(getApiErrorMessage(error, "Gagal memuat data settings."));
            } finally {
                setLoading(false);
            }
        };

        void bootstrap();
    }, []);

    const handleSaveProfile = async () => {
        if (!profileForm.nama.trim() || !profileForm.email.trim()) {
            setErrorMessage("Nama dan email wajib diisi.");
            setSuccessMessage("");
            return;
        }

        if (profileForm.password && profileForm.password.length < 8) {
            setErrorMessage("Password baru minimal 8 karakter.");
            setSuccessMessage("");
            return;
        }

        if (profileForm.password !== profileForm.confirmPassword) {
            setErrorMessage("Konfirmasi password tidak sama.");
            setSuccessMessage("");
            return;
        }

        try {
            setSavingProfile(true);
            setErrorMessage("");
            setSuccessMessage("");

            await api.put("/auth/profile", {
                nama: profileForm.nama.trim(),
                email: profileForm.email.trim(),
                password: profileForm.password || undefined,
                password_confirmation: profileForm.confirmPassword || undefined,
            });

            setProfileForm((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));
            setSuccessMessage("Akun kamu berhasil diperbarui.");
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, "Gagal memperbarui akun."));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCreateUser = async () => {
        const nextFieldErrors: CreateUserFieldErrors = {};

        if (!createUserForm.nama.trim() || !createUserForm.email.trim()) {
            if (!createUserForm.nama.trim()) nextFieldErrors.nama = "Nama wajib diisi.";
            if (!createUserForm.email.trim()) nextFieldErrors.email = "Email wajib diisi.";
            setCreateUserFieldErrors(nextFieldErrors);
            setErrorMessage("Nama dan email akun baru wajib diisi.");
            setSuccessMessage("");
            return;
        }

        if (createUserForm.password.length < 8) {
            setCreateUserFieldErrors({ password: "Password minimal 8 karakter." });
            setErrorMessage("Password akun baru minimal 8 karakter.");
            setSuccessMessage("");
            return;
        }

        if (createUserForm.password !== createUserForm.confirmPassword) {
            setCreateUserFieldErrors({ confirmPassword: "Konfirmasi password tidak sama." });
            setErrorMessage("Konfirmasi password akun baru tidak sama.");
            setSuccessMessage("");
            return;
        }

        try {
            setSavingUser(true);
            setCreateUserFieldErrors({});
            setErrorMessage("");
            setSuccessMessage("");

            await api.post("/users", {
                nama: createUserForm.nama.trim(),
                email: createUserForm.email.trim(),
                password: createUserForm.password,
                role: normalizeRoleForApi(createUserForm.role),
                ...(!isSuperAdminRole(createUserForm.role) ? { permission_ids: sanitizePermissionIds(createPermissionIds) } : {}),
            });

            setCreateUserForm(emptyCreateUser);
            setCreatePermissionIds([]);
            setCreateUserFieldErrors({});
            await loadUserManagementData();
            setSuccessMessage("Akun baru berhasil ditambahkan.");
        } catch (error) {
            const apiFieldErrors = getApiFieldErrors(error);
            const mappedFieldErrors: CreateUserFieldErrors = {};
            if (apiFieldErrors.nama) mappedFieldErrors.nama = apiFieldErrors.nama;
            if (apiFieldErrors.email) mappedFieldErrors.email = apiFieldErrors.email;
            if (apiFieldErrors.password) mappedFieldErrors.password = apiFieldErrors.password;
            if (apiFieldErrors.password_confirmation) mappedFieldErrors.confirmPassword = apiFieldErrors.password_confirmation;
            if (Object.keys(mappedFieldErrors).length > 0) {
                setCreateUserFieldErrors(mappedFieldErrors);
            }
            setErrorMessage(getApiErrorMessage(error, "Gagal menambah akun baru."));
        } finally {
            setSavingUser(false);
        }
    };

    const togglePermission = (ids: number[], permissionId: number): number[] => {
        if (ids.includes(permissionId)) {
            return ids.filter((id) => id !== permissionId);
        }

        return [...ids, permissionId];
    };

    const handleOpenEditUser = (user: ManagedUser) => {
        if (user.id === currentUserId) {
            setErrorMessage("Akun yang sedang login dikelola dari panel 'Akun Saya'.");
            setSuccessMessage("");
            return;
        }

        setEditingUser({
            id: user.id,
            nama: user.nama,
            email: user.email,
            role: user.role,
            password: "",
            confirmPassword: "",
            permissionIds: sanitizePermissionIds(user.permissions.map((permission) => permission.id)),
        });
        setIsEditPanelOpen(true);
        setErrorMessage("");
        setSuccessMessage("");
    };

    const handleSaveEditUser = async () => {
        if (!editingUser.nama.trim() || !editingUser.email.trim()) {
            setErrorMessage("Nama dan email user wajib diisi.");
            setSuccessMessage("");
            return;
        }

        if (editingUser.password && editingUser.password.length < 8) {
            setErrorMessage("Password user minimal 8 karakter.");
            setSuccessMessage("");
            return;
        }

        if (editingUser.password !== editingUser.confirmPassword) {
            setErrorMessage("Konfirmasi password user tidak sama.");
            setSuccessMessage("");
            return;
        }

        try {
            setSavingEditUser(true);
            setErrorMessage("");
            setSuccessMessage("");

            await api.put(`/users/${editingUser.id}`, {
                nama: editingUser.nama.trim(),
                email: editingUser.email.trim(),
                role: normalizeRoleForApi(editingUser.role),
                password: editingUser.password || undefined,
                ...(!isSuperAdminRole(editingUser.role) ? { permission_ids: sanitizePermissionIds(editingUser.permissionIds) } : {}),
            });

            await loadUserManagementData();
            setIsEditPanelOpen(false);
            setEditingUser(emptyEditUser);
            setSuccessMessage("Hak akses user berhasil diperbarui.");
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, "Gagal memperbarui user."));
        } finally {
            setSavingEditUser(false);
        }
    };

    const handleDeleteUser = async (user: ManagedUser) => {
        if (user.id === currentUserId) {
            setErrorMessage("Akun yang sedang login tidak bisa dihapus.");
            setSuccessMessage("");
            return;
        }

        const confirmed = window.confirm(`Hapus user "${user.nama}" (${user.email})?`);
        if (!confirmed) {
            return;
        }

        try {
            setDeletingUserId(user.id);
            setErrorMessage("");
            setSuccessMessage("");

            await api.delete(`/users/${user.id}`);

            if (isEditPanelOpen && editingUser.id === user.id) {
                setIsEditPanelOpen(false);
                setEditingUser(emptyEditUser);
            }

            await loadUserManagementData();
            setSuccessMessage("User berhasil dihapus.");
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, "Gagal menghapus user."));
        } finally {
            setDeletingUserId(null);
        }
    };

    const getPermissionCount = (user: ManagedUser): string => {
        if (isSuperAdminRole(user.role)) {
            return "Semua akses";
        }

        const groupCount = new Set(user.permissions.map((permission) => permission.code.split(".")[0])).size;
        return `${groupCount} grup / ${user.permissions.length} permission`;
    };

    const permissionIdByCode = permissionGroups
        .flatMap((group) => group.permissions)
        .reduce<Record<string, number>>((acc, permission) => {
            acc[permission.code] = permission.id;
            return acc;
        }, {});

    const allPermissionIds = Array.from(MATRIX_PERMISSION_CODES)
        .map((code) => permissionIdByCode[code])
        .filter((id): id is number => typeof id === "number");

    const visiblePermissionIdSet = new Set(allPermissionIds);
    const sanitizePermissionIds = (ids: number[]): number[] =>
        ids.filter((id) => visiblePermissionIdSet.has(id));

    const resolvePermissionId = (code?: string): number | null => {
        if (!code) {
            return null;
        }

        const permissionId = permissionIdByCode[code];
        return typeof permissionId === "number" ? permissionId : null;
    };

    const isCodeChecked = (ids: number[], code?: string): boolean => {
        const permissionId = resolvePermissionId(code);
        return permissionId !== null ? ids.includes(permissionId) : false;
    };

    const toggleByCode = (ids: number[], code?: string): number[] => {
        const permissionId = resolvePermissionId(code);
        if (permissionId === null) {
            return ids;
        }

        return togglePermission(ids, permissionId);
    };

    const renderPermissionMatrix = (
        ids: number[],
        onChange: (nextIds: number[]) => void
    ) => (
        <div className="rounded-md border">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left">Nama Menu</th>
                            <th className="px-3 py-2 text-center">Lihat</th>
                            <th className="px-3 py-2 text-center">Tambah</th>
                            <th className="px-3 py-2 text-center">Edit</th>
                            <th className="px-3 py-2 text-center">Hapus</th>
                        </tr>
                    </thead>
                    {PERMISSION_MATRIX_SECTIONS.map((section) => (
                        <tbody key={section.title}>
                                <tr className="border-t bg-gray-50/60">
                                    <td colSpan={5} className="px-3 py-2 font-semibold">
                                        {section.title}
                                    </td>
                                </tr>
                                {section.items.map((item) => (
                                    <tr key={`${section.title}-${item.label}`} className="border-t">
                                        <td className="px-3 py-2">{item.label}</td>
                                        <td className="px-3 py-2 text-center">
                                            {resolvePermissionId(item.viewCode) !== null ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isCodeChecked(ids, item.viewCode)}
                                                    onChange={() => onChange(toggleByCode(ids, item.viewCode))}
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {resolvePermissionId(item.createCode) !== null ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isCodeChecked(ids, item.createCode)}
                                                    onChange={() => onChange(toggleByCode(ids, item.createCode))}
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {resolvePermissionId(item.updateCode) !== null ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isCodeChecked(ids, item.updateCode)}
                                                    onChange={() => onChange(toggleByCode(ids, item.updateCode))}
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {resolvePermissionId(item.deleteCode) !== null ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isCodeChecked(ids, item.deleteCode)}
                                                    onChange={() => onChange(toggleByCode(ids, item.deleteCode))}
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    ))}
                </table>
            </div>
            <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Permission sudah granular per menu dan per aksi. Centang tiap kolom bisa diatur terpisah.
            </div>
        </div>
    );

    const filteredUsers = managedUsers.filter((user) => {
        const keyword = userSearch.trim().toLowerCase();
        if (keyword === "") {
            return true;
        }

        const roleText = formatRoleLabel(user.role).toLowerCase();
        return (
            user.nama.toLowerCase().includes(keyword) ||
            user.email.toLowerCase().includes(keyword) ||
            roleText.includes(keyword)
        );
    });

    const sortedUsers = useMemo(() => {
        const rows = [...filteredUsers];

        rows.sort((a, b) => {
            const aValue =
                userSortField === "no"
                    ? String(a.id)
                    : userSortField === "role"
                      ? formatRoleLabel(a.role).toLowerCase()
                      : String(a[userSortField]).toLowerCase();
            const bValue =
                userSortField === "no"
                    ? String(b.id)
                    : userSortField === "role"
                      ? formatRoleLabel(b.role).toLowerCase()
                      : String(b[userSortField]).toLowerCase();

            if (userSortOrder === "asc") {
                return aValue.localeCompare(bValue, undefined, { numeric: true });
            }

            return bValue.localeCompare(aValue, undefined, { numeric: true });
        });

        return rows;
    }, [filteredUsers, userSortField, userSortOrder]);

    const handleUserSort = (field: UserSortField) => {
        if (userSortField === field) {
            setUserSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setUserSortField(field);
        setUserSortOrder("asc");
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-500 text-sm">Kelola akun aktif, tambah user, dan atur hak akses.</p>
            </div>

            {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            {successMessage ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {successMessage}
                </div>
            ) : null}

            <div className={`grid gap-6 ${currentRole === "superadmin" ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Akun Saya</h2>
                    {loading ? <p className="text-sm text-gray-500">Memuat data akun...</p> : null}

                    <div>
                        <label className="text-sm font-medium">Nama</label>
                        <input
                            value={profileForm.nama}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, nama: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            value={profileForm.email}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Password Baru</label>
                        <input
                            type="password"
                            placeholder="Kosongkan jika tidak ingin mengubah"
                            value={profileForm.password}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={profileForm.confirmPassword}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => void handleSaveProfile()}
                            disabled={!mounted || savingProfile || loading}
                            className="px-4 py-2 bg-blue-700 text-white rounded-md disabled:opacity-50"
                        >
                            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>

                {currentRole === "superadmin" ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Tambah Akun</h2>

                    <div>
                        <label className="text-sm font-medium">Nama</label>
                        <input
                            value={createUserForm.nama}
                            onChange={(e) => {
                                setCreateUserForm((prev) => ({ ...prev, nama: e.target.value }));
                                setCreateUserFieldErrors((prev) => ({ ...prev, nama: "" }));
                            }}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Nama user baru"
                        />
                        {createUserFieldErrors.nama ? (
                            <p className="mt-1 text-xs text-red-600">{createUserFieldErrors.nama}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            value={createUserForm.email}
                            onChange={(e) => {
                                setCreateUserForm((prev) => ({ ...prev, email: e.target.value }));
                                setCreateUserFieldErrors((prev) => ({ ...prev, email: "" }));
                            }}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Email user baru"
                        />
                        {createUserFieldErrors.email ? (
                            <p className="mt-1 text-xs text-red-600">{createUserFieldErrors.email}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            value={createUserForm.role}
                            onChange={(e) => {
                                const nextRole = e.target.value;
                                setCreateUserForm((prev) => ({ ...prev, role: nextRole }));
                                if (isSuperAdminRole(nextRole)) {
                                    setCreatePermissionIds([]);
                                }
                            }}
                            className="w-full border p-2 rounded-md mt-1"
                        >
                            {roleOptions.map((roleOption) => (
                                <option key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isSuperAdminRole(createUserForm.role) ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium">Permission Fitur</div>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setCreatePermissionIds(allPermissionIds)}
                                        className="text-blue-700 hover:underline"
                                    >
                                        Pilih semua fitur
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreatePermissionIds([])}
                                        className="text-gray-600 hover:underline"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            {permissionGroups.length === 0 ? (
                                <div className="text-sm text-gray-500 rounded-md border p-3">
                                    Data permission belum tersedia. Klik refresh, lalu coba lagi.
                                </div>
                            ) : (
                                renderPermissionMatrix(createPermissionIds, setCreatePermissionIds)
                            )}
                        </div>
                    ) : null}

                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => {
                                setCreateUserForm((prev) => ({ ...prev, password: e.target.value }));
                                setCreateUserFieldErrors((prev) => ({ ...prev, password: "" }));
                            }}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Minimal 8 karakter"
                        />
                        {createUserFieldErrors.password ? (
                            <p className="mt-1 text-xs text-red-600">{createUserFieldErrors.password}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={createUserForm.confirmPassword}
                            onChange={(e) =>
                                {
                                    setCreateUserForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                                    setCreateUserFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                                }
                            }
                            className="w-full border p-2 rounded-md mt-1"
                        />
                        {createUserFieldErrors.confirmPassword ? (
                            <p className="mt-1 text-xs text-red-600">{createUserFieldErrors.confirmPassword}</p>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => void handleCreateUser()}
                            disabled={savingUser}
                            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
                        >
                            {savingUser ? "Menyimpan..." : "Tambah Akun"}
                        </button>
                    </div>
                </div>
                ) : null}
            </div>

            {currentRole === "superadmin" ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Daftar User</h2>
                        <div className="flex items-center gap-2">
                            <input
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Cari nama/email/role..."
                                className="w-64 max-w-full rounded-md border px-3 py-1.5 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => void loadUserManagementData()}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {loadingUserManagement ? (
                        <p className="text-sm text-gray-500">Memuat daftar user...</p>
                    ) : null}

                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleUserSort("no")}
                                            className="inline-flex items-center gap-2 font-semibold"
                                        >
                                            No
                                            <ArrowUpDown size={14} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <button
                                            type="button"
                                            onClick={() => handleUserSort("nama")}
                                            className="inline-flex items-center gap-2 font-semibold"
                                        >
                                            Nama
                                            <ArrowUpDown size={14} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <button
                                            type="button"
                                            onClick={() => handleUserSort("email")}
                                            className="inline-flex items-center gap-2 font-semibold"
                                        >
                                            Email
                                            <ArrowUpDown size={14} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        <button
                                            type="button"
                                            onClick={() => handleUserSort("role")}
                                            className="inline-flex items-center gap-2 font-semibold"
                                        >
                                            Role
                                            <ArrowUpDown size={14} />
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-left">Jumlah Permission</th>
                                    <th className="px-3 py-2 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="px-3 py-2 text-center">{user.id}</td>
                                        <td className="px-3 py-2">{user.nama}</td>
                                        <td className="px-3 py-2">{user.email}</td>
                                        <td className="px-3 py-2">
                                            {formatRoleLabel(user.role)}
                                        </td>
                                        <td className="px-3 py-2">{getPermissionCount(user)}</td>
                                        <td className="px-3 py-2">
                                            {user.id === currentUserId ? (
                                                <span className="text-xs text-gray-500">Kelola di Akun Saya</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditUser(user)}
                                                        className="px-3 py-1.5 text-xs rounded-md bg-blue-700 text-white"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDeleteUser(user)}
                                                        disabled={deletingUserId === user.id}
                                                        className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white disabled:opacity-50"
                                                    >
                                                        {deletingUserId === user.id ? "Menghapus..." : "Hapus"}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {sortedUsers.length === 0 && !loadingUserManagement ? (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                                            User tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {currentRole === "superadmin" && isEditPanelOpen ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Edit Hak Akses User</h2>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Nama</label>
                            <input
                                value={editingUser.nama}
                                onChange={(e) => setEditingUser((prev) => ({ ...prev, nama: e.target.value }))}
                                className="w-full border p-2 rounded-md mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <input
                                value={editingUser.email}
                                onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full border p-2 rounded-md mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            value={editingUser.role}
                            onChange={(e) => {
                                const nextRole = e.target.value;
                                setEditingUser((prev) => ({
                                    ...prev,
                                    role: nextRole,
                                    permissionIds: isSuperAdminRole(nextRole) ? [] : prev.permissionIds,
                                }));
                            }}
                            className="w-full border p-2 rounded-md mt-1"
                        >
                            {roleOptions.map((roleOption) => (
                                <option key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isSuperAdminRole(editingUser.role) ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium">Permission Fitur</div>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingUser((prev) => ({
                                                ...prev,
                                                permissionIds: allPermissionIds,
                                            }))
                                        }
                                        className="text-blue-700 hover:underline"
                                    >
                                        Pilih semua fitur
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingUser((prev) => ({
                                                ...prev,
                                                permissionIds: [],
                                            }))
                                        }
                                        className="text-gray-600 hover:underline"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            {permissionGroups.length === 0 ? (
                                <div className="text-sm text-gray-500 rounded-md border p-3">
                                    Data permission belum tersedia. Klik refresh, lalu coba lagi.
                                </div>
                            ) : (
                                renderPermissionMatrix(editingUser.permissionIds, (nextIds) =>
                                    setEditingUser((prev) => ({
                                        ...prev,
                                        permissionIds: nextIds,
                                    }))
                                )
                            )}
                        </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Password Baru (opsional)</label>
                            <input
                                type="password"
                                value={editingUser.password}
                                onChange={(e) =>
                                    setEditingUser((prev) => ({ ...prev, password: e.target.value }))
                                }
                                className="w-full border p-2 rounded-md mt-1"
                                placeholder="Kosongkan jika tidak diubah"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={editingUser.confirmPassword}
                                onChange={(e) =>
                                    setEditingUser((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                                className="w-full border p-2 rounded-md mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditPanelOpen(false);
                                setEditingUser(emptyEditUser);
                            }}
                            className="px-4 py-2 rounded-md border border-gray-300"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSaveEditUser()}
                            disabled={savingEditUser}
                            className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                        >
                            {savingEditUser ? "Menyimpan..." : "Simpan Hak Akses"}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

