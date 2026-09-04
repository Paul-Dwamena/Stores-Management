import React from "react";

export default function AccessDenied({
  title = "Access denied",
  description = "You don't have permission to view this page.",
}) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-lg font-extrabold text-slate-900">{title}</h1>
      <p className="mt-2 text-[13px] font-medium text-slate-500">{description}</p>
    </div>
  );
}
