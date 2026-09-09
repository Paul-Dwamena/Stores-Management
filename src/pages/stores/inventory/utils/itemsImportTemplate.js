import {
  BASE_UNIT_OPTIONS,
  INVENTORY_UNIT_OPTIONS,
  inventoryUnitRequiresPackSize,
  normalizeBaseUnit,
  normalizeInventoryUnit,
} from "./inventoryUnitOptions";

export const TEMPLATE_FILENAME_REGISTERED = "stock-import-registered.xlsx";
export const TEMPLATE_FILENAME_UNREGISTERED = "stock-import-unregistered.xlsx";

export const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BAD", label: "Bad" },
  { value: "BROKEN", label: "Broken" },
  { value: "PARTIALLY_DAMAGED", label: "Partially damaged" },
  { value: "DAMAGED", label: "Damaged" },
];

/** Readable Excel headers (Unregistered). */
export const UNREGISTERED_COLUMNS = [
  "Name",
  "Brand",
  "Category",
  "Description",
  "Package quantity",
  "Unit price(GHS)",
  "Base unit",
  "Packaging type",
  "Units per package",
  "Store location",
  "Condition",
];

/** Readable Excel headers (Registered). */
export const REGISTERED_COLUMNS = [
  "Item",
  "Package quantity",
  "Unit price(GHS)",
  "Packaging type",
  "Units per package",
  "Store location",
  "Condition",
];

/** Computed template-only columns (Excel formulas). */
export const CALCULATED_COLUMNS = ["Total base quantity", "Total price(GHS)"];

const DATA_SHEET = "Items";
const TEMPLATE_DATA_ROWS = 200;
const PIECES_LABEL = "Pieces";

/** Column letters for package qty / unit price / packaging / units-per-pack / formula cols. */
const TEMPLATE_FORMULA_LAYOUT = {
  existing: {
    packageQty: "B",
    unitPrice: "C",
    packaging: "D",
    unitsPerPack: "E",
    totalBaseQty: "H",
    totalPrice: "I",
  },
  new: {
    packageQty: "E",
    unitPrice: "F",
    packaging: "H",
    unitsPerPack: "I",
    totalBaseQty: "L",
    totalPrice: "M",
  },
};

const loadExcelJS = async () => {
  const mod = await import("exceljs");
  return mod.default ?? mod;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const cellText = (value) => {
  if (value == null) return "";
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part?.text ?? "").join("").trim();
    }
    if (value.text != null) return String(value.text).trim();
    if (value.result != null) return String(value.result).trim();
  }
  return String(value).trim();
};

const normalizeHeader = (value) =>
  cellText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const HEADER_ALIASES = {
  brand: "brand",
  category: "category",
  name: "name",
  item: "item",
  item_name: "item",
  item_code: "item",
  description: "description",
  package_quantity: "package_quantity",
  quantity: "package_quantity",
  unit_price_ghs: "unit_price",
  unit_price: "unit_price",
  total_price_ghs: "total_price",
  total_price: "total_price",
  base_unit: "base_unit",
  packaging_type: "packaging_type",
  units_per_package: "units_per_package",
  store_location: "store_location",
  store: "store_location",
  condition: "condition",
};

const packagingLabels = () => INVENTORY_UNIT_OPTIONS.map((o) => o.label);
const baseUnitLabels = () => BASE_UNIT_OPTIONS.map((o) => o.label);
const conditionLabels = () => CONDITION_OPTIONS.map((o) => o.label);

const sortAz = (values) =>
  [...values].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
  );

/** "Solar Cable - [ ITM-0042 ]" */
export const formatLabeledOption = (name, idOrCode) => {
  const label = String(name ?? "").trim();
  const key = String(idOrCode ?? "").trim();
  if (!label && !key) return "";
  if (!key) return label;
  if (!label) return `[ ${key} ]`;
  return `${label} - [ ${key} ]`;
};

/** Extract key from "Name - [ KEY ]" or bare key. */
export const parseLabeledOptionKey = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const bracket = text.match(/\[\s*([^\]]+?)\s*\]\s*$/);
  if (bracket) return bracket[1].trim();
  return text;
};

