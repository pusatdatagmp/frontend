"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Pencil, Trash2, Plus, ArrowUpDown, Eye, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { getInvoiceTheme } from "@/lib/invoiceThemes";

type PaymentStatus = "lunas" | "belum lunas";

type InvoiceDetailItem = {
  id: number;
  nama_barang: string;
  qty: number;
  satuan: string;
  harga_satuan: number;
  harga_total: number;
};

type InvoiceRecord = {
  id: number;
  nomor_invoice: string;
  penjualan_id: number;
  no_po: string | null;
  sppg_id: number;
  accounting_id: number | null;
  accounting: string | null;
  bank_rekening_id: number | null;
  nama_bank: string | null;
  no_rek: string | null;
  atas_nama_bank: string | null;
  cabang_bank: string | null;
  perusahaan_id: number | null;
  perusahaan: string | null;
  perusahaan_logo_url?: string | null;
  perusahaan_logo_data_url?: string | null;
  perusahaan_tema_invoice?: string | null;
  sppg: string | null;
  alamat: string | null;
  no_hp: string | null;
  tanggal_kirim: string | null;
  tanggal_invoice: string | null;
  total_tagihan: string;
  status_pembayaran: PaymentStatus;
  detail_items?: InvoiceDetailItem[];
};

type SppgOption = {
  sppg_id: number;
  nama_sppg: string;
  no_po: string | null;
  alamat: string | null;
  no_hp: string | null;
};

type AccountingOption = {
  id: number;
  nama: string;
  jabatan: string;
  status: string;
};

type BankRekeningOption = {
  id: number;
  nama_bank: string;
  no_rek: string;
  atas_nama: string;
  cabang: string;
};

type PerusahaanOption = {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  nama_pic: string;
  tema_invoice: string;
  logo_url: string | null;
};

type FormType = {
  nomor_invoice: string;
  tanggal_kirim: string;
  sppg_id: string;
  accounting_id: string;
  bank_rekening_id: string;
  perusahaan_id: string;
  no_po: string;
  alamat: string;
  no_hp: string;
  tanggal_invoice: string;
  status_pembayaran: PaymentStatus;
};

type MetaType = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const emptyForm: FormType = {
  nomor_invoice: "",
  tanggal_kirim: "",
  sppg_id: "",
  accounting_id: "",
  bank_rekening_id: "",
  perusahaan_id: "",
  no_po: "",
  alamat: "",
  no_hp: "",
  tanggal_invoice: "",
  status_pembayaran: "belum lunas",
};

const formatRupiah = (value: number | string) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;

const formatStatusLabel = (status: PaymentStatus) =>
  status === "lunas" ? "Lunas" : "Belum Lunas";

const formatTanggalIndonesiaPanjang = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const loadImageAsDataUrl = async (imagePath: string) => {
  const response = await fetch(imagePath);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gambar header invoice gagal dimuat."));
    reader.readAsDataURL(blob);
  });
};

const drawInvoiceCornerOrnaments = (doc: jsPDF, temaCode?: string | null) => {
  const theme = getInvoiceTheme(temaCode);
  doc.setFillColor(...theme.primary);
  doc.triangle(126, 0, 210, 0, 210, 29, "F");
  doc.triangle(0, 255, 0, 297, 37, 297, "F");

  doc.setFillColor(...theme.secondary);
  doc.triangle(138, 0, 210, 0, 210, 20, "F");
  doc.triangle(0, 267, 0, 297, 26, 297, "F");

  doc.setFillColor(...theme.accent);
  doc.triangle(157, 0, 210, 0, 210, 11, "F");
  doc.triangle(0, 279, 0, 297, 14, 297, "F");

  doc.setFillColor(242, 242, 242);
  doc.triangle(140, 6, 210, 27, 210, 33, "F");
  doc.triangle(0, 248, 7, 297, 18, 297, "F");
};

const drawInvoicePdfHeader = (
  doc: jsPDF,
  temaCode: string | null | undefined,
  logoImageDataUrl: string,
) => {
  drawInvoiceCornerOrnaments(doc, temaCode);
  const maxWidth = 50;
  const maxHeight = 24;
  let renderWidth = maxWidth;
  let renderHeight = maxHeight;

  try {
    const imageProps = doc.getImageProperties(logoImageDataUrl);
    if (imageProps?.width && imageProps?.height) {
      const scale = Math.min(maxWidth / imageProps.width, maxHeight / imageProps.height);
      renderWidth = imageProps.width * scale;
      renderHeight = imageProps.height * scale;
    }
  } catch {
    renderWidth = maxWidth;
    renderHeight = maxHeight;
  }

  const x = 12;
  const y = 8 + (maxHeight - renderHeight) / 2;
  doc.addImage(logoImageDataUrl, "PNG", x, y, renderWidth, renderHeight);
};

