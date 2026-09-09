import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AddModal from "../../../../components/common/AddModal";
import Button from "../../../../components/common/base/Button";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";
import SlideOverSheet from "../../../../components/common/SlideOverSheet";
import InputField from "../../../../components/common/fields/InputField";
import MoneyInputField from "../../../../components/common/fields/MoneyInputField";
import TableIconAction from "../../../../components/common/tableActions/TableIconAction";
import TableRowActions from "../../../../components/common/tableActions/TableRowActions";
import { toast } from "../../../../components/common/ToastNotification";
import { cn } from "../../../../utils/cn";
import {
  formatInventoryMoney,
  sendDeliveryOtp,
  OTP_TYPE,
} from "../../../../services/inventoryService";
import { formatMoneyGhs } from "../../../../utils/displayFormatters";
import { resolveCatalogId } from "../../../../utils/catalogRefHelpers";
import { listBrands } from "../../../../services/brandsService";
import { listCategories } from "../../../../services/categoriesService";
import { listStores } from "../../../../services/storesService";
import AddSupplierModal from "./AddSupplierModal";
import BrandSelect from "./BrandSelect";
import CategorySelect from "./CategorySelect";
import DeliveryPersonOtpSection from "./DeliveryPersonOtpSection";
import SupplierPicker from "./SupplierPicker";
import StoreSelect from "./StoreSelect";
import InventoryUnitFields from "./InventoryUnitFields";
import {
  ItemNameDisplay,
  StoreLocationDisplay,
} from "../../../../components/common/display/FormattedDisplay";
import {
  baseUnitApiValue,
  buildInventoryUnitNotes,
  calcInventoryPurchaseTotal,
  calcInventoryTotalQuantity,
  normalizeBaseUnit,
  normalizeInventoryUnit,
  resolveItemBaseUnit,
} from "../utils/inventoryUnitOptions";
import {
  CONDITION_OPTIONS,
  downloadStockImportTemplate,
  isImportSpreadsheetFile,
  mapStockImportRowsToLines,
  parseStockImportFile,
  validateImportLines,
} from "../utils/itemsImportTemplate";

const fieldClassName =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/25 transition-colors text-slate-700";
const readOnlyClassName =
  "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-600 cursor-not-allowed";
const whiteInputClassName = "bg-white focus:bg-white";
const thClass =
  "px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500";
const tdClass = "px-3 py-2.5 align-middle text-[12px] text-slate-700";

const INITIAL_SHARED = {
  supplierId: "",
  supplierPhone: "",
  supplierEmail: "",
  waybillNumber: "",
  deliveredByName: "",
  deliveredByPhone: "",
  deliveredByEmail: "",
  condition: "GOOD",
  notes: "",
};

