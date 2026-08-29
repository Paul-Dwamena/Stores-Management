import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Package, Trash2 } from "lucide-react";
import { cn } from "../../../../utils/cn";
import { requiredFieldLabel } from "../../../../components/common/fields/requiredFieldLabel";

export function ItemPhotoThumb({ src, name, className = "h-10 w-10" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          className,
          "rounded-md bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0",
        )}
        aria-hidden="true"
      >
        <Package size={16} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name || ""}
      onError={() => setFailed(true)}
      className={cn(
        className,
        "rounded-md object-cover bg-slate-100 border border-slate-100 shrink-0",
      )}
    />
  );
}

export default function ItemPhotoField({
  id = "item-photo",
  label = "Item photo",
  value = "",
  onChange,
  onFileChange,
  error,
  /** When set, controls Remove visibility. Default: show only after a new image is chosen. */
  showRemove,
}) {
  const inputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(false);

  useEffect(() => {
    setPendingFile(false);
  }, [id]);

  const setPhoto = (next, file = null) => {
    setPendingFile(Boolean(file));
    onChange?.(next || "");
    onFileChange?.(file);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""), file);
    reader.readAsDataURL(file);
  };

  const removeVisible =
    showRemove !== undefined ? Boolean(showRemove) : pendingFile;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {requiredFieldLabel(label, false)}
      </p>
      <div className="flex items-center gap-3">
        <ItemPhotoThumb src={value} name={label} className="h-14 w-14" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              <ImagePlus size={14} />
              {value ? "Change photo" : "Upload photo"}
            </button>
            {removeVisible ? (
              <button
                type="button"
                onClick={() => setPhoto("", null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200"
              >
                <Trash2 size={14} />
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-[10px] text-slate-400">PNG or JPG. Shown on the inventory list.</p>
        </div>
      </div>
      {error ? <p className="text-[10px] font-medium text-red-500">{error}</p> : null}
    </div>
  );
}
