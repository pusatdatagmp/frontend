"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
    AreaChart,
    Area,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer
} from "recharts"

const datasets = {
    harian: [
        { label: "Sen", debit: 1200, kredit: 900 },
        { label: "Sel", debit: 1800, kredit: 1100 },
        { label: "Rab", debit: 1500, kredit: 1300 },
        { label: "Kam", debit: 2400, kredit: 1700 },
        { label: "Jum", debit: 2100, kredit: 1600 },
        { label: "Sab", debit: 2800, kredit: 2200 },
        { label: "Min", debit: 2500, kredit: 2000 },
    ],

    bulanan: [
        { label: "Jan", debit: 12000, kredit: 9500 },
        { label: "Feb", debit: 15500, kredit: 11000 },
        { label: "Mar", debit: 17000, kredit: 13200 },
        { label: "Apr", debit: 21000, kredit: 16000 },
        { label: "Mei", debit: 23000, kredit: 18000 },
        { label: "Jun", debit: 25000, kredit: 19200 },
    ],

    tahunan: [
        { label: "2021", debit: 140000, kredit: 110000 },
        { label: "2022", debit: 175000, kredit: 136000 },
        { label: "2023", debit: 220000, kredit: 184000 },
        { label: "2024", debit: 260000, kredit: 210000 },
    ],
}

export default function CashflowCard() {
    const [filter, setFilter] = useState<
        "harian" | "bulanan" | "tahunan"
    >("harian")

    const data = datasets[filter]

    const totalDebit = data.reduce(
        (a, b) => a + b.debit, 0
    )

    const totalKredit = data.reduce(
        (a, b) => a + b.kredit, 0
    )

    const saldo = totalDebit - totalKredit

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
        <Card className="rounded-2xl bg-white border">
            <CardHeader className="flex flex-row items-center justify-between">

                <div>
                    <CardTitle>
                        Cashflow
                    </CardTitle>

                    <p className="text-sm text-muted-foreground mt-1">
                        Arus kas masuk & keluar
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

            <CardContent className="space-y-6">

                {/* Summary */}
                <div className="grid md:grid-cols-3 gap-4">

                    <div className="rounded-xl bg-green-50 p-4">
                        <p className="text-sm text-muted-foreground">
                            Debet
                        </p>
                        <h3 className="text-xl font-semibold text-green-600 mt-2">
                            {rupiah(totalDebit)}
                        </h3>
                    </div>

                    <div className="rounded-xl bg-red-50 p-4">
                        <p className="text-sm text-muted-foreground">
                            Kredit
                        </p>
                        <h3 className="text-xl font-semibold text-red-500 mt-2">
                            {rupiah(totalKredit)}
                        </h3>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-sm text-muted-foreground">
                            Saldo
                        </p>
                        <h3 className="text-xl font-semibold text-blue-600 mt-2">
                            {rupiah(saldo)}
                        </h3>
                    </div>

                </div>


                {/* Chart */}
                <div className="h-[350px]">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient
                                    id="debitFill"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#22c55e"
                                        stopOpacity={0.5}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#22c55e"
                                        stopOpacity={0}
                                    />
                                </linearGradient>

                                <linearGradient
                                    id="kreditFill"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#3b82f6"
                                        stopOpacity={0.5}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#3b82f6"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="label" />

                            <YAxis />

                            <Tooltip />

                            <Area
                                type="monotone"
                                dataKey="debit"
                                stroke="#22c55e"
                                fill="url(#debitFill)"
                                strokeWidth={3}
                            />

                            <Area
                                type="monotone"
                                dataKey="kredit"
                                stroke="#3b82f6"
                                fill="url(#kreditFill)"
                                strokeWidth={3}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>

            </CardContent>
        </Card>
    )
}