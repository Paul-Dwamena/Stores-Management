import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./base/Button";

const AddModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  children,
  dialogClassName,
  panelClassName,
  contentClassName,
  saveLabel = "Save Record",
  saveVariant = "primary",
  secondaryAction,
  footerActions = null,
  hideCancelButton = false,
  saveDisabled = false,
  fillViewport = false,
  flushViewport = false,
  overlayClassName,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = fillViewport
    ? (dialogClassName ?? panelClassName)
    : (dialogClassName ?? panelClassName ?? "max-w-lg");

  return ReactDOM.createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999]",
        overlayClassName,
        fillViewport
          ? (flushViewport ? "flex flex-col p-0" : "flex flex-col p-3 sm:p-4")
          : "flex items-center justify-center p-3 sm:p-4",
      )}
    >
      {/* Backdrop — covers the entire true viewport including header */}
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col min-h-0",
          fillViewport
            ? (flushViewport
              ? "flex-1 w-full max-w-none max-h-none rounded-none"
              : "flex-1 w-full max-w-none max-h-none rounded-xl")
            : "w-full rounded-2xl m-0 sm:m-4 max-h-[90vh]",
          sizeClass,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-[12px] text-slate-500 font-medium mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className={cn("px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto min-h-0 flex-1", contentClassName)}>{children}</div>

        {/* Actions Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl">
          <div>
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                size="modal"
                disabled={secondaryAction.disabled}
              >
                {secondaryAction.label ?? "Back"}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap justify-end items-center gap-3">
            {footerActions}
            {!hideCancelButton && (
              <Button onClick={onClose} variant="outline" size="modal">
                Cancel
              </Button>
            )}
            <Button
              onClick={onSave ?? onClose}
              variant={saveVariant}
              size="modal"
              disabled={saveDisabled}
            >
              {saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddModal;
