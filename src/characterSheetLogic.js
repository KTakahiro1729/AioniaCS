// src/characterSheetLogic.js

export class CharacterSheetLogic {
  constructor(vueAppContext) {
    this.app = vueAppContext; // vueAppContext is the Vue app instance from main.js
  }

  handleCurrentScarInput(event) {
    const enteredValue = parseInt(event.target.value, 10);
    if (isNaN(enteredValue)) {
      // If input is not a number (e.g., cleared), and link is active,
      // revert to initialScar. Use $nextTick if direct model binding might cause issues.
      if (this.app.character.linkCurrentToInitialScar) {
        this.app.$nextTick(() => {
          this.app.character.currentScar = this.app.character.initialScar;
        });
      }
      return;
    }
    // If link is active and entered value is different, unlink.
    if (this.app.character.linkCurrentToInitialScar) {
      if (enteredValue !== this.app.character.initialScar) {
        this.app.character.linkCurrentToInitialScar = false;
        this.app.character.currentScar = enteredValue; // Update with the new value
      }
      // If enteredValue is same as initialScar, no change needed, link remains.
    } else {
      // If not linked, just update the currentScar.
      this.app.character.currentScar = enteredValue;
    }
  }

  expertPlaceholder(skill) {
    // Requires this.app.gameData to be available
    if (!this.app.gameData || !this.app.gameData.placeholderTexts) {
      return "Loading..."; // Or some default
    }
    return skill.checked
      ? this.app.gameData.placeholderTexts.expertSkill
      : this.app.gameData.placeholderTexts.expertSkillDisabled;
  }

  handleSpeciesChange() {
    // Operates on this.app.character
    if (this.app.character.species !== "other") {
      this.app.character.rareSpecies = "";
    }
  }

  availableSpecialSkillNames(index) {
    // Requires this.app.specialSkills and this.app.gameData
    if (this.app.specialSkills && this.app.specialSkills[index] && this.app.gameData && this.app.gameData.specialSkillData) {
      const group = this.app.specialSkills[index].group;
      return this.app.gameData.specialSkillData[group] || [];
    }
    return [];
  }

  updateSpecialSkillOptions(index) {
    // Operates on this.app.specialSkills
    if (this.app.specialSkills && this.app.specialSkills[index]) {
      this.app.specialSkills[index].name = ""; // Reset name
      this.updateSpecialSkillNoteVisibility(index); // Call another method in this class
    }
  }

  updateSpecialSkillNoteVisibility(index) {
    // Requires this.app.specialSkills and this.app.gameData
    if (this.app.specialSkills && this.app.specialSkills[index] && this.app.gameData && this.app.gameData.specialSkillsRequiringNote) {
      const skillName = this.app.specialSkills[index].name;
      this.app.specialSkills[index].showNote =
        this.app.gameData.specialSkillsRequiringNote.includes(skillName);
    }
  }
}
