"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        role,
      });

      const data = res.data;

      // ✅ simpan token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-semibold">Login</h2>
      <p className="text-sm opacity-80">
        Login untuk melanjutkan ke sistem GMP.
      </p>

      {/* ROLE */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("admin")}
          className={`p-4 rounded-xl border ${role === "admin"
            ? "border-primary bg-primary/10"
            : ""
            }`}
        >
          <UserCog className="w-6 h-6 mb-2" />
          Admin
        </button>

        <button
          type="button"
          onClick={() => setRole("superadmin")}
          className={`p-4 rounded-xl border ${role === "superadmin"
            ? "border-primary bg-primary/10"
            : ""
            }`}
        >
          <Shield className="w-6 h-6 mb-2" />
          Super Admin
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full py-6 text-lg"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </Button>
      </form>
    </div>
  );
}