"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import axios from "axios";

type LoginRole = "admin" | "superadmin";

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
    role: LoginRole;
};

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

const normalizeRoleToLogin = (role: string): LoginRole =>
    role === "superadmin" || role === "super_admin" ? "superadmin" : "admin";

const normalizeRoleToApi = (role: LoginRole): "admin" | "superadmin" =>
    role === "superadmin" ? "superadmin" : "admin";

export default function Page() {
    const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
    const [createUserForm, setCreateUserForm] = useState<CreateUserForm>(emptyCreateUser);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentRole, setCurrentRole] = useState<LoginRole>("admin");
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

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

                const loginRole = normalizeRoleToLogin(String(user.role ?? "admin"));
                setCurrentUserId(Number(user.id));
                setCurrentRole(loginRole);
                setProfileForm({
                    nama: String(user.nama ?? ""),
                    email: String(user.email ?? ""),
                    password: "",
                    confirmPassword: "",
                });
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setErrorMessage(error.response?.data?.message ?? "Gagal memuat data settings.");
                    return;
                }
                setErrorMessage("Gagal memuat data settings.");
            } finally {
                setLoading(false);
            }
        };

        void bootstrap();
    }, []);

    const handleSaveProfile = async () => {
        if (!currentUserId) return;

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

            await api.put(`/users/${currentUserId}`, {
                nama: profileForm.nama.trim(),
                email: profileForm.email.trim(),
                role: normalizeRoleToApi(currentRole),
                password: profileForm.password || undefined,
            });

            setProfileForm((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));
            setSuccessMessage("Akun kamu berhasil diperbarui.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiErrors = error.response?.data?.errors;
                if (apiErrors && typeof apiErrors === "object") {
                    const firstKey = Object.keys(apiErrors)[0];
                    const firstMessage = apiErrors[firstKey]?.[0];
                    if (typeof firstMessage === "string") {
                        setErrorMessage(firstMessage);
                        return;
                    }
                }
                setErrorMessage(error.response?.data?.message ?? "Gagal memperbarui akun.");
                return;
            }
            setErrorMessage("Gagal memperbarui akun.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCreateUser = async () => {
        if (!createUserForm.nama.trim() || !createUserForm.email.trim()) {
            setErrorMessage("Nama dan email akun baru wajib diisi.");
            setSuccessMessage("");
            return;
        }

        if (createUserForm.password.length < 8) {
            setErrorMessage("Password akun baru minimal 8 karakter.");
            setSuccessMessage("");
            return;
        }

        if (createUserForm.password !== createUserForm.confirmPassword) {
            setErrorMessage("Konfirmasi password akun baru tidak sama.");
            setSuccessMessage("");
            return;
        }

        try {
            setSavingUser(true);
            setErrorMessage("");
            setSuccessMessage("");

            await api.post("/users", {
                nama: createUserForm.nama.trim(),
                email: createUserForm.email.trim(),
                password: createUserForm.password,
                role: normalizeRoleToApi(createUserForm.role),
            });

            setCreateUserForm(emptyCreateUser);
            setSuccessMessage("Akun baru berhasil ditambahkan.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiErrors = error.response?.data?.errors;
                if (apiErrors && typeof apiErrors === "object") {
                    const firstKey = Object.keys(apiErrors)[0];
                    const firstMessage = apiErrors[firstKey]?.[0];
                    if (typeof firstMessage === "string") {
                        setErrorMessage(firstMessage);
                        return;
                    }
                }
                setErrorMessage(error.response?.data?.message ?? "Gagal menambah akun baru.");
                return;
            }
            setErrorMessage("Gagal menambah akun baru.");
        } finally {
            setSavingUser(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-500 text-sm">Kelola akun aktif dan tambah akun baru.</p>
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

            <div className="grid gap-6 lg:grid-cols-2">
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
                            disabled={savingProfile || loading}
                            className="px-4 py-2 bg-blue-700 text-white rounded-md disabled:opacity-50"
                        >
                            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Tambah Akun</h2>

                    <div>
                        <label className="text-sm font-medium">Nama</label>
                        <input
                            value={createUserForm.nama}
                            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, nama: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Nama user baru"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            value={createUserForm.email}
                            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Email user baru"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Masuk Sebagai</label>
                        <select
                            value={createUserForm.role}
                            onChange={(e) =>
                                setCreateUserForm((prev) => ({ ...prev, role: e.target.value as LoginRole }))
                            }
                            className="w-full border p-2 rounded-md mt-1"
                        >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))}
                            className="w-full border p-2 rounded-md mt-1"
                            placeholder="Minimal 8 karakter"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={createUserForm.confirmPassword}
                            onChange={(e) =>
                                setCreateUserForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                            }
                            className="w-full border p-2 rounded-md mt-1"
                        />
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
            </div>
        </div>
    );
}

