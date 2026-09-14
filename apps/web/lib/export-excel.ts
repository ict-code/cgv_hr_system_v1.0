import ExcelJS from "exceljs";

export async function exportRowsToExcel(opts: {
  filename: string;
  sheetName: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, unknown>[];
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(opts.sheetName.slice(0, 31)); // Excel sheet name limit
  sheet.columns = opts.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 24 }));
  sheet.getRow(1).font = { bold: true };
  opts.rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = opts.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
