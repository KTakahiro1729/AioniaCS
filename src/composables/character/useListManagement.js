export function manageListItem({
  list,
  action,
  index,
  newItemFactory,
  hasContentChecker,
  maxLength,
}) {
  if (action === "add") {
    if (maxLength && list.length >= maxLength) return;
    const newItem =
      typeof newItemFactory === "function" ? newItemFactory() : newItemFactory;
    list.push(
      typeof newItem === "object" && newItem !== null
        ? JSON.parse(JSON.stringify(newItem))
        : newItem,
    );
  } else if (action === "remove") {
    if (list.length > 1) {
      list.splice(index, 1);
    } else if (
      list.length === 1 &&
      hasContentChecker &&
      hasContentChecker(list[index])
    ) {
      const emptyItem =
        typeof newItemFactory === "function"
          ? newItemFactory()
          : newItemFactory;
      list[index] =
        typeof emptyItem === "object" && emptyItem !== null
          ? JSON.parse(JSON.stringify(emptyItem))
          : emptyItem;
    }
  }
}
