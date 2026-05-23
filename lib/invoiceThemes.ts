export type InvoiceTheme = {
  code: string;
  label: string;
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  tableHeaderBg: [number, number, number];
  tableHeaderText: [number, number, number];
  tableLine: [number, number, number];
  textStrong: [number, number, number];
};

export const INVOICE_THEMES: InvoiceTheme[] = [
  { code: "theme_01", label: "Maroon Klasik", primary: [170, 40, 40], secondary: [125, 28, 32], accent: [226, 196, 125], tableHeaderBg: [255, 249, 249], tableHeaderText: [94, 20, 20], tableLine: [153, 93, 93], textStrong: [65, 15, 15] },
  { code: "theme_02", label: "Biru Laut", primary: [37, 99, 235], secondary: [30, 64, 175], accent: [147, 197, 253], tableHeaderBg: [239, 246, 255], tableHeaderText: [30, 64, 175], tableLine: [96, 165, 250], textStrong: [30, 58, 138] },
  { code: "theme_03", label: "Hijau Emerald", primary: [5, 150, 105], secondary: [4, 120, 87], accent: [167, 243, 208], tableHeaderBg: [236, 253, 245], tableHeaderText: [6, 95, 70], tableLine: [110, 231, 183], textStrong: [6, 78, 59] },
  { code: "theme_04", label: "Ungu Royal", primary: [124, 58, 237], secondary: [91, 33, 182], accent: [196, 181, 253], tableHeaderBg: [245, 243, 255], tableHeaderText: [91, 33, 182], tableLine: [167, 139, 250], textStrong: [76, 29, 149] },
  { code: "theme_05", label: "Oranye Senja", primary: [234, 88, 12], secondary: [194, 65, 12], accent: [254, 215, 170], tableHeaderBg: [255, 247, 237], tableHeaderText: [154, 52, 18], tableLine: [251, 146, 60], textStrong: [124, 45, 18] },
  { code: "theme_06", label: "Slate Modern", primary: [51, 65, 85], secondary: [30, 41, 59], accent: [203, 213, 225], tableHeaderBg: [248, 250, 252], tableHeaderText: [30, 41, 59], tableLine: [148, 163, 184], textStrong: [15, 23, 42] },
  { code: "theme_07", label: "Teal Mint", primary: [13, 148, 136], secondary: [15, 118, 110], accent: [153, 246, 228], tableHeaderBg: [240, 253, 250], tableHeaderText: [17, 94, 89], tableLine: [94, 234, 212], textStrong: [19, 78, 74] },
  { code: "theme_08", label: "Rose Coral", primary: [225, 29, 72], secondary: [190, 24, 93], accent: [251, 182, 206], tableHeaderBg: [255, 241, 242], tableHeaderText: [159, 18, 57], tableLine: [244, 114, 182], textStrong: [136, 19, 55] },
  { code: "theme_09", label: "Amber Gold", primary: [217, 119, 6], secondary: [180, 83, 9], accent: [253, 230, 138], tableHeaderBg: [255, 251, 235], tableHeaderText: [146, 64, 14], tableLine: [245, 158, 11], textStrong: [120, 53, 15] },
  { code: "theme_10", label: "Indigo Night", primary: [67, 56, 202], secondary: [55, 48, 163], accent: [165, 180, 252], tableHeaderBg: [238, 242, 255], tableHeaderText: [49, 46, 129], tableLine: [129, 140, 248], textStrong: [49, 46, 129] },
  { code: "theme_11", label: "Cyan Fresh", primary: [8, 145, 178], secondary: [14, 116, 144], accent: [165, 243, 252], tableHeaderBg: [236, 254, 255], tableHeaderText: [21, 94, 117], tableLine: [103, 232, 249], textStrong: [22, 78, 99] },
  { code: "theme_12", label: "Lime Nature", primary: [101, 163, 13], secondary: [77, 124, 15], accent: [217, 249, 157], tableHeaderBg: [247, 254, 231], tableHeaderText: [63, 98, 18], tableLine: [163, 230, 53], textStrong: [54, 83, 20] },
  { code: "theme_13", label: "Pink Fuchsia", primary: [192, 38, 211], secondary: [162, 28, 175], accent: [245, 208, 254], tableHeaderBg: [253, 244, 255], tableHeaderText: [134, 25, 143], tableLine: [232, 121, 249], textStrong: [112, 26, 117] },
  { code: "theme_14", label: "Stone Warm", primary: [120, 113, 108], secondary: [87, 83, 78], accent: [214, 211, 209], tableHeaderBg: [250, 250, 249], tableHeaderText: [68, 64, 60], tableLine: [168, 162, 158], textStrong: [41, 37, 36] },
  { code: "theme_15", label: "Navy Copper", primary: [30, 41, 59], secondary: [71, 85, 105], accent: [217, 119, 6], tableHeaderBg: [241, 245, 249], tableHeaderText: [30, 41, 59], tableLine: [148, 163, 184], textStrong: [15, 23, 42] },
];

export const DEFAULT_INVOICE_THEME_CODE = "theme_01";

export const getInvoiceTheme = (code?: string | null): InvoiceTheme =>
  INVOICE_THEMES.find((theme) => theme.code === code) ??
  INVOICE_THEMES[0];

