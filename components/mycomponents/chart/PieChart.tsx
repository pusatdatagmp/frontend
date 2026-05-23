"use client"

import { useMemo, useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts"

type Sale = {
    id: number
    sppg: string
    tanggal: string
    total: number
    dibayar: number
    status: string
}

const salesData: Sale[] = [
    {
        id: 1,
        sppg: "SPPG A",
        tanggal: "2026-04-01",
        total: 12000000,
        dibayar: 7000000,
        status: "belum_lunas"
    },
    {
        id: 2,
        sppg: "SPPG B",
        tanggal: "2026-04-03",
        total: 8000000,
        dibayar: 2000000,
        status: "belum_lunas"
    },
    {
        id: 3,
        sppg: "SPPG C",
        tanggal: "2026-04-05",
        total: 9000000,
        dibayar: 4000000,
        status: "belum_lunas"
    },
    {
        id: 4,
        sppg: "SPPG A",
        tanggal: "2026-04-08",
        total: 5000000,
        dibayar: 1000000,
        status: "belum_lunas"
    },
    {
        id: 5,
        sppg: "SPPG B",
        tanggal: "2026-05-10",
        total: 15000000,
        dibayar: 7000000,
        status: "belum_lunas"
    },
]

const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6"
]

export default function PiutangSPPGChart() {

    const [filter, setFilter] = useState<
        "harian" | "bulanan" | "tahunan"
    >("bulanan")

    // contoh tanggal untuk mode harian
    const [selectedDate] =
        useState("2026-04-05")


    const filtered = useMemo(() => {

        return salesData.filter(item => {

            if (item.status === "lunas") return false

            const d = new Date(item.tanggal)

            if (filter === "harian") {
                return (
                    d.toISOString().slice(0, 10)
                    === selectedDate
                )
            }

            if (filter === "bulanan") {
                return (
                    d.getMonth() === 3 &&
                    d.getFullYear() === 2026
                )
            }

            if (filter === "tahunan") {
                return d.getFullYear() === 2026
            }

            return true

        })

    }, [filter, selectedDate])



    const pieData = useMemo(() => {

        const grouped: Record<string, number> = {}

        filtered.forEach(item => {

            const outstanding =
                item.total - item.dibayar

            grouped[item.sppg] =
                (grouped[item.sppg] || 0)
                + outstanding

        })

        return Object.entries(grouped).map(
            ([name, value]) => ({
                name,
                value
            })
        )

    }, [filtered])



    const totalPiutang =
        pieData.reduce(
            (sum, row) => sum + row.value,
            0
        )


    const rupiah = (n: number) =>
        new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        ).format(n)



    return (
        <Card className="rounded-2xl bg-white/30 backdrop-blur-2xl">

            <CardHeader className="flex flex-row items-center justify-between">

                <div>
                    <CardTitle className="text-white">
                        Total Piutang Global
                    </CardTitle>

                    <p className="text-sm text-white mt-1">
                        Piutang penjualan belum lunas per SPPG
                    </p>
                </div>


                <div className="flex gap-2">
                    {["harian", "bulanan", "tahunan"].map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={
                                filter === item
                                    ? "default"
                                    : "outline"
                            }
                            onClick={() => setFilter(
                                item as
                                "harian" |
                                "bulanan" |
                                "tahunan"
                            )}
                        >
                            {item}
                        </Button>
                    ))}
                </div>

            </CardHeader>



            <CardContent>

                <div className="mb-8">
                    <h2 className="text-4xl font-bold text-white">
                        {rupiah(totalPiutang)}
                    </h2>

                    <p className="text-white mt-2 capitalize">
                        Outstanding mode {filter}
                    </p>
                </div>



                <div className="grid md:grid-cols-2 gap-2 items-center">

                    {/* Pie */}
                    <div className="h-[340px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <PieChart>

                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={4}
                                    label={({ percent }) =>
                                        `${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {pieData.map((_, index) => (
                                        <Cell
                                            key={index}
                                            fill={
                                                COLORS[
                                                index % COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) =>
                                        rupiah(Number(value))
                                    }
                                />

                            </PieChart>
                        </ResponsiveContainer>
                    </div>



                    {/* Breakdown */}
                    <div className="space-y-4">

                        {pieData.map((item, index) => {

                            const pct =
                                totalPiutang
                                    ? (item.value / totalPiutang) * 100
                                    : 0

                            return (
                                <div
                                    key={item.name}
                                    className="rounded-xl bg-white p-4 flex justify-between"
                                >

                                    <div className="flex items-center gap-3">

                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{
                                                background:
                                                    COLORS[index]
                                            }}
                                        />

                                        <div>
                                            <p className="font-medium">
                                                {item.name}
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                {pct.toFixed(1)}%
                                            </p>
                                        </div>

                                    </div>

                                    <p className="font-semibold">
                                        {rupiah(item.value)}
                                    </p>

                                </div>
                            )

                        })}

                    </div>


                </div>

            </CardContent>

        </Card>
    )
}
