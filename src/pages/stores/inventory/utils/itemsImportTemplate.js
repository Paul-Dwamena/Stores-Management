import { BASE_UNIT_OPTIONS } from "./inventoryUnitOptions";

export const IMPORT_COLUMNS = ["name", "brand_id", "category_id", "description", "unit"];
export const TEMPLATE_FILENAME = "items-import-template.xlsx";
export const IMPORT_CSV_FILENAME = "items-import.csv";

const DATA_SHEET = "Items";
const TEMPLATE_DATA_ROWS = 200;

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
    if (value.sharedFormula != null || value.formula != null) {
      return value.result != null ? String(value.result).trim() : "";
    }
  }
  return String(value).trim();
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

/** Import units use canonical keys (piece, not pcs). */
const unitChoices = () =>
  BASE_UNIT_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

/** Dropdown label: "12 | Brand Name". Still accepts bare IDs. */
export const formatCatalogOption = (id, name) => {
  const safeId = String(id ?? "").trim();
  const safeName = String(name ?? "").trim();
  if (!safeId) return "";
  return safeName ? `${safeId} | ${safeName}` : safeId;
};

export const parseCatalogId = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) return text;
  // "12 | Brand Name", "12 - Brand", "12: Brand"
  const labeled = text.match(/^(\d+)\s*(?:\||[-–—:])\s*/);
  if (labeled) return labeled[1];
  const leading = text.match(/^(\d+)/);
  return leading ? leading[1] : "";
};

export function isImportSpreadsheetFile(file) {
  if (!(file instanceof File)) return false;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

export async function downloadItemsImportTemplate({ brands = [], categories = [] } = {}) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Store Management";
  workbook.created = new Date();

  const items = workbook.addWorksheet(DATA_SHEET);

  items.addRow(IMPORT_COLUMNS);
  items.getRow(1).font = { bold: true };
  items.getColumn(1).width = 24;
  items.getColumn(2).width = 28;
  items.getColumn(3).width = 28;
  items.getColumn(4).width = 36;
  items.getColumn(5).width = 14;

  // Hidden same-sheet lists (AA–AC) power the dropdowns.
  const BRAND_LIST_COL = 27; // AA
  const CATEGORY_LIST_COL = 28; // AB
  const UNIT_LIST_COL = 29; // AC
  items.getCell(1, BRAND_LIST_COL).value = "_brand_ids";
  items.getCell(1, CATEGORY_LIST_COL).value = "_category_ids";
  items.getCell(1, UNIT_LIST_COL).value = "_units";

  brands.forEach((brand, index) => {
    items.getCell(index + 2, BRAND_LIST_COL).value = formatCatalogOption(
      brand.id,
      brand.name,
    );
  });
  categories.forEach((category, index) => {
    items.getCell(index + 2, CATEGORY_LIST_COL).value = formatCatalogOption(
      category.id,
      category.name,
    );
  });
  const units = unitChoices();
  units.forEach((unit, index) => {
    items.getCell(index + 2, UNIT_LIST_COL).value = unit.value;
  });

  [BRAND_LIST_COL, CATEGORY_LIST_COL, UNIT_LIST_COL].forEach((col) => {
    items.getColumn(col).hidden = true;
    items.getColumn(col).width = col === UNIT_LIST_COL ? 12 : 32;
  });

  const dataEndRow = TEMPLATE_DATA_ROWS + 1;

  if (brands.length) {
    items.dataValidations.add(`B2:B${dataEndRow}`, {
      type: "list",
      allowBlank: false,
      formulae: [`=$AA$2:$AA$${brands.length + 1}`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid brand",
      error: "Select a brand from the dropdown.",
      showInputMessage: true,
      promptTitle: "Brand",
      prompt: "Select brand (ID | name). Required.",
    });
  }

  if (categories.length) {
    items.dataValidations.add(`C2:C${dataEndRow}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$AB$2:$AB$${categories.length + 1}`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid category",
      error: "Select a category from the dropdown.",
      showInputMessage: true,
      promptTitle: "Category",
      prompt: "Select category (ID | name). Only the ID is sent on import.",
    });
  }

  if (units.length) {
    items.dataValidations.add(`E2:E${dataEndRow}`, {
      type: "list",
      allowBlank: false,
      formulae: [`=$AC$2:$AC$${units.length + 1}`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "Invalid unit",
      error: "Select a unit from the dropdown.",
      showInputMessage: true,
      promptTitle: "Base unit",
      prompt: "Pick a base unit (required).",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    TEMPLATE_FILENAME,
  );
}

const normalizeHeader = (value) =>
  cellText(value).toLowerCase().replace(/\s+/g, "_");

const pickWorksheet = (workbook) => {
  const named = workbook.getWorksheet(DATA_SHEET);
  if (named) return named;
  return workbook.worksheets[0] || null;
};

const rowsFromWorksheet = (worksheet) => {
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(cell.value);
    if (IMPORT_COLUMNS.includes(key)) headerMap[key] = colNumber;
  });

  const missing = IMPORT_COLUMNS.filter((column) => !headerMap[column]);
  if (missing.length) {
    throw new Error(
      `Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
    );
  }

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    IMPORT_COLUMNS.forEach((column) => {
      record[column] = cellText(row.getCell(headerMap[column]).value);
    });
    const hasAny = IMPORT_COLUMNS.some((column) => record[column]);
    if (!hasAny) return;
    rows.push({
      ...record,
      _sourceRow: rowNumber,
    });
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
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map(normalizeHeader);
  const missing = IMPORT_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(
      `Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
    );
  }

  const indexByColumn = Object.fromEntries(
    IMPORT_COLUMNS.map((column) => [column, headers.indexOf(column)]),
  );

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseLine(lines[i]);
    const record = {};
    IMPORT_COLUMNS.forEach((column) => {
      record[column] = String(cells[indexByColumn[column]] ?? "").trim();
    });
    const hasAny = IMPORT_COLUMNS.some((column) => record[column]);
    if (!hasAny) continue;
    rows.push({
      ...record,
      _sourceRow: i + 1,
    });
  }
  return rows;
};