const logUnexpectedError = (error: unknown) => {
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return;
  }

  console.error(error);
};

export default function Page() {
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [meta, setMeta] = useState<MetaType>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<FormType>(emptyForm);
  const [sppgOptions, setSppgOptions] = useState<SppgOption[]>([]);
  const [accountingOptions, setAccountingOptions] = useState<AccountingOption[]>([]);
  const [bankRekeningOptions, setBankRekeningOptions] = useState<BankRekeningOption[]>([]);
  const [perusahaanOptions, setPerusahaanOptions] = useState<PerusahaanOption[]>([]);
  const [masterOptionsLoading, setMasterOptionsLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormType, string>>>({});

  const [editId, setEditId] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailTarget, setDetailTarget] = useState<InvoiceRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"id" | "nomor_invoice" | "no_po" | "sppg" | "alamat" | "no_hp" | "tanggal_kirim" | "tanggal_invoice" | "total_tagihan" | "status_pembayaran">("tanggal_invoice");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/invoice-penjualan", {
        params: {
          search: search || undefined,
          sort_field: sortField === "tanggal_kirim" || sortField === "no_po" || sortField === "sppg" || sortField === "alamat" || sortField === "no_hp"
            ? "tanggal_invoice"
            : sortField,
          sort_order: sortOrder,
          per_page: perPage,
          page: currentPage,
        },
      });

      setData(response.data.data ?? []);
      setMeta(response.data.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
      });
    } catch (error) {
      logUnexpectedError(error);
      setErrorMessage("Data invoice penjualan gagal dimuat.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, sortField, sortOrder]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchInvoices();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchInvoices]);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timeout = window.setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [successMessage, errorMessage]);

  const fetchMasterOptions = useCallback(async () => {
    if (masterOptionsLoading) return;
    if (accountingOptions.length > 0 && bankRekeningOptions.length > 0 && perusahaanOptions.length > 0) return;

    try {
      setMasterOptionsLoading(true);
      const [accountingResponse, bankResponse, perusahaanResponse] = await Promise.all([
        api.get("/invoice-penjualan/opsi-accounting"),
        api.get("/invoice-penjualan/opsi-bank-rekening"),
        api.get("/invoice-penjualan/opsi-perusahaan"),
      ]);

      setAccountingOptions(accountingResponse.data.data ?? []);
      setBankRekeningOptions(bankResponse.data.data ?? []);
      setPerusahaanOptions(perusahaanResponse.data.data ?? []);
    } catch (error) {
      logUnexpectedError(error);
      setErrorMessage("Pilihan form invoice gagal dimuat.");
    } finally {
      setMasterOptionsLoading(false);
    }
  }, [accountingOptions.length, bankRekeningOptions.length, masterOptionsLoading, perusahaanOptions.length]);

  const sortedData = useMemo(() => {
    const rows = [...data];

    rows.sort((a, b) => {
      const getValue = (item: InvoiceRecord) => {
        switch (sortField) {
          case "id":
            return item.id;
          case "no_po":
            return item.no_po ?? "";
          case "sppg":
            return item.sppg ?? "";
          case "alamat":
            return item.alamat ?? "";
          case "no_hp":
            return item.no_hp ?? "";
          case "tanggal_kirim":
            return item.tanggal_kirim ?? "";
          case "total_tagihan":
            return Number(item.total_tagihan);
          default:
            return item[sortField] ?? "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue).toLowerCase();
      const bText = String(bValue).toLowerCase();
      return sortOrder === "asc" ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    return rows;
  }, [data, sortField, sortOrder]);

  const detailItems = detailTarget?.detail_items ?? [];
  const detailGrandTotal = detailItems.reduce((sum, item) => sum + Number(item.harga_total || 0), 0);

  const applySelectedSppg = (selectedId: string, options: SppgOption[]) => {
    const selectedOption = options.find((option) => String(option.sppg_id) === selectedId);

    setForm((prev) => ({
      ...prev,
      sppg_id: selectedId,
      no_po: selectedOption?.no_po ?? "",
      alamat: selectedOption?.alamat ?? "",
      no_hp: selectedOption?.no_hp ?? "",
    }));
  };

  const fetchSppgOptions = async (tanggalKirim: string, preferredSppgId?: string) => {
    if (!tanggalKirim) {
      setSppgOptions([]);
      setForm((prev) => ({
        ...prev,
        sppg_id: "",
        no_po: "",
        alamat: "",
        no_hp: "",
      }));
      return;
    }

    try {
      setOptionLoading(true);
      const response = await api.get("/invoice-penjualan/opsi-sppg", {
        params: { tanggal_kirim: tanggalKirim },
      });

      const options: SppgOption[] = response.data.data ?? [];
      setSppgOptions(options);

      const nextSppgId = preferredSppgId && options.some((option) => String(option.sppg_id) === preferredSppgId)
        ? preferredSppgId
        : options[0]
          ? String(options[0].sppg_id)
          : "";

      applySelectedSppg(nextSppgId, options);
    } catch (error) {
      logUnexpectedError(error);
      setSppgOptions([]);
      setErrorMessage("Pilihan SPPG untuk tanggal kirim tersebut gagal dimuat.");
      setForm((prev) => ({
        ...prev,
        sppg_id: "",
        no_po: "",
        alamat: "",
        no_hp: "",
      }));
    } finally {
      setOptionLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSppgOptions([]);
    setFieldErrors({});
    setEditId(null);
    setOpenForm(false);
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormType, string>> = {};

    if (!form.nomor_invoice.trim()) nextErrors.nomor_invoice = "Nomor invoice wajib diisi.";
    if (!form.tanggal_kirim) nextErrors.tanggal_kirim = "Tanggal kirim wajib diisi.";
    if (!form.sppg_id) nextErrors.sppg_id = "SPPG wajib dipilih.";
    if (!form.accounting_id) nextErrors.accounting_id = "Accounting wajib dipilih.";
    if (!form.bank_rekening_id) nextErrors.bank_rekening_id = "Bank dan rekening wajib dipilih.";
    if (!form.perusahaan_id) nextErrors.perusahaan_id = "Perusahaan wajib dipilih.";
    if (!form.tanggal_invoice) nextErrors.tanggal_invoice = "Tanggal invoice wajib diisi.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setErrorMessage("");

      const payload = {
        nomor_invoice: form.nomor_invoice,
        tanggal_kirim: form.tanggal_kirim,
        sppg_id: Number(form.sppg_id),
        accounting_id: Number(form.accounting_id),
        bank_rekening_id: Number(form.bank_rekening_id),
        perusahaan_id: Number(form.perusahaan_id),
        tanggal_invoice: form.tanggal_invoice,
        status_pembayaran: form.status_pembayaran,
      };

      if (editId !== null) {
        await api.put(`/invoice-penjualan/${editId}`, payload);
        setSuccessMessage("Invoice penjualan berhasil diperbarui.");
      } else {
        await api.post("/invoice-penjualan", payload);
        setSuccessMessage("Invoice penjualan berhasil ditambahkan.");
      }

      resetForm();
      await fetchInvoices();
    } catch (error) {
      logUnexpectedError(error);
      const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const responseErrors = axiosError.response?.data?.errors;
      if (responseErrors && typeof responseErrors === "object") {
        setFieldErrors({
          nomor_invoice: responseErrors.nomor_invoice?.[0],
          tanggal_kirim: responseErrors.tanggal_kirim?.[0],
          sppg_id: responseErrors.sppg_id?.[0],
          accounting_id: responseErrors.accounting_id?.[0],
          bank_rekening_id: responseErrors.bank_rekening_id?.[0],
          perusahaan_id: responseErrors.perusahaan_id?.[0],
          tanggal_invoice: responseErrors.tanggal_invoice?.[0],
          status_pembayaran: responseErrors.status_pembayaran?.[0],
        });
      }

      setErrorMessage(axiosError.response?.data?.message || "Invoice penjualan gagal disimpan.");
    }
  };

  const handleEdit = async (item: InvoiceRecord) => {
    setFieldErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      nomor_invoice: item.nomor_invoice,
      tanggal_kirim: item.tanggal_kirim ?? "",
      sppg_id: item.sppg_id ? String(item.sppg_id) : "",
      accounting_id: item.accounting_id ? String(item.accounting_id) : "",
      bank_rekening_id: item.bank_rekening_id ? String(item.bank_rekening_id) : "",
      perusahaan_id: item.perusahaan_id ? String(item.perusahaan_id) : "",
      no_po: item.no_po ?? "",
      alamat: item.alamat ?? "",
      no_hp: item.no_hp ?? "",
      tanggal_invoice: item.tanggal_invoice ?? "",
      status_pembayaran: item.status_pembayaran,
    });

    await fetchMasterOptions();
    setEditId(item.id);
    setOpenForm(true);
    await fetchSppgOptions(item.tanggal_kirim ?? "", item.sppg_id ? String(item.sppg_id) : "");
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await api.delete(`/invoice-penjualan/${deleteId}`);
      setDeleteId(null);
      setSuccessMessage("Invoice penjualan berhasil dihapus.");
      await fetchInvoices();
    } catch (error) {
      logUnexpectedError(error);
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(axiosError.response?.data?.message || "Invoice penjualan gagal dihapus.");
    }
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/invoice-penjualan/${id}`);
      setDetailTarget(response.data.data ?? null);
    } catch (error) {
      logUnexpectedError(error);
      setErrorMessage("Detail invoice gagal dimuat.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder("asc");
  };

  const handleExportDetailPdf = async () => {
    if (!detailTarget) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const theme = getInvoiceTheme(detailTarget.perusahaan_tema_invoice);
      let logoImage = detailTarget.perusahaan_logo_data_url ?? null;

      if (!logoImage && detailTarget.perusahaan_logo_url) {
        try {
          logoImage = await loadImageAsDataUrl(detailTarget.perusahaan_logo_url);
        } catch {
          logoImage = null;
        }
      }

      if (!logoImage) {
        logoImage = await loadImageAsDataUrl("/invoice-header.png");
      }

      const finalLogoImage = logoImage;
      drawInvoicePdfHeader(doc, detailTarget.perusahaan_tema_invoice, finalLogoImage);

      doc.setFont("times", "bold");
      doc.setFontSize(21);
      doc.setTextColor(...theme.textStrong);
      doc.text("INVOICE", 105, 42, { align: "center" });
      doc.setLineWidth(0.6);
      doc.setDrawColor(...theme.secondary);
      doc.line(88, 44, 122, 44);

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const infoBoxTop = 51;
      const infoBoxLeft = 14;
      const infoBoxWidth = 182;
      const infoBoxMiddleX = 104;
      const lineGap = 7;
      const alamatLines = doc.splitTextToSize(`Alamat: ${detailTarget.alamat ?? "-"}`, 84);
      const leftLines = [
        `Nomor Invoice: ${detailTarget.nomor_invoice}`,
        `No. PO: ${detailTarget.no_po ?? "-"}`,
        `SPPG: ${detailTarget.sppg ?? "-"}`,
        ...alamatLines,
        `No HP: ${detailTarget.no_hp ?? "-"}`,
      ];
      const rightLines = [
        `Tanggal Kirim: ${detailTarget.tanggal_kirim ?? "-"}`,
        `Cheques Payable To: ${detailTarget.perusahaan ?? "-"}`,
        `Nama Bank: ${detailTarget.nama_bank ?? "-"}`,
        `No Rekening: ${detailTarget.no_rek ?? "-"}`,
        `Atas Nama: ${detailTarget.atas_nama_bank ?? "-"}`,
      ];
      const infoBoxHeight = Math.max(leftLines.length, rightLines.length) * lineGap + 6;
        const infoBoxBottom = infoBoxTop + infoBoxHeight;
        const labelPesananY = infoBoxBottom + 10;
        const tableStartY = labelPesananY + 4;

        doc.setLineWidth(0.5);
        doc.setDrawColor(...theme.tableLine);
        doc.rect(infoBoxLeft, infoBoxTop, infoBoxWidth, infoBoxHeight);
        doc.line(infoBoxMiddleX, infoBoxTop, infoBoxMiddleX, infoBoxBottom);
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);

        leftLines.forEach((line, index) => {
          doc.text(line, infoBoxLeft + 2, infoBoxTop + 8 + index * lineGap);
        });

        rightLines.forEach((line, index) => {
          doc.text(line, infoBoxMiddleX + 4, infoBoxTop + 8 + index * lineGap);
        });

        doc.text("Pesanan :", infoBoxLeft + 2, labelPesananY);

      autoTable(doc, {
        startY: tableStartY,
        theme: "grid",
        styles: {
          font: "times",
          fontSize: 10,
          lineColor: theme.tableLine,
          lineWidth: 0.15,
          cellPadding: 2.5,
          textColor: [20, 20, 20],
        },
        headStyles: {
          fillColor: theme.tableHeaderBg,
          textColor: theme.tableHeaderText,
          fontStyle: "bold",
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawInvoicePdfHeader(doc, detailTarget.perusahaan_tema_invoice, finalLogoImage);
          }
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { cellWidth: 64 },
          2: { halign: "center", cellWidth: 16 },
          3: { halign: "center", cellWidth: 20 },
          4: { halign: "center", cellWidth: 34 },
          5: { halign: "center", cellWidth: 34 },
        },
        head: [["No", "Nama Barang", "Qty", "Satuan", "Harga Satuan", "Harga Total"]],
        body: detailItems.map((item, index) => [
          index + 1,
          item.nama_barang,
          item.qty,
          item.satuan,
          formatRupiah(item.harga_satuan),
          formatRupiah(item.harga_total),
        ]),
        foot: [["", "", "", "", "Total", formatRupiah(detailGrandTotal)]],
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [20, 20, 20],
          fontStyle: "bold",
        },
      });

      const tableFinalY = (doc as jsPDF & {
        lastAutoTable?: { finalY?: number };
      }).lastAutoTable?.finalY ?? 92;
      const footerY = Math.min(tableFinalY + 22, 248);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...theme.textStrong);
      doc.text(`Jombang, ${formatTanggalIndonesiaPanjang(detailTarget.tanggal_invoice)}`, 150, footerY, { align: "center" });
      doc.text("Accounting Koperasi", 150, footerY + 8, { align: "center" });
      doc.text(`(${detailTarget.accounting ?? ""})`, 150, footerY + 34, { align: "center" });

      doc.save(`${detailTarget.nomor_invoice}.pdf`);
    } catch (error) {
      logUnexpectedError(error);
      setErrorMessage("Data export invoice gagal dimuat.");
    }
  };

  const totalPages = Math.max(meta.last_page || 1, 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice Penjualan</h1>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <input
          placeholder="Cari nomor invoice..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border p-2 rounded-md w-1/4 bg-white shadow"
        />

        <button
          onClick={async () => {
            resetForm();
            await fetchMasterOptions();
            setOpenForm(true);
          }}
          className="flex items-center gap-2 bg-linear-to-t from-secondary via-primary to-secondary shadow-lg shadow-black/20 text-white px-4 py-2 rounded-lg hover:-translate-y-1 transition cursor-pointer"
        >
          <Plus size={16} />
          Tambah Data
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-white shadow-lg">
            <tr>
              <th className="p-3">
                                <button onClick={() => handleSort("id")} className="flex w-full items-center justify-center gap-2">
                                    No <ArrowUpDown size={14} />
                                </button>
                            </th>
              <th className="p-3">
                <button onClick={() => handleSort("nomor_invoice")} className="flex items-center gap-2">
                  Nomor Invoice <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("no_po")} className="flex items-center gap-2">
                  No. PO <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("sppg")} className="flex items-center gap-2">
                  SPPG <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("alamat")} className="flex items-center gap-2">
                  Alamat <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("no_hp")} className="flex items-center gap-2">
                  No HP <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("tanggal_kirim")} className="flex items-center gap-2">
                  Tanggal Kirim <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("tanggal_invoice")} className="flex items-center gap-2">
                  Tanggal Invoice <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("total_tagihan")} className="flex items-center gap-2">
                  Total Tagihan <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3">
                <button onClick={() => handleSort("status_pembayaran")} className="flex items-center gap-2">
                  Status <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  Memuat data invoice penjualan...
                </td>
              </tr>
            ) : sortedData.length > 0 ? (
              sortedData.map((item) => (
                <tr key={item.id} className="border-t border-primary/20 hover:bg-white/50">
                  <td className="p-3 text-center">{item.id}</td>
                  <td className="p-3">{item.nomor_invoice}</td>
                  <td className="p-3">{item.no_po ?? "-"}</td>
                  <td className="p-3">{item.sppg ?? "-"}</td>
                  <td className="p-3">{item.alamat ?? "-"}</td>
                  <td className="p-3">{item.no_hp ?? "-"}</td>
                  <td className="p-3">{item.tanggal_kirim ?? "-"}</td>
                  <td className="p-3">{item.tanggal_invoice ?? "-"}</td>
                  <td className="p-3">{formatRupiah(item.total_tagihan)}</td>
                  <td className="p-3">{formatStatusLabel(item.status_pembayaran)}</td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => void handleOpenDetail(item.id)}
                      className="p-2 bg-green-500/30 text-green-700 rounded-md"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      onClick={() => void handleEdit(item)}
                      className="p-2 bg-blue-500/30 text-blue-700 rounded-md"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 bg-red-500/30 text-red-700 rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  Belum ada data invoice penjualan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-3 py-1 border rounded-md disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => setCurrentPage(index + 1)}
            className={`px-3 py-1 border rounded-md ${meta.current_page === index + 1 ? "bg-primary text-white" : ""}`}
          >
            {index + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-3 py-1 border rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <AnimatePresence>
        {openForm ? (
          <Modal onClose={resetForm}>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
              <h2 className="text-lg font-semibold">{editId ? "Edit Data" : "Tambah Data"}</h2>
              {masterOptionsLoading ? (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Memuat pilihan accounting, bank, dan perusahaan...
                </div>
              ) : null}

              <div className="space-y-1">
                <input
                  placeholder="Nomor Invoice"
                  value={form.nomor_invoice}
                  onChange={(e) => setForm((prev) => ({ ...prev, nomor_invoice: e.target.value }))}
                  className={`w-full border p-2 rounded-md ${fieldErrors.nomor_invoice ? "border-red-400" : ""}`}
                />
                {fieldErrors.nomor_invoice ? (
                  <p className="text-sm text-red-600">{fieldErrors.nomor_invoice}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <input
                  type="date"
                  value={form.tanggal_kirim}
                  onChange={async (e) => {
                    const nextTanggalKirim = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      tanggal_kirim: nextTanggalKirim,
                      sppg_id: "",
                      no_po: "",
                      alamat: "",
                      no_hp: "",
                    }));
                    await fetchSppgOptions(nextTanggalKirim);
                  }}
                  className={`w-full border p-2 rounded-md ${fieldErrors.tanggal_kirim ? "border-red-400" : ""}`}
                />
                {fieldErrors.tanggal_kirim ? (
                  <p className="text-sm text-red-600">{fieldErrors.tanggal_kirim}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <select
                  value={form.sppg_id}
                  onChange={(e) => applySelectedSppg(e.target.value, sppgOptions)}
                  className={`w-full border p-2 rounded-md ${fieldErrors.sppg_id ? "border-red-400" : ""}`}
                  disabled={!form.tanggal_kirim || optionLoading}
                >
                  <option value="">
                    {optionLoading ? "Memuat pilihan SPPG..." : "Pilih SPPG"}
                  </option>
                  {sppgOptions.map((option) => (
                    <option key={option.sppg_id} value={option.sppg_id}>
                      {option.nama_sppg}
                    </option>
                  ))}
                </select>
                {fieldErrors.sppg_id ? (
                  <p className="text-sm text-red-600">{fieldErrors.sppg_id}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <select
                  value={form.accounting_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, accounting_id: e.target.value }))}
                  className={`w-full border p-2 rounded-md ${fieldErrors.accounting_id ? "border-red-400" : ""}`}
                >
                  <option value="">Pilih Accounting</option>
                  {accountingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.nama}
                    </option>
                  ))}
                </select>
                {fieldErrors.accounting_id ? (
                  <p className="text-sm text-red-600">{fieldErrors.accounting_id}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <select
                  value={form.bank_rekening_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, bank_rekening_id: e.target.value }))}
                  className={`w-full border p-2 rounded-md ${fieldErrors.bank_rekening_id ? "border-red-400" : ""}`}
                >
                  <option value="">Pilih Bank & Rekening</option>
                  {bankRekeningOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.nama_bank} - {option.no_rek} - {option.atas_nama}
                    </option>
                  ))}
                </select>
                {fieldErrors.bank_rekening_id ? (
                  <p className="text-sm text-red-600">{fieldErrors.bank_rekening_id}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <select
                  value={form.perusahaan_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, perusahaan_id: e.target.value }))}
                  className={`w-full border p-2 rounded-md ${fieldErrors.perusahaan_id ? "border-red-400" : ""}`}
                >
                  <option value="">Pilih Perusahaan</option>
                  {perusahaanOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.nama_perusahaan}
                    </option>
                  ))}
                </select>
                {fieldErrors.perusahaan_id ? (
                  <p className="text-sm text-red-600">{fieldErrors.perusahaan_id}</p>
                ) : null}
              </div>

              <input
                value={form.no_po}
                readOnly
                placeholder="No. PO"
                className="w-full border p-2 rounded-md bg-gray-50 text-gray-700"
              />

              <input
                value={form.alamat}
                readOnly
                placeholder="Alamat"
                className="w-full border p-2 rounded-md bg-gray-50 text-gray-700"
              />

              <input
                value={form.no_hp}
                readOnly
                placeholder="No HP"
                className="w-full border p-2 rounded-md bg-gray-50 text-gray-700"
              />

              <div className="space-y-1">
                <input
                  type="date"
                  value={form.tanggal_invoice}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_invoice: e.target.value }))}
                  className={`w-full border p-2 rounded-md ${fieldErrors.tanggal_invoice ? "border-red-400" : ""}`}
                />
                {fieldErrors.tanggal_invoice ? (
                  <p className="text-sm text-red-600">{fieldErrors.tanggal_invoice}</p>
                ) : null}
              </div>

              <select
                value={form.status_pembayaran}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status_pembayaran: e.target.value as PaymentStatus }))
                }
                className="w-full border p-2 rounded-md"
              >
                <option value="belum lunas">Belum Lunas</option>
                <option value="lunas">Lunas</option>
              </select>

              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md">
                  Batal
                </button>
                <button onClick={() => void handleSubmit()} className="px-4 py-2 bg-blue-700 text-white rounded-md">
                  Simpan
                </button>
              </div>
            </motion.div>
          </Modal>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId !== null ? (
          <Modal onClose={() => setDeleteId(null)}>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-sm text-center space-y-4">
              <h2 className="text-lg font-semibold">Hapus Data?</h2>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </Modal>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {detailTarget ? (
          <Modal onClose={() => setDetailTarget(null)}>
            <motion.div className="bg-white rounded-lg p-6 w-full max-w-5xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Detail Invoice</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {detailTarget.nomor_invoice} | {detailTarget.sppg ?? "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleExportDetailPdf()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md"
                  >
                    <FileDown size={16} />
                    Eksport
                  </button>
                  <button
                    onClick={() => setDetailTarget(null)}
                    className="px-4 py-2 bg-gray-200 rounded-md"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">No. PO</p>
                  <p>{detailTarget.no_po ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Alamat</p>
                  <p>{detailTarget.alamat ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">No HP</p>
                  <p>{detailTarget.no_hp ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal Kirim</p>
                  <p>{detailTarget.tanggal_kirim ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal Invoice</p>
                  <p>{detailTarget.tanggal_invoice ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p>{formatStatusLabel(detailTarget.status_pembayaran)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Accounting</p>
                  <p>{detailTarget.accounting ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bank</p>
                  <p>{detailTarget.nama_bank ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">No Rekening</p>
                  <p>{detailTarget.no_rek ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Atas Nama Rekening</p>
                  <p>{detailTarget.atas_nama_bank ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Perusahaan</p>
                  <p>{detailTarget.perusahaan ?? "-"}</p>
                </div>
              </div>

              <div className="overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 border text-center">No</th>
                      <th className="p-3 border text-left">Nama Barang</th>
                      <th className="p-3 border text-center">Qty</th>
                      <th className="p-3 border text-center">Satuan</th>
                      <th className="p-3 border text-center">Harga Satuan</th>
                      <th className="p-3 border text-center">Harga Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLoading ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          Memuat detail invoice...
                        </td>
                      </tr>
                    ) : detailItems.length > 0 ? (
                      detailItems.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 border text-center">{index + 1}</td>
                          <td className="p-3 border">{item.nama_barang}</td>
                          <td className="p-3 border text-center">{item.qty}</td>
                          <td className="p-3 border text-center">{item.satuan}</td>
                          <td className="p-3 border text-center">{formatRupiah(item.harga_satuan)}</td>
                          <td className="p-3 border text-center">{formatRupiah(item.harga_total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          Belum ada detail barang.
                        </td>
                      </tr>
                    )}
                    {detailItems.length > 0 ? (
                      <tr className="font-semibold bg-gray-50">
                        <td colSpan={4} className="border p-3" />
                        <td className="border p-3 text-center">Total</td>
                        <td className="border p-3 text-center">{formatRupiah(detailGrandTotal)}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Modal({
  children,
  
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </motion.div>
  );
}


