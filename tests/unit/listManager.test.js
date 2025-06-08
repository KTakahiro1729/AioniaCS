// tests/unit/listManager.test.js
import * as listManager from '../../src/listManager.js'; // Adjust path if necessary

describe('ListManager', () => {
  beforeAll(() => {
    // Ensure window object exists and mock deepClone
    // In a Jest environment, global.window would typically be set up by jsdom.
    // If running in a Node environment without jsdom, global.window might not exist.
    // For this setup, we assume a Jest-like environment or that `global` can be used for `window`.
    if (typeof window === 'undefined') {
      global.window = {};
    }
    window.deepClone = jest.fn(obj => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
      return JSON.parse(JSON.stringify(obj));
    });
  });

  afterEach(() => {
    // Clear mock calls after each test
    window.deepClone.mockClear();
  });

  describe('Special Skills Management', () => {
    let specialSkillsList;
    const gameDataConfig = { maxSpecialSkills: 3 };
    const emptySpecialSkill = () => ({ group: "", name: "", note: "", showNote: false });


    beforeEach(() => {
      specialSkillsList = [];
    });

    it('addSpecialSkillItem: should add a new special skill to an empty list', () => {
      listManager.addSpecialSkillItem(specialSkillsList, gameDataConfig);
      expect(specialSkillsList.length).toBe(1);
      expect(specialSkillsList[0]).toEqual(emptySpecialSkill());
      expect(window.deepClone).toHaveBeenCalledTimes(1);
      expect(window.deepClone).toHaveBeenCalledWith(emptySpecialSkill());
    });

    it('addSpecialSkillItem: should add a new special skill to a non-empty list', () => {
      specialSkillsList.push({ group: "g0", name: "n0", note: "nt0", showNote: false });
      listManager.addSpecialSkillItem(specialSkillsList, gameDataConfig);
      expect(specialSkillsList.length).toBe(2);
      expect(specialSkillsList[1]).toEqual(emptySpecialSkill());
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('addSpecialSkillItem: should not add if max length is reached', () => {
      specialSkillsList.push({}, {}, {}); // Fill to max (3)
      listManager.addSpecialSkillItem(specialSkillsList, gameDataConfig);
      expect(specialSkillsList.length).toBe(3);
      expect(window.deepClone).not.toHaveBeenCalled();
    });

    it('removeSpecialSkill: should remove an item from a list with multiple items', () => {
      specialSkillsList.push(
        {group: 'g1', name: 'n1', note: 'o1', showNote: false},
        {group: 'g2', name: 'n2', note: 'o2', showNote: false},
        {group: 'g3', name: 'n3', note: 'o3', showNote: false}
      );
      listManager.removeSpecialSkill(specialSkillsList, 1); // Remove item at index 1
      expect(specialSkillsList.length).toBe(2);
      expect(specialSkillsList[0].name).toBe('n1');
      expect(specialSkillsList[1].name).toBe('n3');
    });

    it('removeSpecialSkill: should replace the last item with an empty one if it has content', () => {
      specialSkillsList.push({group: 'g1', name: 'n1', note: 'o1', showNote: false});
      listManager.removeSpecialSkill(specialSkillsList, 0);
      expect(specialSkillsList.length).toBe(1);
      expect(specialSkillsList[0]).toEqual(emptySpecialSkill());
      expect(window.deepClone).toHaveBeenCalledTimes(1); // For the empty item factory
      expect(window.deepClone).toHaveBeenCalledWith(emptySpecialSkill());
    });

    it('removeSpecialSkill: should not change list content (still empty) if the last item is already effectively empty', () => {
      const currentEmptySkill = emptySpecialSkill();
      specialSkillsList.push(currentEmptySkill);
      listManager.removeSpecialSkill(specialSkillsList, 0);
      expect(specialSkillsList.length).toBe(1);
      expect(specialSkillsList[0]).toEqual(emptySpecialSkill());
      // The logic will call newItemFactory and deepClone it, even if the content appears unchanged.
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('removeSpecialSkill: should not remove (or reset) if list has 1 item and it has NO content (as per hasSpecialSkillContent)', () => {
      // hasSpecialSkillContent returns false if all fields are empty
      specialSkillsList.push(emptySpecialSkill());
      const originalEmptyItem = specialSkillsList[0];
      listManager.removeSpecialSkill(specialSkillsList, 0);
      expect(specialSkillsList.length).toBe(1);
      expect(specialSkillsList[0]).toBe(originalEmptyItem); // Expect no change, no new object
      expect(window.deepClone).not.toHaveBeenCalled();
    });
  });

  describe('Experts Management', () => {
    let skill;
    const emptyExpert = () => ({ value: "" });

    beforeEach(() => {
        skill = { canHaveExperts: true, experts: [] };
    });

    it('addExpert: should add an expert if skill can have experts', () => {
        listManager.addExpert(skill);
        expect(skill.experts.length).toBe(1);
        expect(skill.experts[0]).toEqual(emptyExpert());
        expect(window.deepClone).toHaveBeenCalledTimes(1);
        expect(window.deepClone).toHaveBeenCalledWith(emptyExpert());
    });

    it('addExpert: should not add an expert if skill cannot have experts', () => {
        skill.canHaveExperts = false;
        listManager.addExpert(skill);
        expect(skill.experts.length).toBe(0);
        expect(window.deepClone).not.toHaveBeenCalled();
    });

    it('removeExpert: should remove an expert from a list with multiple experts', () => {
        skill.experts.push({value: "Expert1"}, {value: "Expert2"}, {value: "Expert3"});
        listManager.removeExpert(skill, 1); // Remove Expert2
        expect(skill.experts.length).toBe(2);
        expect(skill.experts[0].value).toBe("Expert1");
        expect(skill.experts[1].value).toBe("Expert3");
    });

    it('removeExpert: should replace the last expert with an empty one if it has content', () => {
        skill.experts.push({value: "Expert1"});
        listManager.removeExpert(skill, 0);
        expect(skill.experts.length).toBe(1);
        expect(skill.experts[0]).toEqual(emptyExpert());
        expect(window.deepClone).toHaveBeenCalledTimes(1);
        expect(window.deepClone).toHaveBeenCalledWith(emptyExpert());
    });

    it('removeExpert: should not change list content (still empty) if the last expert is already empty', () => {
      skill.experts.push(emptyExpert());
      listManager.removeExpert(skill, 0);
      expect(skill.experts.length).toBe(1);
      expect(skill.experts[0]).toEqual(emptyExpert());
      // The logic will call newItemFactory and deepClone it for the reset.
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('removeExpert: should not remove (or reset) if list has 1 item and it has NO content (empty string value)', () => {
      skill.experts.push(emptyExpert());
      const originalEmptyExpert = skill.experts[0];
      // The hasContentChecker for expert is (expert) => expert.value && expert.value.trim() !== ""
      // So an empty string value means no content.
      listManager.removeExpert(skill, 0);
      expect(skill.experts.length).toBe(1);
      expect(skill.experts[0]).toBe(originalEmptyExpert);
      expect(window.deepClone).not.toHaveBeenCalled();
    });
  });

  describe('Histories Management', () => {
    let historiesList;
    const emptyHistoryItem = () => ({ sessionName: "", gotExperiments: null, memo: "" });

    beforeEach(() => {
        historiesList = [];
    });

    it('addHistoryItem: should add a new history item to an empty list', () => {
        listManager.addHistoryItem(historiesList);
        expect(historiesList.length).toBe(1);
        expect(historiesList[0]).toEqual(emptyHistoryItem());
        expect(window.deepClone).toHaveBeenCalledTimes(1);
        expect(window.deepClone).toHaveBeenCalledWith(emptyHistoryItem());
    });

    it('addHistoryItem: should add a new history item to a non-empty list', () => {
      historiesList.push({ sessionName: "s0", gotExperiments: 0, memo: "m0" });
      listManager.addHistoryItem(historiesList);
      expect(historiesList.length).toBe(2);
      expect(historiesList[1]).toEqual(emptyHistoryItem());
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('removeHistoryItem: should remove a history item from a list with multiple items', () => {
        historiesList.push(
            {sessionName: "s1", gotExperiments: 1, memo: "m1"},
            {sessionName: "s2", gotExperiments: 2, memo: "m2"},
            {sessionName: "s3", gotExperiments: 3, memo: "m3"}
        );
        listManager.removeHistoryItem(historiesList, 1); // Remove item at index 1
        expect(historiesList.length).toBe(2);
        expect(historiesList[0].sessionName).toBe("s1");
        expect(historiesList[1].sessionName).toBe("s3");
    });

    it('removeHistoryItem: should replace the last history item with an empty one if it has content', () => {
        historiesList.push({sessionName: "s1", gotExperiments: 1, memo: "m1"}); // Item with content
        listManager.removeHistoryItem(historiesList, 0);
        expect(historiesList.length).toBe(1);
        expect(historiesList[0]).toEqual(emptyHistoryItem());
        expect(window.deepClone).toHaveBeenCalledTimes(1);
        expect(window.deepClone).toHaveBeenCalledWith(emptyHistoryItem());
    });

    it('removeHistoryItem: should not change list content (still empty) if the last history item is already empty', () => {
      historiesList.push(emptyHistoryItem());
      listManager.removeHistoryItem(historiesList, 0);
      expect(historiesList.length).toBe(1);
      expect(historiesList[0]).toEqual(emptyHistoryItem());
      // The logic will call newItemFactory and deepClone it for the reset.
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('removeHistoryItem: should not remove (or reset) if list has 1 item and it has NO content (as per hasHistoryContent)', () => {
      // hasHistoryContent checks sessionName, gotExperiments !== null && !== "", and memo
      historiesList.push(emptyHistoryItem());
      const originalEmptyItem = historiesList[0];
      listManager.removeHistoryItem(historiesList, 0);
      expect(historiesList.length).toBe(1);
      expect(historiesList[0]).toBe(originalEmptyItem);
      expect(window.deepClone).not.toHaveBeenCalled();
    });
  });

  // Tests for _manageListItem itself (optional, as it's tested via wrappers)
  // If direct testing is desired:
  describe('_manageListItem (Direct Tests - Optional)', () => {
    let list;
    const newItemFactory = () => ({ id: Date.now() });
    const hasContentChecker = item => item && item.id !== undefined; // Example checker

    beforeEach(() => {
      list = [];
    });

    it('should add item using _manageListItem', () => {
      listManager._manageListItem({ list, action: 'add', newItemFactory });
      expect(list.length).toBe(1);
      expect(list[0]).toHaveProperty('id');
      expect(window.deepClone).toHaveBeenCalledTimes(1);
    });

    it('should remove item using _manageListItem', () => {
      list.push(newItemFactory(), newItemFactory());
      window.deepClone.mockClear(); // Clear from add actions
      listManager._manageListItem({ list, action: 'remove', index: 0, newItemFactory, hasContentChecker });
      expect(list.length).toBe(1);
      expect(window.deepClone).not.toHaveBeenCalled(); // Not called for standard removal from multi-item list
    });

    it('should reset last item using _manageListItem if it has content', () => {
      const itemWithContent = { id: 123, data: "some data" };
      list.push(itemWithContent);
      const factoryForEmpty = () => ({ id: undefined });
      window.deepClone.mockClear();

      listManager._manageListItem({ list, action: 'remove', index: 0, newItemFactory: factoryForEmpty, hasContentChecker });
      expect(list.length).toBe(1);
      expect(list[0]).toEqual({ id: undefined });
      expect(window.deepClone).toHaveBeenCalledTimes(1);
      expect(window.deepClone).toHaveBeenCalledWith({id: undefined});
    });

    it('_manageListItem: should not add if maxLength is reached', () => {
      const factory = () => ({ value: "test" });
      list.push(factory(), factory()); // list length 2
      listManager._manageListItem({ list, action: 'add', newItemFactory: factory, maxLength: 2 });
      expect(list.length).toBe(2); // Should not add
      expect(window.deepClone).not.toHaveBeenCalled(); // Since add was blocked
    });
  });
});
