import React, { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import { toast } from "../../../../components/common/ToastNotification";
import { listBrands } from "../../../../services/brandsService";
import { listCategories } from "../../../../services/categoriesService";
import { importItems } from "../../../../services/itemsService";
import { cn } from "../../../../utils/cn";
import {
  IMPORT_COLUMNS,
  downloadItemsImportTemplate,
  isImportSpreadsheetFile,
  parseItemsImportFile,
  rowsToImportCsvFile,
  validateImportPreviewRows,
} from "../utils/itemsImportTemplate";

export default function ImportItemsModal({ isOpen, onClose, onImported }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFileName("");
      setPreviewRows([]);
      setParsing(false);
      setDownloading(false);
      setSubmitting(false);
      setResult(null);
    }
  }, [isOpen]);

  const validCount = previewRows.filter((row) => row._valid).length;
  const issueCount = previewRows.length - validCount;
  const canImport =
    previewRows.length > 0 &&
    issueCount === 0 &&
    !parsing &&
    !submitting;

  const handleDownloadTemplate = async () => {
    if (downloading || submitting) return;
    setDownloading(true);
    try {
      const [brands, categories] = await Promise.all([
        listBrands(),
        listCategories(),
      ]);
      await downloadItemsImportTemplate({
        brands: brands.filter((row) => row.isActive !== false),
        categories: categories.filter((row) => row.isActive !== false),
      });
      toast.success("Excel template downloaded.");
    } catch (error) {
      toast.error(error.message || "Could not download template.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePick = async (picked) => {
    if (!picked) return;
    if (!isImportSpreadsheetFile(picked)) {
      toast.warning("Please choose an Excel (.xlsx) or CSV file.");
      return;
    }

    setParsing(true);
    setResult(null);
    setFileName(picked.name);
    setPreviewRows([]);

    try {
      const rows = await parseItemsImportFile(picked);
      const validated = validateImportPreviewRows(rows);
      if (!validated.length) {
        toast.warning("No data rows found in the file.");
        setFileName("");
        return;
      }
      setPreviewRows(validated);
      if (validated.some((row) => !row._valid)) {
        toast.warning("Some rows need attention before import.");
      }
    } catch (error) {
      setFileName("");
      toast.error(error.message || "Could not read the file.");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!canImport) return;
    setSubmitting(true);
    setResult(null);
    try {
      const csvFile = rowsToImportCsvFile(previewRows);
      const response = await importItems(csvFile);
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
      subtitle="Download the Excel template, fill it in, then preview and import."
      saveLabel={submitting ? "Importing…" : "Import items"}
      saveDisabled={!canImport}
      onSave={handleImport}
      dialogClassName="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[12px] font-bold text-slate-800">Import requirements</p>
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={downloading || submitting || parsing}
            >
              <Download size={14} />
              {downloading ? "Preparing…" : "Download template"}
            </Button>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
            <li>
              Download the <span className="font-semibold text-slate-700">Excel (.xlsx)</span>{" "}
              template (CSV also accepted on upload).
            </li>
            <li>
              Expected columns:{" "}
              <span className="font-semibold text-slate-700 font-mono">
                {IMPORT_COLUMNS.join(", ")}
              </span>
            </li>
            <li>
              On the <span className="font-semibold text-slate-700">Items</span> sheet, use the
              dropdowns for <span className="font-semibold text-slate-700">brand_id</span>,{" "}
              <span className="font-semibold text-slate-700">category_id</span>, and{" "}
              <span className="font-semibold text-slate-700">unit</span>. Brand and category
              options show as <span className="font-mono text-slate-700">ID | Name</span>
            </li>
            <li>
              <span className="font-semibold text-slate-700">Name</span>,{" "}
              <span className="font-semibold text-slate-700">Brand Id</span>, and{" "}
              <span className="font-semibold text-slate-700">Unit</span> (base unit) are required for every row. Excel
              files are converted to CSV before upload.
            </li>
          </ul>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(event) => {
            handlePick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
          <FileSpreadsheet className="mx-auto mb-2 text-slate-400" size={28} />
          <p className="text-[12px] font-medium text-slate-600 mb-3">
            {parsing
              ? "Reading file…"
              : fileName
                ? fileName
                : "Select an Excel (.xlsx) or CSV file"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={submitting || parsing}
          >
            <Upload size={14} />
            {fileName ? "Change file" : "Choose file"}
          </Button>
        </div>

        {previewRows.length ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-slate-800">Preview</p>
              <p className="text-[11px] text-slate-500">
                {previewRows.length} row{previewRows.length === 1 ? "" : "s"}
                {issueCount > 0
                  ? ` · ${issueCount} with issues`
                  : ` · ${validCount} ready`}
              </p>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left min-w-[640px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    {IMPORT_COLUMNS.map((column) => (
                      <th
                        key={column}
                        className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        {column}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {previewRows.map((row) => (
                    <tr
                      key={`${row._sourceRow}-${row._index}`}
                      className={cn(!row._valid && "bg-amber-50/60")}
                    >
                      <td className="px-3 py-2 text-[11px] text-slate-500">{row._index}</td>
                      {IMPORT_COLUMNS.map((column) => (
                        <td
                          key={column}
                          className="px-3 py-2 text-[11px] text-slate-700 max-w-[160px] truncate"
                          title={row[column] || ""}
                        >
                          {row[column] || "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-[11px]">
                        {row._valid ? (
                          <span className="font-medium text-emerald-700">Ready</span>
                        ) : (
                          <span
                            className="font-medium text-amber-700"
                            title={row._issues.join("; ")}
                          >
                            {row._issues.join("; ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

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
