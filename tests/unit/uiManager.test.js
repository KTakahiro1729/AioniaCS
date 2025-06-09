// tests/unit/uiManager.test.js

// Note: In a Jest/JSDOM environment, scripts from index.html that create globals
// (like uiManager.js, gameData.js) should ideally be loaded by configuring Jest
// or by manually reading and executing them in setup.
// For this subtask, we assume 'window.uiManager' and 'window.AioniaGameData'
// will be available if their respective scripts ('src/uiManager.js', 'src/gameData.js')
// are correctly set up to create these globals and Jest is configured to load them or they are loaded in a test setup file.
// If direct 'require' is needed for gameData and it's a CommonJS module:
// const AioniaGameData = require('../../src/gameData'); // Assuming gameData.js can be required.

let mockVueInstance;

describe('uiManager', () => {
  beforeAll(() => {
    // Manually ensure globals if not handled by Jest setup
    // This is a simplified approach for the subtask. A real setup might use jest.config.js setupFilesAfterEnv.
    if (typeof window.AioniaGameData === 'undefined') {
      // This is a placeholder. In a real test, gameData would need to be loaded.
      // For now, mock the parts uiManager directly uses if gameData isn't loaded globally.
      window.AioniaGameData = {
        uiMessages: {
          outputButton: {
            default: "Default Text",
            animating: "Animating...",
            failed: "Failed",
            error: "Error",
            animationTimings: {
              state1_bgFill: 100,
              state2_textHold: 100,
              state3_textFadeOut: 100,
              state4_bgReset: 100,
            },
          },
        },
      };
    }
    // uiManager is expected to be on window from src/uiManager.js
    // If src/uiManager.js was not loaded (e.g. via Jest setup), this test file would fail.
    // We are proceeding as if it IS loaded and window.uiManager is defined.
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    mockVueInstance = {
      isDesktop: true,
      helpState: 'closed',
      $refs: {
        helpPanel: document.createElement('div'),
        helpIcon: document.createElement('div'),
        outputButton: document.createElement('button'),
      },
      gameData: window.AioniaGameData,
      outputButtonText: window.AioniaGameData.uiMessages.outputButton.default,
    };
    document.body.appendChild(mockVueInstance.$refs.helpPanel);
    document.body.appendChild(mockVueInstance.$refs.helpIcon);
    document.body.appendChild(mockVueInstance.$refs.outputButton);
  });

  describe('Help Panel', () => {
    test('handleHelpIconMouseOver should change helpState to hovered', () => {
      window.uiManager.handleHelpIconMouseOver(mockVueInstance);
      expect(mockVueInstance.helpState).toBe('hovered');
    });

    test('handleHelpIconMouseLeave should change helpState to closed if hovered', () => {
      mockVueInstance.helpState = 'hovered';
      window.uiManager.handleHelpIconMouseLeave(mockVueInstance);
      expect(mockVueInstance.helpState).toBe('closed');
    });

    test('handleHelpIconClick should toggle helpState between fixed and closed on desktop', () => {
      window.uiManager.handleHelpIconClick(mockVueInstance);
      expect(mockVueInstance.helpState).toBe('fixed');
      window.uiManager.handleHelpIconClick(mockVueInstance);
      expect(mockVueInstance.helpState).toBe('closed');
    });

    test('closeHelpPanel should change helpState to closed', () => {
      mockVueInstance.helpState = 'fixed';
      window.uiManager.closeHelpPanel(mockVueInstance);
      expect(mockVueInstance.helpState).toBe('closed');
    });
  });

  describe('showCustomAlert', () => {
    test('should create and display an alert modal', () => {
      const message = 'Test alert message';
      window.uiManager.showCustomAlert(message);

      const modal = document.getElementById('custom-alert-modal');
      expect(modal).not.toBeNull();
      expect(modal.textContent).toContain('アラート');
      expect(modal.textContent).toContain(message);

      const okButton = modal.querySelector('.custom-alert-button');
      expect(document.activeElement).toBe(okButton); // Check focus

      okButton.click();
      expect(document.getElementById('custom-alert-modal')).toBeNull();
    });
  });
});
