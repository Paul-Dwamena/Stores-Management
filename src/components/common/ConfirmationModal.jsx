import React from "react";
import ReactDOM from "react-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Button from "./base/Button";
import { cn } from "../../utils/cn";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  isDanger,
  icon: Icon,
  className,
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

  const handleCancel = () => {
    if (onCancel) onCancel();
    else onClose();
  };

  return ReactDOM.createPortal(
    <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center", className)}>
      <div
        className="absolute inset-0 bg-slate-900/60 animate-in fade-in duration-200"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 m-4 flex flex-col p-6 text-center">
        <div className={cn("mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4", isDanger ? "bg-red-50" : "bg-emerald-50")}>
          {Icon ? <Icon className={cn("w-8 h-8", isDanger ? "text-red-600" : "text-emerald-600")} /> :
           isDanger ? <AlertTriangle className="w-8 h-8 text-red-600" /> : <CheckCircle className="w-8 h-8 text-emerald-600" />}
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">{title}</h2>
        <p className="text-[12px] text-slate-500 font-medium mb-6">
          {message}
        </p>

        <div className="flex justify-center gap-3 w-full">
          <Button onClick={handleCancel} variant="ghost" className="flex-1 border border-slate-200">
            {cancelText || "Cancel"}
          </Button>
          <Button onClick={() => { onConfirm(); onClose(); }} variant={isDanger ? "danger" : "primary"} className="flex-1">
            {confirmText || "Confirm"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
