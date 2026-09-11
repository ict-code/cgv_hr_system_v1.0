"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EmployeeDetail, EmploymentStatusCode } from "@/lib/types";

export function ServiceRecordDocument({
  employee,
  employmentStatuses,
}: {
  employee: EmployeeDetail;
  employmentStatuses: EmploymentStatusCode[];
}) {
  const [certifiedDate, setCertifiedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryPosition, setSignatoryPosition] = useState("");

  const records = [...employee.serviceRecords].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));

  function statusLabel(code: string | null) {
    if (!code) return "—";
    return employmentStatuses.find((s) => s.code === code)?.description ?? code;
  }

  return (
    <div id="service-record-document" className="mx-auto w-full max-w-[850px] bg-white p-8 text-[13px] text-black print:max-w-none print:p-0">
      <div className="mb-4 h-[95px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/service-record-letterhead.png" alt="City of Vigan — City Human Resource Management Office" className="w-full" />
      </div>

      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold tracking-wide">SERVICE RECORD</h1>
        <p className="text-xs italic">(To be accomplished by Employer)</p>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-4">
        {[
          { label: "(Surname)", value: employee.lastName },
          { label: "(Given Name)", value: employee.firstName },
          { label: "(Middle Name)", value: employee.middleName ?? "" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center">
            <div className="w-full border-b border-black px-1 text-center font-medium">{f.value || " "}</div>
            <p className="mt-0.5 text-[10px]">{f.label}</p>
          </div>
        ))}
      </div>
      <p className="mb-3 -mt-2 text-center text-[10px] italic">(If married woman, give maiden name, too)</p>

      <div className="mb-3 flex items-start gap-2">
        <span className="shrink-0 font-medium">BIRTH:</span>
        <div className="flex-1">
          <div className="border-b border-black px-1">{formatDate(employee.birthDate)}</div>
          <p className="mt-0.5 text-[10px] italic">
            (Date herein should be checked, based on Baptismal Certificate or some other reliable document)
          </p>
        </div>
      </div>

      <p className="mb-4 text-justify text-[12px] leading-snug">
        This is to certify that the employee named herein above actually rendered services in this office shown by
        the service record below each line which is supported by appointment and other papers actually issued by
        these offices and approved by the authorized official concerned.
      </p>

      <table className="w-full border-collapse border border-black text-[10.5px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black px-1.5 py-1">From</th>
            <th className="border border-black px-1.5 py-1">To</th>
            <th className="border border-black px-1.5 py-1">Designation</th>
            <th className="border border-black px-1.5 py-1">Status</th>
            <th className="border border-black px-1.5 py-1">Salary</th>
            <th className="border border-black px-1.5 py-1">Office Entity / Division</th>
            <th className="border border-black px-1.5 py-1">Separation</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-black px-1.5 py-3 text-center text-[var(--color-muted)]">
                No service history on record.
              </td>
            </tr>
          )}
          {records.map((r) => (
            <tr key={r.id} className="break-inside-avoid">
              <td className="border border-black px-1.5 py-1">{formatDate(r.startDate)}</td>
              <td className="border border-black px-1.5 py-1">{r.endDate ? formatDate(r.endDate) : ""}</td>
              <td className="border border-black px-1.5 py-1">{r.positionSnapshot ?? "—"}</td>
              <td className="border border-black px-1.5 py-1">{statusLabel(r.empStatusSnapshot)}</td>
              <td className="border border-black px-1.5 py-1 text-right tabular-nums">
                {r.actlSalarySnapshot ? `${formatCurrency(r.actlSalarySnapshot)}/a` : "—"}
              </td>
              <td className="border border-black px-1.5 py-1">{r.departmentSnapshot ?? "—"}</td>
              <td className="border border-black px-1.5 py-1">{r.endDate ? "" : "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex items-end justify-between gap-8">
        <p className="font-medium">CERTIFIED CORRECT AS PER RECORDS:</p>
        <div className="flex flex-col items-center">
          <input
            type="date"
            value={certifiedDate}
            onChange={(e) => setCertifiedDate(e.target.value)}
            className="border-0 border-b border-black bg-transparent text-center outline-none print:appearance-none"
          />
          <p className="mt-0.5 text-[10px]">Date</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="flex w-64 flex-col items-center">
          <input
            type="text"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            placeholder="Signatory name"
            className="w-full border-0 border-b border-black bg-transparent text-center font-semibold uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-[var(--color-muted)] print:placeholder:text-transparent"
          />
          <input
            type="text"
            value={signatoryPosition}
            onChange={(e) => setSignatoryPosition(e.target.value)}
            placeholder="Position"
            className="mt-1 w-full border-0 bg-transparent text-center text-[11px] outline-none placeholder:text-[var(--color-muted)] print:placeholder:text-transparent"
          />
        </div>
      </div>
    </div>
  );
}