const matchByLabelOrValue = (raw, options) => {
  const text = String(raw || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  const byLabel = options.find((o) => o.label.toLowerCase() === lower);
  if (byLabel) return byLabel.value;
  const byValue = options.find((o) => String(o.value).toLowerCase() === lower);
  return byValue?.value || "";
};

/** Prefer bracketed id; fall back to bare id/name for older files. */
const matchByLabeledId = (raw, rows, { nameKey = "name", idKey = "id" } = {}) => {
  const text = String(raw || "").trim();
  if (!text) return null;
  const key = parseLabeledOptionKey(text);
  const keyLower = key.toLowerCase();
  const byId = rows.find((row) => String(row[idKey] ?? "").trim().toLowerCase() === keyLower);
  if (byId) return byId;
  // Legacy: plain name match
  const nameLower = text.toLowerCase();
  return (
    rows.find((row) => String(row[nameKey] || "").trim().toLowerCase() === nameLower) ||
    null
  );
};

const matchItem = (raw, items) => {
  const text = String(raw || "").trim();
  if (!text) return null;
  const key = parseLabeledOptionKey(text);
  const keyLower = key.toLowerCase();
  const byCode = items.find(
    (item) => String(item.code || item.itemCode || "").trim().toLowerCase() === keyLower,
  );
  if (byCode) return byCode;
  const byId = items.find((item) => String(item.id) === key);
  if (byId) return byId;
  // Legacy: plain name match
  const nameLower = text.toLowerCase();
  return (
    items.find((item) => String(item.name || "").trim().toLowerCase() === nameLower) ||
    null
  );
};

const addHiddenList = (sheet, col, header, values) => {
  sheet.getCell(1, col).value = header;
  values.forEach((value, index) => {
    sheet.getCell(index + 2, col).value = value;
  });
  sheet.getColumn(col).hidden = true;
  sheet.getColumn(col).width = 24;
};

const addListValidation = (sheet, range, listCol, count, { allowBlank = true, title, prompt } = {}) => {
  if (!count) return;
  const colLetter = sheet.getColumn(listCol).letter;
  sheet.dataValidations.add(range, {
    type: "list",
    allowBlank,
    formulae: [`=$${colLetter}$2:$${colLetter}$${count + 1}`],
    showErrorMessage: true,
    errorStyle: "error",
    errorTitle: title || "Invalid value",
    error: 'Click "Cancel" and select a value from the dropdown.',
    showInputMessage: Boolean(prompt),
    promptTitle: title,
    prompt,
  });
};

export function isImportSpreadsheetFile(file) {
  if (!(file instanceof File)) return false;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

export async function downloadStockImportTemplate({
  mode = "existing",
  brands = [],
  categories = [],
  stores = [],
  items = [],
} = {}) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Store Management";
  const sheet = workbook.addWorksheet(DATA_SHEET);
  const registered = mode === "existing";
  const inputHeaders = registered ? REGISTERED_COLUMNS : UNREGISTERED_COLUMNS;
  const headers = [...inputHeaders, ...CALCULATED_COLUMNS];
  sheet.addRow(headers);

  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  const calculatedHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF14532D" },
  };
  const headerFont = {
    bold: true,
    name: "Calibri",
    size: 11,
    color: { argb: "FFFFFFFF" },
  };
  const thinBorder = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };
  const headerBorder = {
    top: { style: "thin", color: { argb: "FF0F172A" } },
    left: { style: "thin", color: { argb: "FF334155" } },
    bottom: { style: "thin", color: { argb: "FF0F172A" } },
    right: { style: "thin", color: { argb: "FF334155" } },
  };
  const calculatedFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECFDF5" },
  };
  const calculatedFont = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF14532D" },
  };

  const headerRow = sheet.getRow(1);
  headerRow.height = 24;

  // Style every header cell individually so the fill spans the full used row.
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    const isCalculated = CALCULATED_COLUMNS.includes(header);
    cell.value = header;
    cell.fill = isCalculated ? calculatedHeaderFill : headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = headerBorder;
  });

  const dropdownHeaders = new Set([
    "Item",
    "Brand",
    "Category",
    "Base unit",
    "Packaging type",
    "Store location",
    "Condition",
  ]);

  headers.forEach((header, index) => {
    const col = index + 1;
    const column = sheet.getColumn(col);
    if (header === "Item" || header === "Store location") {
      column.width = 42;
    } else if (header === "Description" || header === "Name") {
      column.width = 28;
    } else if (CALCULATED_COLUMNS.includes(header)) {
      column.width = 20;
    } else {
      column.width = 18;
    }

    const isDropdown = dropdownHeaders.has(header);
    const isCalculated = CALCULATED_COLUMNS.includes(header);
    for (let row = 2; row <= TEMPLATE_DATA_ROWS + 1; row += 1) {
      const cell = sheet.getCell(row, col);
      cell.border = thinBorder;
      if (isCalculated) {
        cell.fill = calculatedFill;
        cell.font = calculatedFont;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else {
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: isDropdown,
          color: { argb: isDropdown ? "FF0F172A" : "FF334155" },
        };
        if (isDropdown) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        }
      }
    }
  });

  const layout = registered ? TEMPLATE_FORMULA_LAYOUT.existing : TEMPLATE_FORMULA_LAYOUT.new;
  const priceNumFmt = "#,##0.00";
  const calcPrompt = {
    showInputMessage: true,
    promptTitle: "Calculated",
    prompt: "Do not edit this cell. It updates automatically from package quantity, packaging, and unit price.",
    allowBlank: true,
  };

  // Format unit price input column (no GHS prefix).
  for (let row = 2; row <= TEMPLATE_DATA_ROWS + 1; row += 1) {
    sheet.getCell(`${layout.unitPrice}${row}`).numFmt = priceNumFmt;
  }

  for (let row = 2; row <= TEMPLATE_DATA_ROWS + 1; row += 1) {
    const qty = `${layout.packageQty}${row}`;
    const price = `${layout.unitPrice}${row}`;
    const packaging = `${layout.packaging}${row}`;
    const perPack = `${layout.unitsPerPack}${row}`;
    const baseRef = `${layout.totalBaseQty}${row}`;
    const baseQtyCell = sheet.getCell(baseRef);
    const totalPriceCell = sheet.getCell(`${layout.totalPrice}${row}`);

    // Short-circuit blanks to avoid #VALUE! on empty rows.
    baseQtyCell.value = {
      formula: `IF(${qty}="","",IF(OR(${packaging}="",${packaging}="${PIECES_LABEL}"),${qty},IF(N(${perPack})=0,${qty},${qty}*N(${perPack}))))`,
    };
    baseQtyCell.numFmt = "#,##0.##";
    baseQtyCell.dataValidation = {
      type: "custom",
      formulae: ["TRUE"],
      ...calcPrompt,
      showErrorMessage: false,
    };

    totalPriceCell.value = {
      formula: `IF(OR(${baseRef}="",${price}=""),"",${baseRef}*${price})`,
    };
    totalPriceCell.numFmt = priceNumFmt;
    totalPriceCell.dataValidation = {
      type: "custom",
      formulae: ["TRUE"],
      ...calcPrompt,
      showErrorMessage: false,
    };
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const endRow = TEMPLATE_DATA_ROWS + 1;
  // Hidden lookup lists start at column AA (27)
  let listCol = 27;

  if (registered) {
    const itemLabels = sortAz(
      items
        .map((item) => {
          const code = item.code || item.itemCode;
          if (!code) return "";
          return formatLabeledOption(String(item.name || "").toUpperCase(), code);
        })
        .filter(Boolean),
    );
    addHiddenList(sheet, listCol, "_items", itemLabels);
    addListValidation(sheet, `A2:A${endRow}`, listCol, itemLabels.length, {
      allowBlank: false,
      title: "Item",
      prompt: "Select a registered item.",
    });
    listCol += 1;

    const packLabels = sortAz(packagingLabels());
    addHiddenList(sheet, listCol, "_packaging", packLabels);
    addListValidation(sheet, `D2:D${endRow}`, listCol, packLabels.length, {
      allowBlank: false,
      title: "Packaging type",
    });
    listCol += 1;

    const storeLabels = sortAz(
      stores
        .map((s) => formatLabeledOption(String(s.name || "").toUpperCase(), s.id))
        .filter(Boolean),
    );
    addHiddenList(sheet, listCol, "_stores", storeLabels);
    addListValidation(sheet, `F2:F${endRow}`, listCol, storeLabels.length, {
      allowBlank: false,
      title: "Store location",
    });
    listCol += 1;

    const condLabels = sortAz(conditionLabels());
    addHiddenList(sheet, listCol, "_conditions", condLabels);
    addListValidation(sheet, `G2:G${endRow}`, listCol, condLabels.length, {
      allowBlank: true,
      title: "Condition",
      prompt: "Optional. Uses shared condition when empty.",
    });
  } else {
    // Name | Brand | Category | Description | Package quantity | Unit price |
    // Base unit | Packaging type | Units per package | Store location | Condition
    const brandLabels = sortAz(
      brands
        .map((b) => formatLabeledOption(String(b.name || "").toUpperCase(), b.id))
        .filter(Boolean),
    );
    addHiddenList(sheet, listCol, "_brands", brandLabels);
    addListValidation(sheet, `B2:B${endRow}`, listCol, brandLabels.length, {
      allowBlank: false,
      title: "Brand",
    });
    listCol += 1;

    const categoryLabels = sortAz(
      categories
        .map((c) => formatLabeledOption(String(c.name || "").toUpperCase(), c.id))
        .filter(Boolean),
    );
    addHiddenList(sheet, listCol, "_categories", categoryLabels);
    addListValidation(sheet, `C2:C${endRow}`, listCol, categoryLabels.length, {
      allowBlank: false,
      title: "Category",
    });
    listCol += 1;

    const unitLabels = sortAz(baseUnitLabels());
    addHiddenList(sheet, listCol, "_base_units", unitLabels);
    addListValidation(sheet, `G2:G${endRow}`, listCol, unitLabels.length, {
      allowBlank: false,
      title: "Base unit",
    });
    listCol += 1;

    const packLabels = sortAz(packagingLabels());
    addHiddenList(sheet, listCol, "_packaging", packLabels);
    addListValidation(sheet, `H2:H${endRow}`, listCol, packLabels.length, {
      allowBlank: false,
      title: "Packaging type",
    });
    listCol += 1;

    const storeLabels = sortAz(
      stores
        .map((s) => formatLabeledOption(String(s.name || "").toUpperCase(), s.id))
        .filter(Boolean),
    );
    addHiddenList(sheet, listCol, "_stores", storeLabels);
    addListValidation(sheet, `J2:J${endRow}`, listCol, storeLabels.length, {
      allowBlank: false,
      title: "Store location",
    });
    listCol += 1;

    const condLabels = sortAz(conditionLabels());
    addHiddenList(sheet, listCol, "_conditions", condLabels);
    addListValidation(sheet, `K2:K${endRow}`, listCol, condLabels.length, {
      allowBlank: true,
      title: "Condition",
      prompt: "Optional. Uses shared condition when empty.",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    registered ? TEMPLATE_FILENAME_REGISTERED : TEMPLATE_FILENAME_UNREGISTERED,
  );
}

const rowsFromWorksheet = (worksheet) => {
  if (!worksheet) return [];
  const headerRow = worksheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = HEADER_ALIASES[normalizeHeader(cell.value)];
    if (key) headerMap[key] = colNumber;
  });

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (key) =>
      headerMap[key] ? cellText(row.getCell(headerMap[key]).value) : "";
    const record = {
      brand: get("brand"),
      category: get("category"),
      name: get("name"),
      item: get("item"),
      description: get("description"),
      package_quantity: get("package_quantity"),
      unit_price: get("unit_price"),
      base_unit: get("base_unit"),
      packaging_type: get("packaging_type"),
      units_per_package: get("units_per_package"),
      store_location: get("store_location"),
      condition: get("condition"),
      _sourceRow: rowNumber,
    };
    const hasAny = Object.entries(record).some(
      ([key, value]) => key !== "_sourceRow" && String(value || "").trim(),
    );
    if (!hasAny) return;
    rows.push(record);
  });
  return rows;
};

