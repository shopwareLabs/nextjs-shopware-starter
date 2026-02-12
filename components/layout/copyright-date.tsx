"use client";

export function CopyrightDate({ startYear }: { startYear: number }) {
  const currentYear = new Date().getFullYear();
  return <>{startYear + (currentYear > startYear ? `-${currentYear}` : "")}</>;
}
