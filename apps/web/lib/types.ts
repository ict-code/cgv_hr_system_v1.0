export const APPOINTMENT_STATUSES = [
  "AP", "CT", "DT", "EL", "FT", "NE", "OA", "PR", "PX", "RA", "RC", "RI",
  "RM", "RN", "RS", "RT", "SA", "TM", "TN", "TO", "TX",
] as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  AP: "Appointed", CT: "Co-Terminous", DT: "Death", EL: "Elected",
  FT: "Full Time to Part Time", NE: "New", OA: "Original Appointment",
  PR: "Promotion", PX: "Promotion Ext", RA: "Reappointment", RC: "Reclass",
  RI: "Reinstated", RM: "Re-employment", RN: "Renewal", RS: "Resigned",
  RT: "Retired", SA: "Salary Adjustment", TM: "Temporary Appointment",
  TN: "Transfer (entry)", TO: "Transfer Out", TX: "Transfer Dept",
};

export const EMPLOYMENT_STATUSES = [
  "REGULAR", "CASUAL", "CONTRACTUAL", "CO_TERMINOUS", "PROBATIONARY", "DEVOLVED",
] as const;

export type Department = {
  id: string;
  deptCode: number;
  deptDesc: string;
  shortDesc: string | null;
};

export type Position = {
  id: string;
  positionCode: number;
  positionDesc: string;
  shortDesc: string | null;
};

export type Employee = {
  id: string;
  empNo: number;
  lastName: string;
  firstName: string;
  middleName: string | null;
  sex: string | null;
  civilStatus: string | null;
  departmentId: string | null;
  department?: Department | null;
};

export type Appointment = {
  id: string;
  status: string | null;
  effectDate: string | null;
  departmentId: string | null;
  positionId: string | null;
  department?: Department | null;
  position?: Position | null;
  actualSalary: string | null;
  monthlyRate: string | null;
  grade: number | null;
  stepNo: number | null;
  employmentStatus: string | null;
};

export type AppointmentChangeLog = {
  id: string;
  year: number;
  effectDate: string;
  statusCode: string | null;
  oldStatusCode: string | null;
  deptCode: number | null;
  oldDeptCode: number | null;
  actlSalary: string | null;
  oldActlSalary: string | null;
  createdAt: string;
  changedByUser?: { fullName: string; loginId: string } | null;
};

export type ServiceRecord = {
  id: string;
  startDate: string;
  endDate: string | null;
  positionSnapshot: string | null;
  departmentSnapshot: string | null;
  salarySnapshot: string | null;
};

export type EmployeeDetail = Employee & {
  dependents: unknown[];
  appointments: Appointment[];
  changeLogs: AppointmentChangeLog[];
  serviceRecords: ServiceRecord[];
};
