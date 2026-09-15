export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const PAY_MODES = ["DAILY", "WEEKLY", "SEMI_MONTHLY", "MONTHLY"] as const;
export const PAY_MODE_LABELS: Record<string, string> = {
  DAILY: "Daily", WEEKLY: "Weekly", SEMI_MONTHLY: "Semi-Monthly", MONTHLY: "Monthly",
};

export const WORK_LEVELS = ["FIRST_LEVEL", "SECOND_LEVEL", "THIRD_LEVEL"] as const;
export const WORK_LEVEL_LABELS: Record<string, string> = {
  FIRST_LEVEL: "First Level", SECOND_LEVEL: "Second Level", THIRD_LEVEL: "Third Level",
};

// Legacy EmployType codes (see Master Data > Employment Status File),
// grouped into the three legacy appointment screens. Real Appointment data
// only ever carries P/CS/CL/CT/EL (2026-09-11) — the rest are here so any
// future real usage still lands in the right screen. Co-Terminous (CT)
// occupies a real plantilla item like Permanent/Elected does (legacy's
// plantilla table has no separate Type for it), so it's grouped with
// Regular/Elected rather than Contractual.
export const REGULAR_ELECTED_STATUSES = ["P", "EL", "CT"];
export const CASUAL_STATUSES = ["CS"];
export const CONTRACTUAL_STATUSES = ["CL", "JO", "SC", "MC", "CC", "CO"];

export type AppointmentStatusCode = {
  id: string;
  code: string;
  description: string;
  active: boolean;
};

export type EmploymentStatusCode = {
  id: string;
  code: string;
  description: string;
};

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

export type Division = {
  id: string;
  divCode: number;
  divDesc: string;
  departmentId: string;
};

export type Employee = {
  id: string;
  empNo: number;
  lastName: string;
  firstName: string;
  middleName: string | null;
  suffix: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  sex: string | null;
  civilStatus: string | null;
  nationality: string;
  fatherName: string | null;
  fatherBirthPlace: string | null;
  motherName: string | null;
  motherBirthPlace: string | null;
  spouseName: string | null;
  spouseWork: string | null;
  tin: string | null;
  gsisNo: string | null;
  pagibigNo: string | null;
  philhealthNo: string | null;
  philsysNo: string | null;
  address: string | null;
  telNo: string | null;
  cellNo: string | null;
  emailAddress: string | null;
  bankAccountNo: string | null;
  taxStatus: string | null;
  dateHired: string | null;
  hiredDate: string | null;
  appointDate: string | null;
  inactive: boolean;
  dateInactivated: string | null;
  inactiveCause: string | null;
  height: string | null;
  weight: string | null;
  bloodType: string | null;
  idNo: string | null;
  biometricId: string | null;
  pwdType: string | null;
  religion: string | null;
  country: string | null;
  jobDescription: string | null;
  remarks: string | null;
  addrUnitNo: string | null;
  addrStreet: string | null;
  addrPhase: string | null;
  addrBlockNo: string | null;
  addrLot: string | null;
  addrBarangay: string | null;
  addrLocality: string | null;
  addrProvince: string | null;
  addrZip: string | null;
  addrTelNo: string | null;
  permanentAddress: string | null;
  permanentTelNo: string | null;
  permanentZipCode: string | null;
  validated: boolean;
  validatedDate: string | null;
  validatedBy: string | null;
  departmentId: string | null;
  department?: Department | null;
  divisionId: string | null;
  division?: Division | null;
  salaryGradeTableId: string | null;
  salaryGradeTable?: SalaryGradeTable | null;
  appointments?: Appointment[];
};

