export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

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

export type AppointmentStatusCode = {
  id: string;
  code: string;
  description: string;
  active: boolean;
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
  schoolYear: string | null;
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

export type EmployeeTraining = {
  id: string;
  trainingName: string;
  startDate: string | null;
  endDate: string | null;
  conductor: string | null;
  periodCovered: string | null;
  numberOfHours: number | null;
};

export type EmployeeSkill = {
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
  departmentId: string;
  positionId: string | null;
  department?: Department | null;
  position?: Position | null;
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
