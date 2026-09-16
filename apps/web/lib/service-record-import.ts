// Type-only import: the runtime module is loaded dynamically inside each
// function below so pages that only download/parse a template on demand
// don't ship ExcelJS in their initial bundle.
import type ExcelJS from "exceljs";
import type { Department, EmploymentStatusCode, Position } from "@/lib/types";

// Column order for both the generated .xlsx template and the uploaded-file
// parser — one source of truth so a header index change can't desync them.
// `dropdown` names which master list (if any) populates that column's
// data-validation picklist, to cut down on typos HR would otherwise type.
// The "Employee No." column is prepended only for the all-employees import
// (a single employee's own Service Record tab already knows who it's for).
const BASE_COLUMNS = [
  { header: "From Date (MM/DD/YYYY)", key: "startDate" },
  { header: "To Date (MM/DD/YYYY)", key: "endDate" },
  { header: "Position/Designation", key: "positionSnapshot", dropdown: "position" },
  { header: "Office/Department", key: "departmentSnapshot", dropdown: "department" },
  { header: "Division", key: "divisionSnapshot" },
  { header: "Employment Status", key: "empStatusSnapshot", dropdown: "empStatus" },
  { header: "Monthly Salary", key: "salarySnapshot" },
  { header: "Annual Salary", key: "actlSalarySnapshot" },
  { header: "Salary Grade", key: "grade", dropdown: "grade" },
  { header: "Step", key: "step", dropdown: "step" },
  { header: "Item No.", key: "itemNo" },
  { header: "Exit Date (MM/DD/YYYY)", key: "exitDate" },
  { header: "Exit Cause", key: "exitCause" },
  { header: "Leave of Absence", key: "leaveAbsence" },
  { header: "Remarks", key: "remarks" },
] as const;

const EMP_NO_COLUMN = { header: "Employee No.", key: "empNo" } as const;

type ServiceRecordColumn = { header: string; key: string; dropdown?: string };

function getColumns(includeEmpNo: boolean): ServiceRecordColumn[] {
  return includeEmpNo ? [EMP_NO_COLUMN, ...BASE_COLUMNS] : [...BASE_COLUMNS];
}

function colIndex(columns: ServiceRecordColumn[], key: string): number {
  return columns.findIndex((c) => c.key === key) + 1;
}

export type ServiceRecordPayload = {
  startDate: string;
  endDate?: string;
  positionSnapshot?: string;
  departmentSnapshot?: string;
  divisionSnapshot?: string;
  empStatusSnapshot?: string;
  salarySnapshot?: number;
  actlSalarySnapshot?: number;
  grade?: number;
  step?: number;
  itemNo?: string;
  exitDate?: string;
  exitCause?: string;
  leaveAbsence?: string;
  remarks?: string;
};

export type ServiceRecordPayloadWithEmpNo = ServiceRecordPayload & { empNo: number };

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadServiceRecordTemplate(masters: {
  positions: Position[];
  departments: Department[];
  employmentStatuses: EmploymentStatusCode[];
  gradeMax: number;
  stepMax: number;
  includeEmpNo?: boolean;
  filename?: string;
}) {
  const columns = getColumns(!!masters.includeEmpNo);

  const { default: ExcelJSRuntime } = await import("exceljs");
  const workbook = new ExcelJSRuntime.Workbook();
  const sheet = workbook.addWorksheet("Service Record");
  const lists = workbook.addWorksheet("Lists");
  lists.state = "veryHidden";

  sheet.columns = columns.map((c) => ({ header: c.header, width: c.key === "empNo" ? 14 : 22 }));
  sheet.getRow(1).font = { bold: true };

  const positionNames = Array.from(new Set(masters.positions.map((p) => p.positionDesc))).sort();
  const departmentNames = Array.from(new Set(masters.departments.map((d) => d.deptDesc))).sort();
  const empStatusOptions = masters.employmentStatuses.map((s) => `${s.code} - ${s.description}`).sort();

  // Grade/step have no dedicated master-list endpoint — they're plain ints
  // on ServiceRecord, not FKs — so the dropdown is just the real min..max
  // range seen across the Salary Grade Table data.
  const grades = Array.from({ length: masters.gradeMax }, (_, i) => i + 1);
  const steps = Array.from({ length: masters.stepMax }, (_, i) => i + 1);

  positionNames.forEach((name, i) => lists.getCell(i + 1, 1).value = name);
  departmentNames.forEach((name, i) => lists.getCell(i + 1, 2).value = name);
  empStatusOptions.forEach((name, i) => lists.getCell(i + 1, 3).value = name);
  grades.forEach((n, i) => lists.getCell(i + 1, 4).value = n);
  steps.forEach((n, i) => lists.getCell(i + 1, 5).value = n);

  const DATA_ROWS = 500;
  function applyDropdown(key: string, listRange: string) {
    const col = colIndex(columns, key);
    for (let r = 2; r <= DATA_ROWS + 1; r++) {
      sheet.getCell(r, col).dataValidation = { type: "list", allowBlank: true, formulae: [listRange] };
    }
  }
  if (positionNames.length > 0) applyDropdown("positionSnapshot", `Lists!$A$1:$A$${positionNames.length}`);
  if (departmentNames.length > 0) applyDropdown("departmentSnapshot", `Lists!$B$1:$B$${departmentNames.length}`);
  if (empStatusOptions.length > 0) applyDropdown("empStatusSnapshot", `Lists!$C$1:$C$${empStatusOptions.length}`);
  applyDropdown("grade", `Lists!$D$1:$D$${grades.length}`);
  applyDropdown("step", `Lists!$E$1:$E$${steps.length}`);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    masters.filename ?? "service-record-template.xlsx",
  );
}

