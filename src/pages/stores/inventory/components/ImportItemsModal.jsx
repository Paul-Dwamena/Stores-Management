import React, { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import { toast } from "../../../../components/common/ToastNotification";
import { importItems } from "../../../../services/itemsService";

const IMPORT_COLUMNS = ["name", "brand_id", "category_id", "description", "unit"];
const TEMPLATE_FILENAME = "items-import-template.csv";

const isCsvFile = (file) => {
  if (!(file instanceof File)) return false;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
};

const downloadImportTemplate = () => {
  const csv = `${IMPORT_COLUMNS.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = TEMPLATE_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ImportItemsModal({ isOpen, onClose, onImported }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSubmitting(false);
      setResult(null);
    }
  }, [isOpen]);

  const handlePick = (picked) => {
    if (!picked) return;
    if (!isCsvFile(picked)) {
      toast.warning("Please choose a CSV file.");
      return;
    }
    setFile(picked);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const response = await importItems(file);
      setResult(response);

      if (response.imported > 0) {
        toast.success(
          response.message ||
            `Imported ${response.imported} of ${response.totalRows} row${response.totalRows === 1 ? "" : "s"}.`,
        );
        onImported?.(response);
      } else if (response.failed > 0) {
        toast.warning(response.message || "No rows were imported.");
      } else {
        toast.info(response.message || "Import completed with no changes.");
      }

      if (response.failed === 0 && response.imported > 0) {
        onClose?.();
      }
    } catch (error) {
      toast.error(error.message || "Could not import items.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      title="Import items"
      subtitle="Upload a CSV file to create items in bulk."
      saveLabel={submitting ? "Importing…" : "Import items"}
      saveDisabled={!file || submitting}
      onSave={handleImport}
      dialogClassName="max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[12px] font-bold text-slate-800">CSV requirements</p>
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={downloadImportTemplate}
              disabled={submitting}
            >
              <Download size={14} />
              Download template
            </Button>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
            <li>File must be a <span className="font-semibold text-slate-700">.csv</span> file.</li>
            <li>
              Required columns (in order):{" "}
              <span className="font-semibold text-slate-700 font-mono">
                {IMPORT_COLUMNS.join(", ")}
              </span>
            </li>
            <li>
              <span className="font-semibold text-slate-700">brand_id</span> and{" "}
              <span className="font-semibold text-slate-700">category_id</span> must match
              existing IDs in the store database (see Brands and Item Categories under Setups).
            </li>
            <li>
              <span className="font-semibold text-slate-700">unit</span> (base unit) is mandatory
              for every row.
            </li>
          </ul>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            handlePick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
          <FileSpreadsheet className="mx-auto mb-2 text-slate-400" size={28} />
          <p className="text-[12px] font-medium text-slate-600 mb-3">
            {file ? file.name : "Select a CSV file to import"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={submitting}
          >
            <Upload size={14} />
            {file ? "Change file" : "Choose CSV"}
          </Button>
        </div>

        {result ? (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 space-y-2">
            <p className="text-[12px] font-medium text-slate-700">{result.message}</p>
            <p className="text-[11px] text-slate-500">
              Total {result.totalRows} · Imported {result.imported} · Failed {result.failed}
            </p>
            {result.errors?.length ? (
              <ul className="max-h-36 overflow-y-auto space-y-1 border-t border-slate-100 pt-2">
                {result.errors.map((err, index) => (
                  <li key={`${err.row}-${index}`} className="text-[11px] text-slate-600">
                    Row {err.row}
                    {err.code ? ` (${err.code})` : ""}:{" "}
                    {(Array.isArray(err.errors) ? err.errors : []).join("; ") || "Failed"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </AddModal>
  );
}
