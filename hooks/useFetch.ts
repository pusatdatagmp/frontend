import { useEffect, useState } from "react";
import api from "@/lib/api";

export function useFetch<T>(url: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get(url);
            setData(res.data.data ?? res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [url]);

    return { data, loading, refetch: fetchData };
}