const parseCsvText = (text) => {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const parseLine = (line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else current += char;
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map((h) => HEADER_ALIASES[normalizeHeader(h)]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseLine(lines[i]);
    const record = {
      brand: "",
      category: "",
      name: "",
      item: "",
      description: "",
      package_quantity: "",
      unit_price: "",
      base_unit: "",
      packaging_type: "",
      units_per_package: "",
      store_location: "",
      condition: "",
      _sourceRow: i + 1,
    };
    headers.forEach((key, index) => {
      if (key) record[key] = cells[index] || "";
    });
    const hasAny = Object.entries(record).some(
      ([key, value]) => key !== "_sourceRow" && String(value || "").trim(),
    );
    if (!hasAny) continue;
    rows.push(record);
  }
  return rows;
};

export async function parseStockImportFile(file) {
  if (!(file instanceof File)) throw new Error("Choose an Excel or CSV file.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsvText(await file.text());
  }
  if (name.endsWith(".xls")) {
    throw new Error("Please save as .xlsx or .csv, then upload again.");
  }
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet(DATA_SHEET) || workbook.worksheets[0];
  return rowsFromWorksheet(sheet);
}

function createClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Map parsed spreadsheet rows → bulk receipt line objects.
 */
export function mapStockImportRowsToLines({
  rows = [],
  mode = "existing",
  brands = [],
  categories = [],
  stores = [],
  items = [],
} = {}) {
  return rows.map((row) => {
    const issues = [];
    const packageQty = row.package_quantity;
    const unitPrice = row.unit_price;
    const unitOfMeasure = matchByLabelOrValue(row.packaging_type, INVENTORY_UNIT_OPTIONS);
    const condition = matchByLabelOrValue(row.condition, CONDITION_OPTIONS);
    const store = matchByLabeledId(row.store_location, stores);

    const line = {
      clientId: createClientId(),
      itemId: "",
      itemCode: "",
      name: "",
      brand: "",
      category: "",
      description: row.description || "",
      quantity: packageQty,
      baseUnit: "piece",
      unitOfMeasure,
      unitsPerPack: row.units_per_package || "",
      unitCost: unitPrice,
      location: store ? String(store.id) : "",
      storeName: store?.name || row.store_location || "",
      condition: condition || "",
      notes: "",
      mode,
      inventoryType: "accessory",
      _sourceRow: row._sourceRow,
      _issues: issues,
    };

    if (mode === "existing") {
      const item = matchItem(row.item, items);
      if (!item) issues.push("Unknown item");
      else {
        line.itemId = item.id;
        line.itemCode = item.code || item.itemCode || "";
        line.name = item.name || "";
        if (!line.itemCode) issues.push("Item has no code");
      }
    } else {
      const brand = matchByLabeledId(row.brand, brands);
      const category = matchByLabeledId(row.category, categories);
      const baseUnit = matchByLabelOrValue(row.base_unit, BASE_UNIT_OPTIONS)
        || normalizeBaseUnit(row.base_unit);
      line.name = row.name || "";
      line.brand = brand ? String(brand.id) : "";
      line.category = category ? String(category.id) : "";
      line.baseUnit = baseUnit || "piece";
      if (!brand) issues.push("Unknown brand");
      if (!category) issues.push("Unknown category");
      if (!line.name.trim()) issues.push("Name is required");
      if (!baseUnit) issues.push("Base unit is required");
    }

    if (!packageQty || Number(packageQty) <= 0) issues.push("Package quantity is required");
    if (unitPrice === "" || Number(unitPrice) < 0 || Number.isNaN(Number(unitPrice))) {
      issues.push("Unit price is required");
    }
    if (!unitOfMeasure) issues.push("Packaging type is required");
    if (inventoryUnitRequiresPackSize(unitOfMeasure)) {
      const perPack = Number(row.units_per_package);
      if (!Number.isFinite(perPack) || perPack <= 0) {
        issues.push("Units per package is required");
      }
    }
    if (!store) issues.push("Unknown store location");

    line._issues = issues;
    line._valid = issues.length === 0;
    return line;
  });
}

export function validateImportLines(lines, mode) {
  return (lines || []).map((line, index) => {
    const issues = [];
    if (mode === "existing") {
      if (!line.itemCode && !line.itemId) issues.push("Item is required");
    } else {
      if (!line.brand) issues.push("Brand is required");
      if (!line.category) issues.push("Category is required");
      if (!String(line.name || "").trim()) issues.push("Name is required");
      if (!normalizeBaseUnit(line.baseUnit)) issues.push("Base unit is required");
    }
    if (!line.quantity || Number(line.quantity) <= 0) {
      issues.push("Package quantity is required");
    }
    if (line.unitCost === "" || Number(line.unitCost) < 0 || Number.isNaN(Number(line.unitCost))) {
      issues.push("Unit price is required");
    }
    const uom = normalizeInventoryUnit(line.unitOfMeasure);
    if (!uom) issues.push("Packaging type is required");
    if (inventoryUnitRequiresPackSize(uom)) {
      const perPack = Number(line.unitsPerPack);
      if (!Number.isFinite(perPack) || perPack <= 0) {
        issues.push("Units per package is required");
      }
    }
    if (!line.location) issues.push("Store location is required");

    return {
      ...line,
      _index: index + 1,
      _issues: issues,
      _valid: issues.length === 0,
    };
  });
}
