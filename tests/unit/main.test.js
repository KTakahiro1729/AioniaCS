// Mock global objects and functions expected by main.js methods
import { vi } from 'vitest';
global.window = {
  AioniaGameData: {
    config: {
      maxSpecialSkills: 3, // Example maxLength
    },
    // ... other necessary mock parts of AioniaGameData
  },
  deepClone: vi.fn((obj) => JSON.parse(JSON.stringify(obj))), // Simple deepClone mock
};

// This is a simplified mock of the Vue app's methods.
// In a real Vue testing environment, you might use Vue Test Utils.
// For this exercise, we'll directly test the _manageListItem logic.
const mockVueInstanceMethods = {
  _manageListItem({ list, action, index, newItemFactory, hasContentChecker, maxLength }) {
    if (action === 'add') {
      if (maxLength && list.length >= maxLength) {
        return;
      }
      const newItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
      list.push(typeof newItem === 'object' && newItem !== null ? window.deepClone(newItem) : newItem);
    } else if (action === 'remove') {
      if (list.length > 1) {
        list.splice(index, 1);
      } else if (list.length === 1 && hasContentChecker && hasContentChecker(list[index])) {
        const emptyItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
        // Ensure deepClone is called for objects when resetting
        list[index] = typeof emptyItem === 'object' && emptyItem !== null ? window.deepClone(emptyItem) : emptyItem;
      }
    }
  },
  // We can add other methods here if needed for more complex tests,
  // but for _manageListItem, direct invocation is cleaner.
};

