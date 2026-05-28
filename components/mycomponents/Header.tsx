"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Menu, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function Header({ onToggle }: { onToggle: () => void }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setNama(parsed.nama || parsed.name || "User");
      } catch (error) {
        console.error("Invalid user data:", error);
        setNama("User");
      }
    }
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin ingin logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      router.push("/login");
    }
  };

  return (
    <header className="h-16 bg-white  flex items-center justify-between px-6">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button onClick={onToggle}>
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-lg">
          {user?.role}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* 🔥 FIX: pakai nama */}
        <p>Hi, {nama || "User"}</p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <User className="w-8 h-8 p-2 rounded-full cursor-pointer bg-gray-200 text-primary" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => router.push("/admin/settings")}
            >
              <Settings size={16} />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-500"
            >
              <LogOut size={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}