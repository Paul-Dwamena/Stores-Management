export const FIELD_TYPE_PREVIEW_LEVEL_ID = "field_type_preview";

function previewLeaf({ id, name, fieldType, sortOrder = 0, ...rest }) {
  const key = `preview${id.charAt(0).toUpperCase()}${id.slice(1)}`;
  const folderId = `${FIELD_TYPE_PREVIEW_LEVEL_ID}/preview_folder`;
  return {
    id: `${folderId}/${id}`,
    name,
    code: name.slice(0, 4).toUpperCase(),
    level: 3,
    parentId: folderId,
    description: rest.description || "",
    isLocked: false,
    isActive: true,
    key,
    formKey: key,
    fieldType,
    minLength: null,
    maxLength: null,
    required: false,
    isDefaultLocked: false,
    isHidden: false,
    sortOrder,
    colSpan: rest.colSpan ?? 1,
    placeholder: rest.placeholder || "",
    defaultValue: rest.defaultValue ?? "",
    options: rest.options || null,
    optionsSource: rest.optionsSource || "manual",
    dropdownOptionId: "",
    searchSelectSource: rest.searchSelectSource || null,
    acceptedFileTypes: rest.acceptedFileTypes || null,
    children: [],
  };
}

/** Session-only Level 1 with the Search select field type for styling review. */
export function buildFieldTypePreviewLevel({ columns = 2 } = {}) {
  const folderId = `${FIELD_TYPE_PREVIEW_LEVEL_ID}/preview_folder`;
  const leaves = [
    previewLeaf({
      id: "search_select",
      name: "Search select",
      fieldType: "search_select",
      columns,
      sortOrder: 0,
      colSpan: columns,
      placeholder: "Search vehicles…",
      searchSelectSource: "vehicles",
    }),
  ];

  return {
    id: FIELD_TYPE_PREVIEW_LEVEL_ID,
    name: "Field type preview",
    code: "PREV",
    level: 1,
    parentId: null,
    description: "Temporary Search select preview. Remove after sign-off.",
    isLocked: false,
    isActive: true,
    isHidden: false,
    isDefaultLocked: false,
    sortOrder: 99,
    columns,
    children: [
      {
        id: folderId,
        name: "Preview folder",
        code: "PFOL",
        level: 2,
        parentId: FIELD_TYPE_PREVIEW_LEVEL_ID,
        description: "Sample Search select field for styling review.",
        isLocked: false,
        isActive: true,
        isHidden: false,
        isDefaultLocked: false,
        sortOrder: 0,
        columns,
        children: leaves,
      },
    ],
  };
}

function treeHasSearchSelectPreview(tree = []) {
  const walk = (nodes = []) =>
    nodes.some((node) => node?.fieldType === "search_select" || walk(node.children || []));
  const root = tree.find((node) => node.id === FIELD_TYPE_PREVIEW_LEVEL_ID);
  return Boolean(root && walk(root.children || []));
}

/** Inject or replace the session Field type preview so Search select is present. */
export function ensureFieldTypePreviewLevel(treeStore, { enabled = true, columns = 2 } = {}) {
  if (!enabled || !treeStore) return;
  const tree = treeStore.get();
  if (treeHasSearchSelectPreview(tree)) return;
  const next = tree.filter((node) => node.id !== FIELD_TYPE_PREVIEW_LEVEL_ID);
  const maxSort = next.reduce((max, node) => Math.max(max, Number(node.sortOrder) || 0), -1);
  treeStore.set([
    ...next,
    {
      ...buildFieldTypePreviewLevel({ columns }),
      sortOrder: Math.max(maxSort + 1, 99),
    },
  ]);
}
