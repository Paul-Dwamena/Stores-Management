import {
  canReorderFormNode,
  getPositionLockedPrefixCount,
} from "./formTreePositionLock";

function canSwapSiblings(left, right) {
  return canReorderFormNode(left) && canReorderFormNode(right);
}

function relativeInsertIndex(from, to, place) {
  let insertAt = to;
  if (place === "after") insertAt += 1;
  if (from < insertAt) insertAt -= 1;
  return insertAt;
}

/**
 * Reorder a node among its siblings in a nested children tree.
 * Also stamps sortOrder (0..n) on every sibling list so consumers can rely on it.
 * @param {Array} nodes
 * @param {string|number} nodeId
 * @param {"up"|"down"} direction
 * @returns {{ nodes: Array, moved: boolean }}
 */
export function reorderTreeSibling(nodes = [], nodeId, direction) {
  const id = String(nodeId);

  const withSortOrder = (list = []) =>
    list.map((node, index) => ({
      ...node,
      sortOrder: index,
      children: withSortOrder(node.children || []),
    }));

  const reorderList = (list = []) => {
    const index = list.findIndex((node) => String(node.id) === id);
    if (index >= 0) {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) {
        return { list: withSortOrder(list), found: true, moved: false };
      }
      if (!canSwapSiblings(list[index], list[targetIndex])) {
        return { list: withSortOrder(list), found: true, moved: false };
      }
      const next = [...list];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { list: withSortOrder(next), found: true, moved: true };
    }

    let found = false;
    let moved = false;
    const next = list.map((node) => {
      const children = node.children || [];
      if (!children.length) return node;
      const result = reorderList(children);
      if (!result.found) return node;
      found = true;
      moved = result.moved;
      return { ...node, children: result.list };
    });

    return { list: withSortOrder(next), found, moved };
  };

  const result = reorderList(nodes);
  return { nodes: result.list, moved: Boolean(result.moved) };
}

/**
 * Move a node before/after another sibling in the same parent list.
 * @param {Array} nodes
 * @param {string|number} sourceId
 * @param {string|number} targetId
 * @param {"before"|"after"} place
 * @returns {{ nodes: Array, moved: boolean, sameParent: boolean|null }}
 */
export function moveTreeSiblingRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const src = String(sourceId);
  const tgt = String(targetId);
  if (src === tgt) {
    return { nodes, moved: false, sameParent: true };
  }

  const withSortOrder = (list = []) =>
    list.map((node, index) => ({
      ...node,
      sortOrder: index,
      children: withSortOrder(node.children || []),
    }));

  const reorderList = (list = []) => {
    const from = list.findIndex((node) => String(node.id) === src);
    const to = list.findIndex((node) => String(node.id) === tgt);

    if (from >= 0 && to >= 0) {
      if (!canReorderFormNode(list[from])) {
        return {
          list: withSortOrder(list),
          found: true,
          moved: false,
          sameParent: true,
        };
      }
      const prefix = getPositionLockedPrefixCount(list);
      const insertAt = relativeInsertIndex(from, to, place);
      if (insertAt < prefix) {
        return {
          list: withSortOrder(list),
          found: true,
          moved: false,
          sameParent: true,
        };
      }
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(insertAt, 0, item);

      const sameOrder = next.every(
        (node, index) => String(node.id) === String(list[index]?.id),
      );
      return {
        list: withSortOrder(next),
        found: true,
        moved: !sameOrder,
        sameParent: true,
      };
    }

    if (from >= 0 || to >= 0) {
      return {
        list,
        found: true,
        moved: false,
        sameParent: false,
      };
    }

    let found = false;
    let moved = false;
    let sameParent = null;
    const next = list.map((node) => {
      const children = node.children || [];
      if (!children.length) return node;
      const result = reorderList(children);
      if (!result.found) return node;
      found = true;
      moved = result.moved;
      sameParent = result.sameParent;
      return { ...node, children: result.list };
    });

    return {
      list: found ? withSortOrder(next) : next,
      found,
      moved,
      sameParent,
    };
  };

  const result = reorderList(nodes);
  return {
    nodes: result.list,
    moved: Boolean(result.moved),
    sameParent: result.sameParent,
  };
}

/**
 * Sibling position helpers for enabling Move up / Move down.
 */
export function getTreeSiblingMeta(nodes = [], nodeId) {
  const id = String(nodeId);

  const walk = (list = []) => {
    const index = list.findIndex((node) => String(node.id) === id);
    if (index >= 0) {
      const node = list[index];
      const canMove = canReorderFormNode(node);
      return {
        index,
        count: list.length,
        canMoveUp: canMove && index > 0 && canReorderFormNode(list[index - 1]),
        canMoveDown:
          canMove && index < list.length - 1 && canReorderFormNode(list[index + 1]),
      };
    }
    for (const node of list) {
      const nested = walk(node.children || []);
      if (nested) return nested;
    }
    return null;
  };

  return (
    walk(nodes) || {
      index: -1,
      count: 0,
      canMoveUp: false,
      canMoveDown: false,
    }
  );
}

/** Stable sibling sort: sortOrder first, then current array order. */
export function compareTreeSiblings(a, b, indexA = 0, indexB = 0) {
  const orderA = a?.sortOrder;
  const orderB = b?.sortOrder;
  if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) {
    return orderA - orderB;
  }
  return indexA - indexB;
}

export function sortTreeSiblings(list = []) {
  return [...list]
    .map((node, index) => ({ node, index }))
    .sort((a, b) => compareTreeSiblings(a.node, b.node, a.index, b.index))
    .map(({ node }) => ({
      ...node,
      children: sortTreeSiblings(node.children || []),
    }));
}
