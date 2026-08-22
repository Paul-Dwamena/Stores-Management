/**
 * Shared hide / disable / insert-position helpers for Forms & Templates trees.
 */

import { getPositionLockedPrefixCount } from "../../utils/formTreePositionLock";

export function canHideFormNode(node) {
  if (!node || node.isLocked) return false;
  // System folders are not hideable; system leaves only if not required.
  if (node.isDefaultLocked === true) {
    if (!node.key) return false;
    return node.required !== true;
  }
  return true;
}

export function canDisableFormNode(node) {
  return Boolean(node) && !node.isLocked && node.isDefaultLocked !== true;
}

export function resolveInsertIndex(siblings = [], insertAt = "last") {
  const list = Array.isArray(siblings) ? siblings : [];
  const lockedPrefix = getPositionLockedPrefixCount(list);
  if (insertAt === "first") return lockedPrefix;
  if (!insertAt || insertAt === "last") return list.length;
  if (String(insertAt).startsWith("after:")) {
    const id = String(insertAt).slice("after:".length);
    const idx = list.findIndex((item) => item?.id === id);
    if (idx < 0) return list.length;
    return Math.max(idx + 1, lockedPrefix);
  }
  return list.length;
}

export function insertChildAt(children = [], child, insertAt = "last") {
  const next = [...(children || [])];
  const index = resolveInsertIndex(next, insertAt);
  next.splice(index, 0, child);
  return next.map((node, i) => ({ ...node, sortOrder: i }));
}

export function getInsertPositionOptions(siblings = []) {
  const list = Array.isArray(siblings) ? siblings : [];
  return [
    { value: "last", label: "Last (default)" },
    { value: "first", label: "First" },
    ...list.map((node) => ({
      value: `after:${node.id}`,
      label: `After “${node.name}”`,
    })),
  ];
}

export function getCurrentInsertAt(siblings = [], nodeId) {
  const list = Array.isArray(siblings) ? siblings : [];
  const idx = list.findIndex((node) => String(node?.id) === String(nodeId));
  if (idx < 0 || idx === list.length - 1) return "last";
  if (idx === 0) return "first";
  return `after:${list[idx - 1].id}`;
}

/** Move an old locked Others root under Main, then drop the Others Level 1. */
export function foldOthersIntoMain(tree = [], mainId = "main_form", othersId = "others") {
  const others = (tree || []).find((node) => node.id === othersId);
  const rest = (tree || []).filter((node) => node.id !== othersId);
  if (!others) return rest;
  const extras = others.children || [];
  if (!extras.length) return rest;
  return rest.map((node) => {
    if (node.id !== mainId) return node;
    const existing = node.children || [];
    return {
      ...node,
      children: [
        ...existing,
        ...extras.map((child, index) => ({
          ...child,
          parentId: mainId,
          sortOrder: existing.length + index,
        })),
      ],
    };
  });
}

export function applySiblingInsertAt(nodes = [], nodeId, insertAt = "last") {
  if (!nodeId || !insertAt) return nodes;

  const relocate = (list = []) => {
    const from = list.findIndex((node) => String(node?.id) === String(nodeId));
    if (from >= 0) {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(resolveInsertIndex(next, insertAt), 0, item);
      return next.map((node, index) => ({ ...node, sortOrder: index }));
    }
    return list.map((node) => ({
      ...node,
      children: node.children?.length ? relocate(node.children) : node.children || [],
    }));
  };

  return relocate(nodes);
}

export function buildOptionsFieldsFromPayload(payload = {}, fieldType, normalizeOptions, existing = {}) {
  if (fieldType === "search_select") {
    const nextSource =
      payload.optionsSource !== undefined
        ? payload.optionsSource
        : existing.optionsSource;
    if (nextSource === "dropdown") {
      return {
        options: null,
        optionsSource: "dropdown",
        dropdownOptionId:
          payload.dropdownOptionId !== undefined
            ? (payload.dropdownOptionId?.trim() || null)
            : (existing.dropdownOptionId || null),
        searchSelectSource: null,
      };
    }
    const source =
      payload.searchSelectSource !== undefined
        ? payload.searchSelectSource
        : existing.searchSelectSource;
    return {
      options: null,
      optionsSource: "source",
      dropdownOptionId: null,
      searchSelectSource: String(source ?? "").trim() || null,
    };
  }

  if (fieldType !== "select" && fieldType !== "radio" && fieldType !== "checklist") {
    return {
      options: null,
      optionsSource: null,
      dropdownOptionId: null,
      searchSelectSource: null,
    };
  }

  const nextSource =
    payload.optionsSource !== undefined
      ? payload.optionsSource
      : existing.optionsSource;

  if (fieldType === "select" && nextSource === "dropdown") {
    return {
      options: null,
      optionsSource: "dropdown",
      dropdownOptionId:
        payload.dropdownOptionId !== undefined
          ? (payload.dropdownOptionId?.trim() || null)
          : (existing.dropdownOptionId || null),
      searchSelectSource: null,
    };
  }

  return {
    options: normalizeOptions(payload.options ?? existing.options),
    optionsSource: "manual",
    dropdownOptionId: null,
    searchSelectSource: null,
  };
}

export function assertCanHideFormNode(node) {
  if (!node) throw new Error("Node not found.");
  if (node.isLocked) {
    throw new Error("Level 1 sections cannot be hidden.");
  }
  if (node.isDefaultLocked && !node.key) {
    throw new Error("System folders cannot be hidden.");
  }
  if (node.isDefaultLocked && node.required === true) {
    throw new Error("Required system fields cannot be hidden.");
  }
}