// Accepts a real Excel date cell, a typed MM/DD/YYYY string, or an
// <input type="date"> value (YYYY-MM-DD) — the JS Date constructor parses
// the string forms, and exceljs already hands back a Date for date cells.
export function parseFlexibleDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseFlexibleNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
}

function parseFlexibleInt(value: unknown): number | undefined {
  const num = parseFlexibleNumber(value);
  return num === undefined ? undefined : Math.trunc(num);
}

// Cell value can be a string, number, Date, rich-text object, or formula
// result depending on how the user filled it in — normalize to plain text.
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return String(value.text ?? "");
    if ("result" in value) return String(value.result ?? "");
  }
  return String(value).trim();
}

// The Employment Status dropdown shows "CODE - Description" for clarity but
// only the code should be stored (matches what's already in the DB and what
// the manual Add form saves) — take the text before the first " - ".
function extractStatusCode(text: string): string {
  return text.split(" - ")[0]?.trim() ?? text.trim();
}

function excelRowToPayload(
  columns: ServiceRecordColumn[],
  includeEmpNo: boolean,
  row: ExcelJS.Row,
  rowNumber: number,
): { payload: ServiceRecordPayload | ServiceRecordPayloadWithEmpNo } | { error: string } | null {
  const get = (key: string) => row.getCell(colIndex(columns, key)).value;
  const text = (key: string) => cellText(get(key));

  const isBlank = columns.every((c) => !text(c.key));
  if (isBlank) return null;

  let empNo: number | undefined;
  if (includeEmpNo) {
    empNo = parseFlexibleInt(get("empNo"));
    if (empNo === undefined) {
      return { error: `Row ${rowNumber}: "Employee No." is missing or not a number` };
    }
  }

  const startDate = parseFlexibleDate(get("startDate"));
  if (!startDate) {
    return { error: `Row ${rowNumber}: "From Date" is missing or not a valid date` };
  }

  const payload: ServiceRecordPayload = {
    startDate,
    endDate: parseFlexibleDate(get("endDate")),
    positionSnapshot: text("positionSnapshot") || undefined,
    departmentSnapshot: text("departmentSnapshot") || undefined,
    divisionSnapshot: text("divisionSnapshot") || undefined,
    empStatusSnapshot: text("empStatusSnapshot") ? extractStatusCode(text("empStatusSnapshot")) : undefined,
    salarySnapshot: parseFlexibleNumber(get("salarySnapshot")),
    actlSalarySnapshot: parseFlexibleNumber(get("actlSalarySnapshot")),
    grade: parseFlexibleInt(get("grade")),
    step: parseFlexibleInt(get("step")),
    itemNo: text("itemNo") || undefined,
    exitDate: parseFlexibleDate(get("exitDate")),
    exitCause: text("exitCause") || undefined,
    leaveAbsence: text("leaveAbsence") || undefined,
    remarks: text("remarks") || undefined,
  };

  return { payload: includeEmpNo ? { ...payload, empNo: empNo! } : payload };
}

export async function parseServiceRecordWorkbook(
  file: File,
  opts: { includeEmpNo: true },
): Promise<{ records: ServiceRecordPayloadWithEmpNo[]; errors: string[] }>;
export async function parseServiceRecordWorkbook(
  file: File,
  opts?: { includeEmpNo?: false },
): Promise<{ records: ServiceRecordPayload[]; errors: string[] }>;
export async function parseServiceRecordWorkbook(
  file: File,
  opts?: { includeEmpNo?: boolean },
): Promise<{ records: ServiceRecordPayload[] | ServiceRecordPayloadWithEmpNo[]; errors: string[] }> {
  const includeEmpNo = !!opts?.includeEmpNo;
  const columns = getColumns(includeEmpNo);

  const buffer = await file.arrayBuffer();
  const { default: ExcelJSRuntime } = await import("exceljs");
  const workbook = new ExcelJSRuntime.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];

  const records: (ServiceRecordPayload | ServiceRecordPayloadWithEmpNo)[] = [];
  const errors: string[] = [];
  if (!sheet) return { records: records as ServiceRecordPayload[], errors: ["This file has no worksheet"] };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header row
    const result = excelRowToPayload(columns, includeEmpNo, row, rowNumber);
    if (result === null) return;
    if ("error" in result) errors.push(result.error);
    else records.push(result.payload);
  });

  return { records: records as ServiceRecordPayload[], errors };
}
