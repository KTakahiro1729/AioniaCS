import { deepClone } from '../../utils/utils.js';

export function useListManagement() {
  function createItem(factory) {
    return typeof factory === 'function' ? factory() : factory;
  }

  function addItem(list, factory, maxLength) {
    if (maxLength && list.length >= maxLength) return;
    const item = createItem(factory);
    list.push(typeof item === 'object' && item !== null ? deepClone(item) : item);
  }

  function resetItem(list, index, factory) {
    const empty = createItem(factory);
    list[index] = typeof empty === 'object' && empty !== null ? deepClone(empty) : empty;
  }

  function removeItem(list, index, factory, hasContentChecker) {
    if (list.length > 1) {
      list.splice(index, 1);
    } else if (list.length === 1 && hasContentChecker && hasContentChecker(list[index])) {
      resetItem(list, index, factory);
    }
  }

  return {
    addItem,
    removeItem,
    resetItem,
  };
}
