import React, { useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "../../utils/cn";

const UploadDocumentModal = ({
  isOpen,
  onClose,
  onUpload,
  entityLabel = "Linked To",
  defaultLinkedTo = "",
  lockLinkedTo = false,
}) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [linkedTo, setLinkedTo] = useState(defaultLinkedTo);
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setDocName("");
    setLinkedTo(defaultLinkedTo || "");
    setExpiryDate("");
    setUploading(false);
    setUploaded(false);
    setDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleUpload = () => {
    if (!file || !docName.trim()) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      if (onUpload) {
        const today = new Date();
        const formatted = today.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        let expiryFormatted = "N/A";
        if (expiryDate) {
          const exp = new Date(expiryDate);
          expiryFormatted = exp.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
        const expStatus = !expiryDate
          ? "Valid"
          : new Date(expiryDate) > today
            ? "Valid"
            : "Expired";
        onUpload({
          name: docName.trim(),
          linkedTo: linkedTo.trim() || "—",
          fileDate: formatted,
          expiryDate: expiryFormatted,
          status: expStatus,
          fileName: file.name,
        });
      }
    }, 1800);
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setLinkedTo(defaultLinkedTo || "");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, defaultLinkedTo]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-extrabold text-slate-900">Upload Document</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {uploaded ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-primary border border-slate-200">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-[14px] font-extrabold text-slate-900">Upload Successful!</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{file?.name} has been saved.</p>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 px-5 py-2 bg-slate-900 text-white rounded-lg text-[12px] font-bold hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                  dragging
                    ? "border-primary bg-slate-50"
                    : "border-slate-200 hover:border-primary hover:bg-slate-50"
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                />
                <UploadCloud
                  size={32}
                  className={cn(
                    "transition-colors",
                    dragging ? "text-primary" : "text-slate-300"
                  )}
                />
                {file ? (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full max-w-xs">
                    <FileText size={14} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold text-slate-600">
                      Drag & drop or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, DOC, DOCX, JPG, PNG</p>
                  </>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Document Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Vehicle Registration — GR-4521-22"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {entityLabel}
                  </label>
                  <input
                    type="text"
                    value={linkedTo}
                    onChange={(e) => setLinkedTo(e.target.value)}
                    readOnly={lockLinkedTo}
                    placeholder="e.g. Toyota Hilux or Afia Mensima"
                    className={cn(
                      "w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] outline-none transition-colors",
                      lockLinkedTo
                        ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                        : "focus:border-slate-900",
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || !docName.trim() || uploading}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-[12px] font-bold text-white flex items-center justify-center gap-2 transition-colors",
                    !file || !docName.trim()
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-black"
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} /> Upload
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UploadDocumentModal;
