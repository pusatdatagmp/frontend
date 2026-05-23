"use client";

import { useState } from "react";

export default function Page() {
    const [form, setForm] = useState({
        nama: "Syahril",
        email: "syahril@mail.com",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = () => {
        if (form.password && form.password !== form.confirmPassword) {
            alert("Password tidak sama");
            return;
        }

        console.log("Update data:", form);
        alert("Settings berhasil disimpan");
    };

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-500 text-sm">
                    Kelola informasi akun kamu
                </p>
            </div>

            {/* CARD */}
            <div className="bg-white p-6 rounded-lg shadow max-w-xl space-y-4">

                {/* NAMA */}
                <div>
                    <label className="text-sm font-medium">Nama</label>
                    <input
                        value={form.nama}
                        onChange={(e) =>
                            setForm({ ...form, nama: e.target.value })
                        }
                        className="w-full border p-2 rounded-md mt-1"
                    />
                </div>

                {/* EMAIL */}
                <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        className="w-full border p-2 rounded-md mt-1"
                    />
                </div>

                {/* PASSWORD */}
                <div>
                    <label className="text-sm font-medium">Password Baru</label>
                    <input
                        type="password"
                        placeholder="Kosongkan jika tidak ingin mengubah"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        className="w-full border p-2 rounded-md mt-1"
                    />
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                    <label className="text-sm font-medium">Konfirmasi Password</label>
                    <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                            setForm({ ...form, confirmPassword: e.target.value })
                        }
                        className="w-full border p-2 rounded-md mt-1"
                    />
                </div>

                {/* ACTION */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-700 text-white rounded-md"
                    >
                        Simpan Perubahan
                    </button>
                </div>

            </div>
        </div>
    );
}