export type Appointment = {
  id: string;
  status: string | null;
  effectDate: string | null;
  departmentId: string | null;
  positionId: string | null;
  department?: Department | null;
  position?: Position | null;
  itemNo: string | null;
  authSalary: string | null;
  actualSalary: string | null;
  monthlyRate: string | null;
  grade: number | null;
  stepNo: number | null;
  employmentStatus: string | null;
  payMode: string | null;
  workLevel: string | null;
  startDate: string | null;
  endDate: string | null;
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
  empStatusSnapshot: string | null;
  salarySnapshot: string | null;
  salaryUnitSnapshot: string | null;
  actlSalarySnapshot: string | null;
  grade: number | null;
  step: number | null;
};

export type Dependent = {
  id: string;
  name: string;
  birthDate: string | null;
  age: number | null;
};

export type EmployeeEducation = {
  id: string;
  level: string;
  schoolName: string;
  attendanceFrom: number | null;
  attendanceTo: number | null;
  yearGraduated: number | null;
  course: string | null;
  degree: string | null;
  honors: string | null;
};

export type EmployeeEligibility = {
  id: string;
  examName: string;
  examDate: string | null;
  examPlace: string | null;
  rating: string | null;
  licenseNumber: string | null;
  licenseValidity: string | null;
};

export type EmployeeWorkExperience = {
  id: string;
  company: string;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  salary: string | null;
  salaryUnit: string | null;
  employmentStatus: string | null;
};

export const LEARNING_DEVELOPMENT_TYPES = ["FOUNDATION", "MANAGERIAL", "SUPERVISORY", "TECHNICAL", "CLERICAL", "OTHERS"] as const;
export const LEARNING_DEVELOPMENT_TYPE_LABELS: Record<string, string> = {
  FOUNDATION: "Foundation",
  MANAGERIAL: "Managerial",
  SUPERVISORY: "Supervisory",
  TECHNICAL: "Technical",
  CLERICAL: "Clerical",
  OTHERS: "Others",
};

export type EmployeeTraining = {
  id: string;
  trainingName: string;
  startDate: string | null;
  endDate: string | null;
  conductor: string | null;
  periodCovered: string | null;
  numberOfHours: number | null;
  type: (typeof LEARNING_DEVELOPMENT_TYPES)[number] | null;
};

export type EmployeeSkill = {
  id: string;
  name: string;
};

export type EmployeeVoluntaryWork = {
  id: string;
  organization: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  numberOfHours: number | null;
  position: string | null;
};

export type EmployeeDistinction = {
  id: string;
  name: string;
};

export type EmployeeOrgMembership = {
  id: string;
  name: string;
};

export type EmployeeDetail = Employee & {
  dependents: Dependent[];
  appointments: Appointment[];
  changeLogs: AppointmentChangeLog[];
  serviceRecords: ServiceRecord[];
  educationRecords: EmployeeEducation[];
  eligibilityRecords: EmployeeEligibility[];
  workExperience: EmployeeWorkExperience[];
  trainingRecords: EmployeeTraining[];
  skills: EmployeeSkill[];
  voluntaryWork: EmployeeVoluntaryWork[];
  distinctions: EmployeeDistinction[];
  orgMemberships: EmployeeOrgMembership[];
};

export type Permission = {
  id: string;
  module: string;
  action: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: { permission: Permission }[];
};

export type UserRow = {
  id: string;
  loginId: string;
  fullName: string;
  active: boolean;
  roles: { role: Role }[];
};

export type Plantilla = {
  id: string;
  itemNo: string;
  oldItemNo: string | null;
  departmentId: string;
  positionId: string | null;
  divisionId: string | null;
  employeeId: string | null;
  department?: Department | null;
  position?: Position | null;
  division?: Division | null;
  employee?: Employee | null;
  actualSalary: string | null;
  authSalary: string | null;
  grade: number | null;
  step: number | null;
  partTime: boolean;
};

export type SalaryStep = {
  id: string;
  stepNo: number;
  amount: string;
  monthlyRate: string;
};

export type SalaryGrade = {
  id: string;
  gradeNo: number;
  salaryGradeTableId: string;
  steps: SalaryStep[];
};

export type SalaryGradeTable = {
  id: string;
  name: string;
  effectiveDate: string | null;
  description: string | null;
};
