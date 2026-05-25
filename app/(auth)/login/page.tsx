"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

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
      });

      const data = res.data;

      // ✅ simpan token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/admin");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(typeof err.response?.data?.message === "string" ? err.response.data.message : "Login gagal");
      } else {
        setError("Login gagal");
      }
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
