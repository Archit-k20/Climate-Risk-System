import type { ReactNode } from "react";
export function PageHeader({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{number} / Climate observatory</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function RiskBadge({ level }: { level: string | null }) {
  return (
    <span className={`risk-badge ${level || "unknown"}`}>
      <i />
      {level || "Unknown"}
    </span>
  );
}
