// tests/unit/listManager.test.js
// Assume window.listManager and window.AioniaGameData are available globally in test env.
// Also assumes window.deepClone is available (from utils.js or a test setup).

let mockVueInstance;

describe('listManager', () => {
  beforeAll(() => {
    // Mock global dependencies if not loaded by Jest setup
    if (typeof window.deepClone === 'undefined') {
      window.deepClone = (obj) => JSON.parse(JSON.stringify(obj)); // Simple mock
    }
    if (typeof window.AioniaGameData === 'undefined') {
      window.AioniaGameData = { // Mock parts listManager uses
        config: {
          maxSpecialSkills: 20,
        },
      };
    }
    // listManager is expected to be on window from src/listManager.js
  });

  beforeEach(() => {
    mockVueInstance = {
      specialSkills: [{ group: "", name: "", note: "", showNote: false }],
      histories: [{ sessionName: "", gotExperiments: null, memo: "" }],
      gameData: window.AioniaGameData,
    };
  });

  describe('_manageListItem (generic helper)', () => {
     test('should add an item to a list', () => {
         const list = [];
         window.listManager._manageListItem({
             list: list,
             action: 'add',
             newItemFactory: () => ({ id: 1, text: 'new item' })
         });
         expect(list.length).toBe(1);
         expect(list[0].text).toBe('new item');
     });

     test('should remove an item from a list if list length > 1', () => {
         const list = [{ id: 1, text: 'item1' }, { id: 2, text: 'item2' }];
         window.listManager._manageListItem({ list: list, action: 'remove', index: 0 });
         expect(list.length).toBe(1);
         expect(list[0].id).toBe(2);
     });

     test('should reset an item if list length is 1 and content exists', () => {
         const list = [{ id: 1, text: 'item1' }];
         window.listManager._manageListItem({
             list: list,
             action: 'remove',
             index: 0,
             newItemFactory: () => ({ id: null, text: '' }),
             hasContentChecker: (item) => item.text !== ''
         });
         expect(list.length).toBe(1);
         expect(list[0].text).toBe('');
     });
  });

  describe('Special Skills', () => {
    test('addSpecialSkillItem should add a new special skill', () => {
      window.listManager.addSpecialSkillItem(mockVueInstance);
      expect(mockVueInstance.specialSkills.length).toBe(2);
    });

    test('removeSpecialSkill should remove a special skill', () => {
      mockVueInstance.specialSkills.push({ group: "g", name: "n", note: "", showNote: false });
      window.listManager.removeSpecialSkill(mockVueInstance, 0);
      expect(mockVueInstance.specialSkills.length).toBe(1);
      expect(mockVueInstance.specialSkills[0].name).toBe("n");
    });
  });
});
