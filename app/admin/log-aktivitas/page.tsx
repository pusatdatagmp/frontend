"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import api from "@/lib/api";
import {
    extractErrorMessage,
    type ApiListResponse,
    type Meta,
} from "@/lib/transaksiPembelian";

type ActivityLog = {
    id: number;
    user_id: number | null;
    user_name: string | null;
    module: string;
    action: string;
    method: string;
    request_path: string;
    description: string;
    metadata?: {
        route_parameters?: Record<string, unknown>;
        payload?: Record<string, unknown>;
    } | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
};

const initialMeta: Meta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
};

function formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function Page() {
    const [data, setData] = useState<ActivityLog[]>([]);
    const [meta, setMeta] = useState<Meta>(initialMeta);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<"id" | "created_at" | "user_name" | "module" | "action">("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get<ApiListResponse<ActivityLog>>("/activity-logs", {
                params: {
                    search: search || undefined,
                    sort_field: sortField,
                    sort_order: sortOrder,
                    page: currentPage,
                    per_page: perPage,
                },
            });

            setData(response.data.data ?? []);
            setMeta(response.data.meta ?? initialMeta);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setCurrentPage(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, sortField, sortOrder, currentPage]);

    const handleSort = (field: "id" | "created_at" | "user_name" | "module" | "action") => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortOrder(field === "created_at" ? "desc" : "asc");
        setCurrentPage(1);
    };

    const totalPages = useMemo(() => Math.max(meta.last_page || 1, 1), [meta.last_page]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Log Aktivitas</h1>
            </div>

            {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
                <input
                    placeholder="Cari user, modul, aktivitas, atau path..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="w-full max-w-md rounded-md border bg-white p-2 shadow"
                />

                <div className="rounded-md border border-primary/20 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
                    Total log: <span className="font-semibold text-primary">{meta.total}</span>
                </div>
            </div>

            <div className="overflow-auto rounded-lg bg-white/70 shadow backdrop-blur-lg">
                <table className="w-full text-sm">
                    <thead className="bg-white shadow-lg">
                        <tr>
                            <th className="p-3">
                                <button onClick={() => handleSort("id")} className="flex items-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("created_at")} className="flex items-center gap-2">
                                    Waktu <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("user_name")} className="flex items-center gap-2">
                                    User <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("module")} className="flex items-center gap-2">
                                    Modul <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">
                                <button onClick={() => handleSort("action")} className="flex items-center gap-2">
                                    Aktivitas <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="p-3">Path</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!loading && data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    Belum ada log aktivitas yang cocok dengan pencarian.
                                </td>
                            </tr>
                        ) : null}

                        {data.map((item) => (
                            <tr key={item.id} className="border-t border-primary/20 hover:bg-white/50">
                                <td className="p-3 text-center align-top">{item.id}</td>
                                <td className="p-3 whitespace-nowrap align-top">{formatDateTime(item.created_at)}</td>
                                <td className="p-3 align-top">{item.user_name || "-"}</td>
                                <td className="p-3 align-top">{item.module}</td>
                                <td className="p-3 align-top">
                                    <div className="space-y-1">
                                        <div className="font-medium text-primary">{item.action}</div>
                                        <div className="text-gray-600">{item.description}</div>
                                    </div>
                                </td>
                                <td className="p-3 align-top text-gray-600">{item.request_path}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    disabled={Boolean((meta.current_page || 1) === 1 || loading)}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="rounded-md border px-3 py-1"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        disabled={Boolean(loading)}
                        className={`rounded-md border px-3 py-1 ${meta.current_page === index + 1 ? "bg-primary text-white" : ""}`}
                    >
                        {index + 1}
                    </button>
                ))}

                <button
                    disabled={Boolean((meta.current_page || 1) === totalPages || totalPages === 0 || loading)}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="rounded-md border px-3 py-1"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