describe('Vue app methods - _manageListItem', () => {
  let list;

  // Ensure window.deepClone is a Jest mock function for this test suite
  window.deepClone = vi.fn((item) => JSON.parse(JSON.stringify(item)));

  beforeEach(() => {
    list = [];
    // Reset mock calls for deepClone before each test
    window.deepClone.mockClear();
  });

  // --- Add Action Tests ---
  describe('Add Action', () => {
    it('should add an item to an empty list', () => {
      const newItemFactory = () => ({ id: 1, value: 'test' });
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory,
      });
      expect(list).toHaveLength(1);
      expect(list[0]).toEqual({ id: 1, value: 'test' });
      expect(window.deepClone).toHaveBeenCalledTimes(1); // Called for the new object
    });

    it('should add an item to a non-empty list', () => {
      list.push({ id: 1, value: 'existing' });
      const newItemFactory = () => ({ id: 2, value: 'new' });
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory,
      });
      expect(list).toHaveLength(2);
      expect(list[1]).toEqual({ id: 2, value: 'new' });
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('should respect maxLength and not add if list is full', () => {
      const newItemFactory = () => ({ id: 1, value: 'test' });
      const maxLength = 2;
      list.push({ id: 'a' }, { id: 'b' }); // List is now full
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory,
        maxLength,
      });
      expect(list).toHaveLength(2); // Still 2, not 3
      expect(window.deepClone).not.toHaveBeenCalled(); // Not called as item wasn't added
    });

    it('should call newItemFactory (function) to create the new item', () => {
      const newItemFactory = vi.fn(() => ({ id: 1, value: 'created' }));
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory,
      });
      expect(newItemFactory).toHaveBeenCalledTimes(1);
      expect(list[0]).toEqual({ id: 1, value: 'created' });
      expect(window.deepClone).toHaveBeenCalledWith({
        id: 1,
        value: 'created',
      });
    });

    it('should deep clone newItemFactory (object) if it is an object', () => {
      const itemTemplate = { id: 1, value: 'template' };
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory: itemTemplate,
      });
      expect(list[0]).toEqual(itemTemplate);
      expect(list[0]).not.toBe(itemTemplate); // Ensure it's a clone
      expect(window.deepClone).toHaveBeenCalledWith(itemTemplate);
    });

    it('should add primitive values directly without cloning', () => {
      const newItemFactory = () => 123;
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'add',
        newItemFactory,
      });
      expect(list[0]).toBe(123);
      expect(window.deepClone).not.toHaveBeenCalled();
    });
  });

  // --- Remove Action Tests ---
  describe('Remove Action', () => {
    it('should remove an item from a list with multiple items', () => {
      list.push({ id: 1 }, { id: 2 }, { id: 3 });
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 1,
      });
      expect(list).toHaveLength(2);
      expect(list.map((i) => i.id)).toEqual([1, 3]);
    });

    it('should reset an item if list.length === 1 and hasContentChecker returns true', () => {
      const originalItem = { id: 1, value: 'filled' };
      list.push(originalItem);
      const newItemFactory = () => ({ id: 'empty', value: '' });
      const hasContentChecker = vi.fn(() => true);

      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
        newItemFactory,
        hasContentChecker,
      });

      expect(list).toHaveLength(1);
      expect(list[0]).toEqual({ id: 'empty', value: '' }); // Item is reset
      expect(list[0]).not.toBe(originalItem); // Ensure it's a new object
      expect(hasContentChecker).toHaveBeenCalledWith(originalItem);
      expect(window.deepClone).toHaveBeenCalledWith({ id: 'empty', value: '' }); // Called for the reset object
    });

    it('should not reset (or change) if list.length === 1 and hasContentChecker returns false', () => {
      list.push({ id: 1, value: 'no-content' });
      const originalItemRef = list[0];
      const newItemFactory = () => ({ id: 'empty' }); // Should not be used
      const hasContentChecker = vi.fn(() => false);

      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
        newItemFactory,
        hasContentChecker,
      });

      expect(list).toHaveLength(1);
      expect(list[0]).toEqual({ id: 1, value: 'no-content' }); // Item remains unchanged
      expect(list[0]).toBe(originalItemRef); // Should be the same object reference
      expect(hasContentChecker).toHaveBeenCalledWith({
        id: 1,
        value: 'no-content',
      });
      expect(window.deepClone).not.toHaveBeenCalled(); // Not called as no reset happened
    });

    it('should do nothing if list.length === 1 and hasContentChecker is not provided', () => {
      list.push({ id: 1, value: 'no-checker' });
      const originalItemRef = list[0];
      const newItemFactory = () => ({ id: 'empty' }); // Should not be used

      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
        newItemFactory,
      }); // No hasContentChecker

      expect(list).toHaveLength(1);
      expect(list[0]).toEqual({ id: 1, value: 'no-checker' });
      expect(list[0]).toBe(originalItemRef);
      expect(window.deepClone).not.toHaveBeenCalled();
    });

    it('should remove the correct item based on index', () => {
      list.push({ id: 'first' }, { id: 'second' }, { id: 'third' });
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
      }); // Remove first
      expect(list.map((i) => i.id)).toEqual(['second', 'third']);

      list = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 2,
      }); // Remove last
      expect(list.map((i) => i.id)).toEqual(['first', 'second']);
    });

    it('should use newItemFactory (object) for resetting and deep clone it', () => {
      const itemToReset = { id: 1, value: 'old' };
      list.push(itemToReset);
      const emptyItemTemplate = { id: 'reset', value: '' };
      const hasContentChecker = () => true;

      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
        newItemFactory: emptyItemTemplate,
        hasContentChecker,
      });

      expect(list[0]).toEqual(emptyItemTemplate);
      expect(list[0]).not.toBe(emptyItemTemplate); // Ensure it's a clone
      expect(window.deepClone).toHaveBeenCalledWith(emptyItemTemplate);
    });

    it('should reset with primitive value directly without cloning if newItemFactory returns primitive', () => {
      const itemToReset = { id: 1, value: 'old' };
      list.push(itemToReset);
      const newItemFactory = () => null; // Primitive value
      const hasContentChecker = () => true;

      mockVueInstanceMethods._manageListItem({
        list,
        action: 'remove',
        index: 0,
        newItemFactory,
        hasContentChecker,
      });

      expect(list[0]).toBeNull();
      expect(window.deepClone).not.toHaveBeenCalled();
    });
  });
});