export async function parseItemsImportFile(file) {
  if (!(file instanceof File)) {
    throw new Error("Choose an Excel or CSV file to import.");
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    const text = await file.text();
    return parseCsvText(text);
  }

  if (name.endsWith(".xls")) {
    throw new Error("Please save as .xlsx or .csv, then upload again.");
  }

  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  return rowsFromWorksheet(pickWorksheet(workbook));
}

export function validateImportPreviewRows(rows) {
  return (rows || []).map((row, index) => {
    const brandRaw = String(row.brand_id ?? "").trim();
    const categoryRaw = String(row.category_id ?? "").trim();
    const brandId = parseCatalogId(brandRaw);
    const categoryId = parseCatalogId(categoryRaw);
    const issues = [];

    // Import API requires name; unit is mandatory for stock tracking; brand is required.
    if (!String(row.name ?? "").trim()) issues.push("Name is required");
    if (!brandId) issues.push("brand_id is required");
    if (!String(row.unit ?? "").trim()) issues.push("unit is required");

    // category_id is optional, but must be parseable when provided.
    if (categoryRaw && !categoryId) issues.push("Invalid category_id");

    return {
      ...row,
      _index: index + 1,
      _issues: issues,
      _valid: issues.length === 0,
    };
  });
}

export function rowsToImportCsvFile(rows) {
  const lines = [
    IMPORT_COLUMNS.join(","),
    ...(rows || []).map((row) =>
      IMPORT_COLUMNS.map((column) => {
        if (column === "brand_id" || column === "category_id") {
          return escapeCsv(parseCatalogId(row[column]));
        }
        return escapeCsv(row[column] ?? "");
      }).join(","),
    ),
  ];
  const blob = new Blob([`${lines.join("\n")}\n`], {
    type: "text/csv;charset=utf-8;",
  });
  return new File([blob], IMPORT_CSV_FILENAME, { type: "text/csv" });
}