function RegistrationTabs({ value, onChange }) {
  return (
    <div className="tab-track w-full">
      {[
        { id: "existing", label: "Registered items" },
        { id: "new", label: "Unregistered items" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn("tab-pill flex-1", value === tab.id && "tab-pill-active")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, description, open, onToggle, children, errorCount = 0 }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 py-2.5 text-left transition-colors",
          "bg-slate-50 hover:bg-slate-100/80",
          open && "border-b border-slate-200",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          className={cn(
            "text-primary shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
              {title}
            </span>
            {errorCount > 0 ? (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 normal-case tracking-normal">
                {errorCount}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
              {description}
            </span>
          ) : null}
        </span>
      </button>
      {open ? <div className="space-y-3 bg-white px-3 py-3">{children}</div> : null}
    </div>
  );
}

function SharedSupplyFields({ value, errors, onChange, onAddSupplier, supplierTick }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SupplierPicker
        value={value.supplierId}
        onChange={(supplierId, supplier) => {
          onChange("supplierId", supplierId);
          onChange("supplierPhone", supplier?.phone || "");
          onChange("supplierEmail", supplier?.email || "");
        }}
        error={errors.supplierId}
        onAddClick={onAddSupplier}
        reloadToken={supplierTick}
      />
      <InputField
        label="Supplier phone"
        type="tel"
        value={value.supplierPhone}
        readOnly
        placeholder={value.supplierId ? "—" : "Select a supplier"}
        className={readOnlyClassName}
      />
      <InputField
        label="Supplier email"
        type="email"
        value={value.supplierEmail}
        readOnly
        placeholder={value.supplierId ? "—" : "Select a supplier"}
        className={readOnlyClassName}
      />
      <InputField
        label="Delivered by (full name)"
        required
        value={value.deliveredByName}
        onChange={(event) => onChange("deliveredByName", event.target.value)}
        error={errors.deliveredByName}
        placeholder="Full name"
        className={whiteInputClassName}
      />
      <InputField
        label="Delivered by (phone)"
        required
        type="tel"
        value={value.deliveredByPhone}
        onChange={(event) => onChange("deliveredByPhone", event.target.value)}
        placeholder="e.g. +233 24 000 0000"
        error={errors.deliveredByPhone}
        className={whiteInputClassName}
      />
      <InputField
        label="Delivered by (email)"
        type="email"
        required
        value={value.deliveredByEmail}
        onChange={(event) => onChange("deliveredByEmail", event.target.value)}
        placeholder="e.g. driver@supplier.com"
        error={errors.deliveredByEmail}
        className={whiteInputClassName}
      />
      <InputField
        label="Waybill number"
        value={value.waybillNumber}
        onChange={(event) => onChange("waybillNumber", event.target.value)}
        placeholder="e.g. WB-2026-0041"
        className={whiteInputClassName}
      />
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Item condition *
        </label>
        <select
          value={value.condition}
          onChange={(event) => onChange("condition", event.target.value)}
          className={fieldClassName}
        >
          {CONDITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function calcLineTotal(line) {
  return calcInventoryPurchaseTotal(
    line.quantity,
    line.unitsPerPack,
    line.unitOfMeasure,
    line.unitCost,
  );
}

function lineDisplayName(line, mode) {
  if (mode === "existing") {
    return line.name || line.itemCode || "Selected item";
  }
  return line.name?.trim() || "New item";
}

export default function ImportItemsModal({
  isOpen,
  onClose,
  items = [],
  onSave,
}) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState("existing");
  const [shared, setShared] = useState(INITIAL_SHARED);
  const [existingLines, setExistingLines] = useState([]);
  const [newLines, setNewLines] = useState([]);
  const [errors, setErrors] = useState({ shared: {} });
  const [supplyOpen, setSupplyOpen] = useState(true);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierTick, setSupplierTick] = useState(0);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editor, setEditor] = useState(null);
  const [editorErrors, setEditorErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [catalog, setCatalog] = useState({ brands: [], categories: [], stores: [] });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.all([listBrands(), listCategories(), listStores()])
      .then(([brands, categories, stores]) => {
        if (cancelled) return;
        setCatalog({
          brands: brands.filter((row) => row.isActive !== false),
          categories: categories.filter((row) => row.isActive !== false),
          stores: stores.filter((row) => row.isActive !== false),
        });
      })
      .catch(() => {
        if (!cancelled) setCatalog({ brands: [], categories: [], stores: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMode("existing");
    setShared(INITIAL_SHARED);
    setExistingLines([]);
    setNewLines([]);
    setErrors({ shared: {} });
    setSupplyOpen(true);
    setFileName("");
    setEditor(null);
    setEditorErrors({});
    setDeleteTarget(null);
    setPendingSave(null);
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setOtpSending(false);
    setDetailsConfirmed(false);
  }, [isOpen]);

  const lines = mode === "new" ? newLines : existingLines;
  const setLines = mode === "new" ? setNewLines : setExistingLines;
  const validatedLines = useMemo(
    () => validateImportLines(lines, mode),
    [lines, mode],
  );
  const allReady =
    validatedLines.length > 0 && validatedLines.every((row) => row._valid);
  const issueCount = validatedLines.filter((row) => !row._valid).length;
  const totalQuantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const totalValue = lines.reduce((sum, line) => sum + (calcLineTotal(line) || 0), 0);
  const storeNameById = useMemo(
    () => new Map(catalog.stores.map((store) => [String(store.id), store.name])),
    [catalog.stores],
  );

  const resetOtpState = () => {
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setDetailsConfirmed(false);
  };

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setFileName("");
    setEditor(null);
    setEditorErrors({});
    setDeleteTarget(null);
    setErrors({ shared: {} });
    resetOtpState();
  };

  const setSharedField = (key, value) => {
    setShared((current) => ({ ...current, [key]: value }));
    resetOtpState();
    setErrors((current) => {
      const nextShared = { ...current.shared };
      delete nextShared[key];
      return { ...current, shared: nextShared };
    });
  };

  const handleDownloadTemplate = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadStockImportTemplate({
        mode,
        brands: catalog.brands,
        categories: catalog.categories,
        stores: catalog.stores,
        items,
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
    setFileName(picked.name);
    try {
      const rows = await parseStockImportFile(picked);
      const mapped = mapStockImportRowsToLines({
        rows,
        mode,
        brands: catalog.brands,
        categories: catalog.categories,
        stores: catalog.stores,
        items,
      });
      if (!mapped.length) {
        toast.warning("No data rows found in the file.");
        setFileName("");
        return;
      }
      setLines(mapped);
      resetOtpState();
      const bad = mapped.filter((row) => !row._valid).length;
      if (bad) toast.warning(`${bad} row${bad === 1 ? "" : "s"} need attention.`);
      else toast.success(`${mapped.length} row${mapped.length === 1 ? "" : "s"} loaded.`);
    } catch (error) {
      setFileName("");
      toast.error(error.message || "Could not read the file.");
    } finally {
      setParsing(false);
    }
  };

  const openEditEditor = (line) => {
    setSupplyOpen(false);
    setEditor({ line: { ...line } });
    setEditorErrors({});
  };

  const closeEditor = () => {
    setEditor(null);
    setEditorErrors({});
  };

  const setEditorField = (key, value) => {
    setEditor((current) =>
      current ? { ...current, line: { ...current.line, [key]: value } } : current,
    );
    setEditorErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const commitEditor = () => {
    if (!editor) return;
    const [checked] = validateImportLines([editor.line], mode);
    const nextErrors = {};
    (checked._issues || []).forEach((msg) => {
      if (msg.toLowerCase().includes("brand")) nextErrors.brand = msg;
      else if (msg.toLowerCase().includes("category")) nextErrors.category = msg;
      else if (msg.toLowerCase().includes("name")) nextErrors.name = msg;
      else if (msg.toLowerCase().includes("package quantity")) nextErrors.quantity = msg;
      else if (msg.toLowerCase().includes("unit price")) nextErrors.unitCost = msg;
      else if (msg.toLowerCase().includes("packaging")) nextErrors.unitOfMeasure = msg;
      else if (msg.toLowerCase().includes("units per")) nextErrors.unitsPerPack = msg;
      else if (msg.toLowerCase().includes("store")) nextErrors.location = msg;
      else if (msg.toLowerCase().includes("base unit")) nextErrors.baseUnit = msg;
      else if (msg.toLowerCase().includes("item")) nextErrors.itemId = msg;
    });
    setEditorErrors(nextErrors);
    if (!checked._valid) {
      toast.warning("Fix the highlighted fields before saving.");
      return;
    }
    setLines((current) =>
      current.map((row) =>
        row.clientId === editor.line.clientId
          ? { ...editor.line, _issues: [], _valid: true }
          : row,
      ),
    );
    closeEditor();
    resetOtpState();
    toast.success("Item updated.");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setLines((current) => current.filter((row) => row.clientId !== deleteTarget.clientId));
    if (editor?.line.clientId === deleteTarget.clientId) closeEditor();
    setDeleteTarget(null);
    resetOtpState();
    toast.success("Item removed.");
  };

  const deliveryContactReady =
    Boolean(shared.deliveredByName.trim()) &&
    Boolean(shared.deliveredByPhone.trim()) &&
    Boolean(shared.deliveredByEmail.trim());

  const handleSendDeliveryOtp = async () => {
    if (!detailsConfirmed) {
      toast.warning("Confirm details first before sending the OTP.");
      return;
    }
    if (!deliveryContactReady) {
      toast.warning("Enter the delivery person’s name, phone, and email first.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shared.deliveredByEmail.trim())) {
      toast.warning("Enter a valid delivery email address.");
      return;
    }
    setOtpSending(true);
    try {
      await sendDeliveryOtp(shared.deliveredByPhone.trim(), OTP_TYPE.STOCK_DELIVERY);
      setOtp("");
      setOtpVerified(false);
      setOtpSent(true);
      toast.success(
        `OTP sent to ${shared.deliveredByName.trim()} on ${shared.deliveredByPhone.trim()}.`,
      );
    } catch (error) {
      toast.error(error.message || "Unable to send delivery OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const validateShared = () => {
    const sharedErrors = {};
    if (!shared.supplierId) sharedErrors.supplierId = "Select a supplier.";
    if (!shared.deliveredByName.trim()) {
      sharedErrors.deliveredByName = "Enter the delivery person’s full name.";
    }
    if (!shared.deliveredByPhone.trim()) {
      sharedErrors.deliveredByPhone = "Enter the delivery person’s phone number.";
    }
    if (!shared.deliveredByEmail.trim()) {
      sharedErrors.deliveredByEmail = "Enter the delivery person’s email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shared.deliveredByEmail.trim())) {
      sharedErrors.deliveredByEmail = "Enter a valid email address.";
    }
    setErrors({ shared: sharedErrors });
    if (Object.keys(sharedErrors).length) setSupplyOpen(true);
    return Object.keys(sharedErrors).length === 0;
  };

  const handleConfirmDetails = () => {
    if (editor) {
      toast.warning("Close the item editor first.");
      return;
    }
    if (!lines.length) {
      toast.warning("Upload at least one item first.");
      return;
    }
    if (!allReady) {
      toast.warning("Fix all item rows before confirming.");
      return;
    }
    if (!validateShared()) {
      toast.warning("Complete the required supply fields.");
      return;
    }
    setDetailsConfirmed(true);
    toast.success("Details confirmed. Send and confirm the OTP to finish.");
  };

  const prepareSave = () => {
    if (!detailsConfirmed) {
      handleConfirmDetails();
      return;
    }
    if (editor) {
      toast.warning("Close the item editor first.");
      return;
    }
    if (!lines.length || !allReady) {
      toast.warning("All uploaded rows must be ready before receiving.");
      return;
    }
    if (!validateShared()) {
      toast.warning("Complete the required supply fields.");
      return;
    }
    if (!otpVerified) {
      toast.warning("Confirm the delivery OTP before receiving stock.");
      return;
    }
    setPendingSave({
      mode,
      inventoryType: "accessory",
      shared,
      lines: validatedLines.map((line) => {
        const catalogItem = line.itemId
          ? items.find((item) => String(item.id) === String(line.itemId))
          : items.find(
              (item) =>
                String(item.itemCode || item.code || "").trim().toLowerCase() ===
                String(line.itemCode || "").trim().toLowerCase(),
            ) || null;
        const unitOfMeasure = normalizeInventoryUnit(line.unitOfMeasure);
        const baseUnit = mode === "existing"
          ? resolveItemBaseUnit(catalogItem?.unit || line.baseUnit)
          : normalizeBaseUnit(line.baseUnit || "piece");
        const totalQty = calcInventoryTotalQuantity(
          line.quantity,
          line.unitsPerPack,
          unitOfMeasure,
        );
        const unitNotes = buildInventoryUnitNotes({
          quantity: line.quantity,
          unitOfMeasure,
          unitsPerPack: line.unitsPerPack,
          baseUnit,
        });
        const notes = [shared.notes.trim(), unitNotes].filter(Boolean).join(" | ");
        const brandId = resolveCatalogId(
          line.brand || catalogItem?.brandId,
          catalog.brands,
          catalogItem?.brand,
        );
        const categoryId = resolveCatalogId(
          line.category || catalogItem?.categoryId,
          catalog.categories,
          catalogItem?.category,
        );
        return {
          ...line,
          quantity: totalQty ?? Number(line.quantity),
          unitCost: Number(line.unitCost),
          unitOfMeasure,
          unitsPerPack: line.unitsPerPack,
          baseUnit,
          unit: baseUnitApiValue(baseUnit),
          itemCode: line.itemCode || catalogItem?.code || catalogItem?.itemCode || "",
          brand: brandId != null ? String(brandId) : "",
          brandId: brandId != null ? brandId : null,
          category: categoryId != null ? String(categoryId) : "",
          categoryId: categoryId != null ? categoryId : null,
          condition: line.condition || shared.condition,
          notes,
        };
      }),
    });
  };

  const confirmSave = async () => {
    if (!pendingSave || saving) return;
    setSaving(true);
    try {
      await onSave?.(pendingSave);
      setPendingSave(null);
      onClose?.();
    } catch (error) {
      toast.error(error.message ?? "Could not import stock.");
    } finally {
      setSaving(false);
    }
  };

  const editorLine = editor?.line;
  const editorBaseUnit =
    mode === "existing"
      ? resolveItemBaseUnit(
          items.find((item) => item.id === editorLine?.itemId)?.unit || editorLine?.baseUnit,
        )
      : normalizeBaseUnit(editorLine?.baseUnit || "piece");

  return (
    <>
      <AddModal
        isOpen={isOpen && !pendingSave}
        onClose={onClose}
        onSave={prepareSave}
        fillViewport
        flushViewport
        title={mode === "existing" ? "Import registered stock" : "Import unregistered items"}
        subtitle="Upload an Excel template, review the list, confirm supply details and OTP."
        saveLabel={
          !detailsConfirmed
            ? "Confirm details"
            : `Receive ${lines.length} item${lines.length === 1 ? "" : "s"}`
        }
        saveDisabled={detailsConfirmed && !otpVerified}
        contentClassName="!p-0 overflow-hidden flex flex-col min-h-0"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 space-y-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            <RegistrationTabs value={mode} onChange={changeMode} />
            <CollapsibleSection
              title="Shared Supply Details"
              description="Supplier, delivery, and condition details that apply to every imported item."
              open={supplyOpen}
              onToggle={() => setSupplyOpen((prev) => !prev)}
              errorCount={Object.keys(errors.shared || {}).length}
            >
              <SharedSupplyFields
                value={shared}
                errors={errors.shared}
                onChange={setSharedField}
                onAddSupplier={() => setAddSupplierOpen(true)}
                supplierTick={supplierTick}
              />
            </CollapsibleSection>
            <DeliveryPersonOtpSection
              deliveredByName={shared.deliveredByName}
              deliveredByPhone={shared.deliveredByPhone}
              deliveredByEmail={shared.deliveredByEmail}
              otpSent={otpSent}
              otp={otp}
              otpVerified={otpVerified}
              onSendOtp={handleSendDeliveryOtp}
              onOtpChange={setOtp}
              onVerifiedChange={setOtpVerified}
              sendDisabled={!deliveryContactReady}
              sendLoading={otpSending}
              detailsConfirmed={detailsConfirmed}
            />
          </div>

          <div className="relative shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Item details ({lines.length})
                </p>
                <p className="text-[11px] text-slate-500">
                  {lines.length
                    ? `Total quantity ${totalQuantity} · ${formatInventoryMoney(totalValue)}${
                        issueCount ? ` · ${issueCount} with issues` : ""
                      }`
                    : "Upload a template to populate this list."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lines.length ? (
                  <>
                    <Button
                      type="button"
                      variant="info"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      disabled={downloading || parsing}
                    >
                      <Download size={14} />
                      {downloading ? "Preparing…" : "Download template"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                      disabled={parsing}
                    >
                      <Upload size={14} />
                      {parsing ? "Reading…" : "Replace file"}
                    </Button>
                  </>
                ) : null}
              </div>
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

            {lines.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <FileSpreadsheet className="text-slate-300" size={40} />
                <div className="max-w-lg space-y-3">
                  <p className="text-[13px] font-semibold text-slate-700">
                    No items uploaded yet
                  </p>
                  <ol className="list-decimal pl-5 text-left text-[12px] text-slate-500 leading-relaxed space-y-1.5">
                    <li>
                      Download the{" "}
                      <b>{mode === "existing" ? "registered" : "unregistered"}</b> items
                      template.
                    </li>
                    <li>
                      Fill each row using the dropdowns where available. Leave Condition blank to
                      use the shared default.
                    </li>
                    <li>
                      Upload the completed Excel file here, review the list, then confirm supply
                      details and OTP to receive stock.
                    </li>
                  </ol>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="info"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    disabled={downloading || parsing}
                  >
                    <Download size={14} />
                    {downloading ? "Preparing…" : "Download template"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={parsing}
                  >
                    <Upload size={14} />
                    {parsing ? "Reading…" : "Upload file"}
                  </Button>
                </div>
                {fileName ? (
                  <p className="text-[11px] text-slate-400">{fileName}</p>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto pb-8">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="sticky top-0 bg-slate-50/95">
                    <tr className="border-b border-slate-200">
                      <th className={thClass}>#</th>
                      <th className={thClass}>Item</th>
                      <th className={thClass}>Description</th>
                      <th className={thClass}>Package quantity</th>
                      <th className={thClass}>Total base quantity</th>
                      <th className={thClass}>Unit price (GHS)</th>
                      <th className={thClass}>Total price</th>
                      <th className={thClass}>Store</th>
                      <th className={thClass}>Status</th>
                      <th className={cn(thClass, "text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedLines.map((line, index) => {
                      const total = calcLineTotal(line);
                      const totalBaseQty = calcInventoryTotalQuantity(
                        line.quantity,
                        line.unitsPerPack,
                        line.unitOfMeasure,
                      );
                      return (
                        <tr
                          key={line.clientId}
                          className={cn(
                            "border-b border-slate-100",
                            !line._valid && "bg-amber-50/50",
                            editor?.line.clientId === line.clientId && "bg-slate-50",
                          )}
                        >
                          <td className={tdClass}>{index + 1}</td>
                          <td className={tdClass}>
                            <ItemNameDisplay value={lineDisplayName(line, mode)} />
                            {mode === "existing" && line.itemCode ? (
                              <p className="text-[10px] text-slate-400">{line.itemCode}</p>
                            ) : null}
                          </td>
                          <td className={cn(tdClass, "text-slate-500 max-w-[200px] truncate")}>
                            {line.description || "—"}
                          </td>
                          <td className={tdClass}>{line.quantity || "—"}</td>
                          <td className={tdClass}>
                            {totalBaseQty == null ? "—" : totalBaseQty}
                          </td>
                          <td className={tdClass}>
                            {line.unitCost === ""
                              ? "—"
                              : formatMoneyGhs(Number(line.unitCost))}
                          </td>
                          <td className={tdClass}>
                            {total == null ? "—" : formatMoneyGhs(total)}
                          </td>
                          <td className={cn(tdClass, "max-w-[180px] truncate")}>
                            <StoreLocationDisplay
                              value={
                                storeNameById.get(String(line.location)) ||
                                line.storeName ||
                                line.location
                              }
                            />
                          </td>
                          <td className={tdClass}>
                            {line._valid ? (
                              <span className="font-medium text-emerald-700">Ready</span>
                            ) : (
                              <span
                                className="font-medium text-amber-700"
                                title={line._issues.join("; ")}
                              >
                                {line._issues.join("; ")}
                              </span>
                            )}
                          </td>
                          <td className={tdClass}>
                            <TableRowActions className="justify-end">
                              <TableIconAction
                                title="Edit item"
                                icon={Pencil}
                                variant="edit"
                                iconSize={14}
                                onClick={() => openEditEditor(line)}
                              />
                              <TableIconAction
                                title="Delete item"
                                icon={Trash2}
                                variant="delete"
                                iconSize={14}
                                onClick={() => setDeleteTarget(line)}
                              />
                            </TableRowActions>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AddModal>

      <SlideOverSheet
        isOpen={Boolean(isOpen && editor && !pendingSave)}
        onClose={closeEditor}
        maxWidth="max-w-xl"
        backdropClassName="!z-[10040]"
        panelClassName="!z-[10050]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900">Edit imported item</h2>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              Update this row, then save it back to the list.
            </p>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close item sheet"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {editorLine ? (
            <div className="space-y-4">
              {mode === "existing" ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Item
                  </p>
                  <div className={readOnlyClassName}>
                    {lineDisplayName(editorLine, mode)}
                    {editorLine.itemCode ? ` · ${editorLine.itemCode}` : ""}
                  </div>
                </div>
              ) : (
                <>
                  <BrandSelect
                    value={editorLine.brand}
                    onChange={(value) => setEditorField("brand", value)}
                    error={editorErrors.brand}
                  />
                  <CategorySelect
                    value={editorLine.category}
                    onChange={(value) => setEditorField("category", value)}
                    error={editorErrors.category}
                  />
                  <InputField
                    label="Name"
                    required
                    value={editorLine.name}
                    onChange={(event) => setEditorField("name", event.target.value)}
                    error={editorErrors.name}
                    className={whiteInputClassName}
                  />
                </>
              )}
              <InputField
                label="Description"
                value={editorLine.description}
                onChange={(event) => setEditorField("description", event.target.value)}
                className={whiteInputClassName}
              />
              <InputField
                label="Package quantity"
                required
                type="number"
                min="1"
                value={editorLine.quantity}
                onChange={(event) => setEditorField("quantity", event.target.value)}
                error={editorErrors.quantity}
                className={whiteInputClassName}
              />
              <MoneyInputField
                label="Unit price (GHS)"
                required
                value={editorLine.unitCost}
                onChange={(event) => setEditorField("unitCost", event.target.value)}
                error={editorErrors.unitCost}
                className={whiteInputClassName}
              />
              <InventoryUnitFields
                idPrefix={`import-${editorLine.clientId}`}
                quantity={editorLine.quantity}
                baseUnit={editorBaseUnit}
                baseUnitEditable={mode === "new"}
                unitOfMeasure={editorLine.unitOfMeasure}
                unitsPerPack={editorLine.unitsPerPack}
                onBaseUnitChange={(value) => setEditorField("baseUnit", value)}
                onUnitChange={(value) => {
                  setEditorField("unitOfMeasure", value);
                  if (normalizeInventoryUnit(value) === "pieces") {
                    setEditorField("unitsPerPack", "");
                  }
                }}
                onUnitsPerPackChange={(value) => setEditorField("unitsPerPack", value)}
                errors={editorErrors}
                inputClassName={whiteInputClassName}
              />
              <StoreSelect
                value={editorLine.location}
                onChange={(value) => setEditorField("location", value)}
                error={editorErrors.location}
              />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Condition
                </label>
                <select
                  value={editorLine.condition || ""}
                  onChange={(event) => setEditorField("condition", event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Use shared default</option>
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
          <Button variant="outline" size="modal" onClick={closeEditor}>
            Cancel
          </Button>
          <Button size="modal" onClick={commitEditor}>
            Save changes
          </Button>
        </div>
      </SlideOverSheet>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDanger
        title="Remove item?"
        message={`Remove “${lineDisplayName(deleteTarget || {}, mode)}” from this import list?`}
        confirmText="Remove"
      />

      <ConfirmationModal
        isOpen={Boolean(pendingSave)}
        onClose={() => {
          if (saving) return;
          setPendingSave(null);
        }}
        onConfirm={confirmSave}
        closeOnConfirm={false}
        confirmLoading={saving}
        title="Receive imported stock?"
        message={`Receive ${pendingSave?.lines?.length || 0} item${
          (pendingSave?.lines?.length || 0) === 1 ? "" : "s"
        } into inventory?`}
        confirmText={saving ? "Receiving…" : "Receive stock"}
      />

      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onCreated={(created) => {
          setSupplierTick((tick) => tick + 1);
          setShared((current) => ({
            ...current,
            supplierId: created.id,
            supplierPhone: created.phone || "",
            supplierEmail: created.email || "",
          }));
          setErrors((current) => {
            const nextShared = { ...current.shared };
            delete nextShared.supplierId;
            return { ...current, shared: nextShared };
          });
          setAddSupplierOpen(false);
        }}
      />
    </>
  );
}
