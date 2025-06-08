// tests/unit/uiManager.test.js
import { UIManager } from '../../src/uiManager.js'; // Adjust path if necessary

// Global Mocks
// We need to ensure 'window' is available globally for tests, similar to a browser environment.
// In Jest, jsdom usually provides this. If not, ensure 'global.window' is set.
if (typeof window === 'undefined') {
  global.window = {};
}
// Assign global to window if it's not already (for environments where global exists but window doesn't)
if (typeof global !== 'undefined' && typeof window === 'undefined') {
  global.window = global;
}


// Mock navigator.clipboard
if (!navigator.clipboard) {
  navigator.clipboard = {
    writeText: jest.fn(),
  };
} else {
  jest.spyOn(navigator.clipboard, 'writeText');
}

// Mock document.execCommand
if (!document.execCommand) {
  document.execCommand = jest.fn();
} else {
  jest.spyOn(document, 'execCommand');
}


global.requestAnimationFrame = jest.fn(cb => { cb(); return 0; }); // Return a non-null value like an ID
global.document.getElementById = jest.fn();
const mockCreatedElements = [];
global.document.createElement = jest.fn(type => {
  const el = {
    type,
    classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn((event, handler) => {
      // Store listeners to simulate them later if needed
      el[`on${event}`] = handler;
    }),
    removeEventListener: jest.fn(),
    focus: jest.fn(),
    select: jest.fn(),
    style: {},
    id: '',
    textContent: '',
    value: '',
    contains: jest.fn(target => false),
    click: jest.fn(), // For simulating button clicks
    parentNode: global.document.body, // Assume it's added to body for removal tests
    remove: jest.fn(function() { // Mock remove function
        if(this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }),
  };
  mockCreatedElements.push(el); // Keep track of created elements for potential checks
  return el;
});

global.document.body = {
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  // Mock other body properties if needed
};
global.document.activeElement = null;


describe('UIManager', () => {
  let mockVueApp;
  let uiManagerInstance;

  beforeEach(() => {
    jest.clearAllMocks(); // Clears mock usage data, doesn't reset implementation if manually set
    mockCreatedElements.length = 0; // Clear the array of created elements

    // Re-mock getElementById to return null by default (no existing modal)
    global.document.getElementById.mockReturnValue(null);

    // Reset specific mocks that might have specific implementations per test
    navigator.clipboard.writeText.mockReset();
    document.execCommand.mockReset();
    requestAnimationFrame.mockClear(); // Use mockClear for spies/jest.fn()

    jest.useFakeTimers();

    mockVueApp = {
      isDesktop: true,
      helpState: 'closed',
      outputButtonText: 'Default',
      showDriveMenu: false,
      currentDriveMenuHandler: null,
      gameData: {
        uiMessages: {
          outputButton: {
            default: 'Default',
            animating: 'Animating',
            failed: 'Failed',
            error: 'Error',
            animationTimings: {
              state1_bgFill: 100,
              state2_textHold: 100,
              state3_textFadeOut: 100,
              state4_bgReset: 100,
            },
          },
        },
      },
      $refs: {
        outputButton: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }, /* other properties */ },
        driveMenu: { contains: jest.fn() },
        driveMenuToggleButton: { contains: jest.fn() },
        helpPanel: { contains: jest.fn() },
        helpIcon: { contains: jest.fn() },
      },
      $nextTick: jest.fn(cb => cb()),
    };
    uiManagerInstance = new UIManager(mockVueApp);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Help Panel', () => {
    it('handleHelpIconMouseOver: should set helpState to hovered if desktop and closed', () => {
      mockVueApp.isDesktop = true;
      mockVueApp.helpState = 'closed';
      uiManagerInstance.handleHelpIconMouseOver();
      expect(mockVueApp.helpState).toBe('hovered');
    });

    it('handleHelpIconMouseOver: should not change helpState if not desktop', () => {
      mockVueApp.isDesktop = false;
      mockVueApp.helpState = 'closed';
      uiManagerInstance.handleHelpIconMouseOver();
      expect(mockVueApp.helpState).toBe('closed');
    });

    it('handleHelpIconMouseOver: should not change helpState if already fixed', () => {
      mockVueApp.isDesktop = true;
      mockVueApp.helpState = 'fixed';
      uiManagerInstance.handleHelpIconMouseOver();
      expect(mockVueApp.helpState).toBe('fixed');
    });

    it('handleHelpIconMouseLeave: should set helpState to closed if desktop and hovered', () => {
      mockVueApp.isDesktop = true;
      mockVueApp.helpState = 'hovered';
      uiManagerInstance.handleHelpIconMouseLeave();
      expect(mockVueApp.helpState).toBe('closed');
    });

    it('handleHelpIconMouseLeave: should not change helpState if not desktop', () => {
      mockVueApp.isDesktop = false;
      mockVueApp.helpState = 'hovered';
      uiManagerInstance.handleHelpIconMouseLeave();
      expect(mockVueApp.helpState).toBe('hovered');
    });


    it('handleHelpIconClick: should toggle fixed/closed on desktop', () => {
      mockVueApp.isDesktop = true;
      mockVueApp.helpState = 'closed';
      uiManagerInstance.handleHelpIconClick();
      expect(mockVueApp.helpState).toBe('fixed');
      uiManagerInstance.handleHelpIconClick();
      expect(mockVueApp.helpState).toBe('closed');
    });

    it('handleHelpIconClick: should toggle fixed/closed on non-desktop', () => {
      mockVueApp.isDesktop = false;
      mockVueApp.helpState = 'closed';
      uiManagerInstance.handleHelpIconClick();
      expect(mockVueApp.helpState).toBe('fixed');
      uiManagerInstance.handleHelpIconClick();
      expect(mockVueApp.helpState).toBe('closed');
    });

    it('closeHelpPanel: should set helpState to closed', () => {
      mockVueApp.helpState = 'fixed';
      uiManagerInstance.closeHelpPanel();
      expect(mockVueApp.helpState).toBe('closed');
    });

    describe('handleClickOutside', () => {
        let mockEvent;
        let mockTargetElement;

        beforeEach(() => {
            mockTargetElement = document.createElement('div'); // Target for the click event
            mockEvent = { target: mockTargetElement };
            mockVueApp.helpState = 'fixed';

            // Ensure $refs return mock elements with 'contains'
            mockVueApp.$refs.helpPanel = document.createElement('div');
            mockVueApp.$refs.helpIcon = document.createElement('div');

            // Default behavior for contains (target is outside)
            mockVueApp.$refs.helpPanel.contains.mockReturnValue(false);
            mockVueApp.$refs.helpIcon.contains.mockReturnValue(false);
        });

        it('should close help panel if click is outside both helpPanel and helpIcon', () => {
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            expect(mockVueApp.helpState).toBe('closed');
        });

        it('should not close help panel if click is inside helpPanel', () => {
            mockVueApp.$refs.helpPanel.contains.mockImplementation(target => target === mockTargetElement);
            mockVueApp.$refs.helpPanel.contains.mockReturnValue(true); // Click is inside helpPanel
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            expect(mockVueApp.helpState).toBe('fixed');
        });

        it('should not close help panel if click is inside helpIcon', () => {
            mockVueApp.$refs.helpIcon.contains.mockImplementation(target => target === mockTargetElement);
            mockVueApp.$refs.helpIcon.contains.mockReturnValue(true); // Click is inside helpIcon
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            expect(mockVueApp.helpState).toBe('fixed');
        });

        it('should handle cases where helpPanel or helpIcon ref might be missing', () => {
            mockVueApp.$refs.helpPanel = null; // Simulate missing ref
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            // If helpIcon also returns false for contains, it should close
            expect(mockVueApp.helpState).toBe('closed');

            mockVueApp.helpState = 'fixed'; // Reset for next check
            mockVueApp.$refs.helpPanel = document.createElement('div');
            mockVueApp.$refs.helpPanel.contains.mockReturnValue(false);
            mockVueApp.$refs.helpIcon = null; // Simulate missing ref
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            expect(mockVueApp.helpState).toBe('closed');
        });

         it('should not do anything if helpState is not fixed', () => {
            mockVueApp.helpState = 'closed';
            uiManagerInstance.handleClickOutside(mockVueApp, mockEvent);
            expect(mockVueApp.helpState).toBe('closed'); // Remains unchanged
        });
    });
  });

  describe('showCustomAlert', () => {
    let mockAlertModal, mockCloseButton, lastFocusedElementBeforeAlert;

    beforeEach(() => {
        // Set up a mock for the currently focused element
        lastFocusedElementBeforeAlert = document.createElement('button');
        document.activeElement = lastFocusedElementBeforeAlert;
        jest.spyOn(lastFocusedElementBeforeAlert, 'focus');


        // Reset and re-initialize mocks for elements created by showCustomAlert
        const createdElements = {};
        document.createElement.mockImplementation(type => {
            const el = {
                type,
                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
                setAttribute: jest.fn(),
                appendChild: jest.fn(),
                removeChild: jest.fn(),
                addEventListener: jest.fn((event, handler) => el[`on${event}`] = handler),
                removeEventListener: jest.fn(),
                focus: jest.fn(),
                select: jest.fn(),
                style: {},
                id: '',
                textContent: '',
                value: '',
                contains: jest.fn().mockReturnValue(false),
                click: jest.fn(function() { if(this.onclick) this.onclick(); }), // Simulate click
                remove: jest.fn(function() { if(this.parentNode) this.parentNode.removeChild(this); }),
                parentNode: document.body, // Default parentNode
            };
            createdElements[type] = createdElements[type] || [];
            createdElements[type].push(el);

            if (type === 'div') mockAlertModal = el;
            if (type === 'button') mockCloseButton = el;
            return el;
        });
        document.getElementById.mockReturnValue(null); // Default: modal does not exist
    });

    it('should create, display, and focus the alert modal', () => {
        uiManagerInstance.showCustomAlert('Test Alert Message');
        expect(document.createElement).toHaveBeenCalledWith('div'); // Modal
        expect(document.createElement).toHaveBeenCalledWith('h4');  // Title
        expect(document.createElement).toHaveBeenCalledWith('p');   // Message
        expect(document.createElement).toHaveBeenCalledWith('button'); // Close button
        expect(document.body.appendChild).toHaveBeenCalledWith(mockAlertModal);
        expect(mockAlertModal.id).toBe('custom-alert-modal');
        expect(mockAlertModal.classList.add).toHaveBeenCalledWith('custom-alert-modal');
        // Check ARIA attributes
        expect(mockAlertModal.setAttribute).toHaveBeenCalledWith('role', 'alertdialog');
        expect(mockAlertModal.setAttribute).toHaveBeenCalledWith('aria-modal', 'true');

        expect(requestAnimationFrame).toHaveBeenCalled();
        expect(mockCloseButton.focus).toHaveBeenCalled();
    });

    it('should remove existing modal if one exists before creating a new one', () => {
        const existingModal = { remove: jest.fn() };
        document.getElementById.mockReturnValue(existingModal); // Simulate existing modal

        uiManagerInstance.showCustomAlert('New Message');
        expect(existingModal.remove).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled(); // New modal still appended
    });

    it('should close and remove modal on close button click, and restore focus', () => {
        uiManagerInstance.showCustomAlert('Test');

        // Simulate click on the close button
        expect(mockCloseButton.onclick).toBeInstanceOf(Function);
        mockCloseButton.onclick(); // Trigger the click handler

        expect(mockAlertModal.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(document.body.removeChild).toHaveBeenCalledWith(mockAlertModal);
        expect(lastFocusedElementBeforeAlert.focus).toHaveBeenCalled();
    });

    it('should close and remove modal on Escape keydown, and restore focus', () => {
        uiManagerInstance.showCustomAlert('Test');
        const keydownHandler = mockAlertModal.onkeydown; // Get the attached handler
        expect(keydownHandler).toBeInstanceOf(Function);

        keydownHandler({ key: 'Escape' }); // Simulate Escape key press

        expect(mockAlertModal.removeEventListener).toHaveBeenCalledWith('keydown', keydownHandler);
        expect(document.body.removeChild).toHaveBeenCalledWith(mockAlertModal);
        expect(lastFocusedElementBeforeAlert.focus).toHaveBeenCalled();
    });

    it('should focus close button on Tab keydown', () => {
        uiManagerInstance.showCustomAlert('Test');
        const keydownHandler = mockAlertModal.onkeydown;
        const mockEvent = { key: 'Tab', preventDefault: jest.fn() };

        keydownHandler(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockCloseButton.focus).toHaveBeenCalled();
    });
});


  describe('Clipboard Operations', () => {
    const testText = 'Hello Clipboard';
    jest.spyOn(UIManager.prototype, 'playOutputAnimation'); // Spy on the prototype method
     jest.spyOn(UIManager.prototype, 'fallbackCopyTextToClipboard');


    beforeEach(() => {
      // Clear mock history for spies
      UIManager.prototype.playOutputAnimation.mockClear();
      UIManager.prototype.fallbackCopyTextToClipboard.mockClear();
      navigator.clipboard.writeText.mockReset(); // Ensure it's reset for each test
      document.execCommand.mockReset();
    });

    it('copyToClipboard: should use navigator.clipboard.writeText and call playOutputAnimation on success', async () => {
      navigator.clipboard.writeText.mockResolvedValue(undefined);
      await uiManagerInstance.copyToClipboard(testText);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(uiManagerInstance.playOutputAnimation).toHaveBeenCalled();
      expect(uiManagerInstance.fallbackCopyTextToClipboard).not.toHaveBeenCalled();
    });

    it('copyToClipboard: should use fallback if navigator.clipboard is not available', async () => {
      const originalClipboard = navigator.clipboard;
      navigator.clipboard = null; // Simulate no clipboard API
      document.execCommand.mockReturnValue(true); // Fallback succeeds

      await uiManagerInstance.copyToClipboard(testText);
      expect(uiManagerInstance.fallbackCopyTextToClipboard).toHaveBeenCalledWith(testText);
      // playOutputAnimation is called by fallback
      expect(uiManagerInstance.playOutputAnimation).toHaveBeenCalled();
      navigator.clipboard = originalClipboard; // Restore
    });

    it('copyToClipboard: should use fallback if navigator.clipboard.writeText fails', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      document.execCommand.mockReturnValue(true); // Fallback succeeds

      await uiManagerInstance.copyToClipboard(testText);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(uiManagerInstance.fallbackCopyTextToClipboard).toHaveBeenCalledWith(testText);
      expect(uiManagerInstance.playOutputAnimation).toHaveBeenCalled();
    });

    it('fallbackCopyTextToClipboard: should call playOutputAnimation if execCommand is successful', () => {
      document.execCommand.mockReturnValue(true);
      uiManagerInstance.fallbackCopyTextToClipboard(testText);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(uiManagerInstance.playOutputAnimation).toHaveBeenCalled();
      expect(mockVueApp.outputButtonText).toBe('Default'); // Stays default on success
    });

    it('fallbackCopyTextToClipboard: should update button text to "Failed" if execCommand fails', () => {
      document.execCommand.mockReturnValue(false);
      uiManagerInstance.fallbackCopyTextToClipboard(testText);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(uiManagerInstance.playOutputAnimation).not.toHaveBeenCalled();
      expect(mockVueApp.outputButtonText).toBe(mockVueApp.gameData.uiMessages.outputButton.failed);
      jest.runAllTimers(); // For the setTimeout to reset button text
      expect(mockVueApp.outputButtonText).toBe(mockVueApp.gameData.uiMessages.outputButton.default);
    });

    it('fallbackCopyTextToClipboard: should update button text to "Error" on execCommand error', () => {
      document.execCommand.mockImplementation(() => { throw new Error('Exec error'); });
      uiManagerInstance.fallbackCopyTextToClipboard(testText);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(uiManagerInstance.playOutputAnimation).not.toHaveBeenCalled();
      expect(mockVueApp.outputButtonText).toBe(mockVueApp.gameData.uiMessages.outputButton.error);
      jest.runAllTimers(); // For the setTimeout
      expect(mockVueApp.outputButtonText).toBe(mockVueApp.gameData.uiMessages.outputButton.default);
    });
  });

  describe('playOutputAnimation', () => {
    let mockButton;
    beforeEach(() => {
        mockButton = mockVueApp.$refs.outputButton;
        mockButton.classList.add.mockClear();
        mockButton.classList.remove.mockClear();
        mockButton.classList.contains.mockReturnValue(false); // Not animating initially
    });

    it('should not run if button is already animating', () => {
        mockButton.classList.contains.mockReturnValue(true); // Is animating
        uiManagerInstance.playOutputAnimation();
        expect(mockButton.classList.add).not.toHaveBeenCalledWith('is-animating');
    });

    it('should not run if button ref is missing', () => {
        mockVueApp.$refs.outputButton = null;
        uiManagerInstance.playOutputAnimation();
        // No error should be thrown, and no classList methods called on null
        expect(mockButton.classList.add).not.toHaveBeenCalled();
    });

    it('should perform button animation class changes and text updates in sequence', () => {
      const { animationTimings, animating, default: defaultText } = mockVueApp.gameData.uiMessages.outputButton;

      uiManagerInstance.playOutputAnimation();

      expect(mockButton.classList.add).toHaveBeenCalledWith('is-animating');
      expect(mockButton.classList.add).toHaveBeenCalledWith('state-1');

      jest.advanceTimersByTime(animationTimings.state1_bgFill);
      expect(mockButton.classList.remove).toHaveBeenCalledWith('state-1');
      expect(mockVueApp.outputButtonText).toBe(animating);
      expect(mockButton.classList.add).toHaveBeenCalledWith('state-2');

      jest.advanceTimersByTime(animationTimings.state2_textHold);
      expect(mockButton.classList.remove).toHaveBeenCalledWith('state-2');
      expect(mockButton.classList.add).toHaveBeenCalledWith('state-3');

      jest.advanceTimersByTime(animationTimings.state3_textFadeOut);
      expect(mockButton.classList.remove).toHaveBeenCalledWith('state-3');
      expect(mockVueApp.outputButtonText).toBe(defaultText);
      expect(mockButton.classList.add).toHaveBeenCalledWith('state-4');

      jest.advanceTimersByTime(animationTimings.state4_bgReset);
      expect(mockButton.classList.remove).toHaveBeenCalledWith('is-animating', 'state-4');
    });
  });

  describe('toggleDriveMenu', () => {
    let addEventListenerSpy, removeEventListenerSpy;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      mockVueApp.showDriveMenu = false;
      mockVueApp.currentDriveMenuHandler = null;
    });

    it('should open menu and add click listener if closed', () => {
      uiManagerInstance.toggleDriveMenu();
      expect(mockVueApp.showDriveMenu).toBe(true);
      expect(mockVueApp.$nextTick).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(mockVueApp.currentDriveMenuHandler).toBeInstanceOf(Function);
    });

    it('should close menu and remove click listener if open', () => {
      // First, open the menu
      uiManagerInstance.toggleDriveMenu();
      const handler = mockVueApp.currentDriveMenuHandler; // Capture the handler

      // Now, toggle to close
      uiManagerInstance.toggleDriveMenu();
      expect(mockVueApp.showDriveMenu).toBe(false);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, true);
      expect(mockVueApp.currentDriveMenuHandler).toBeNull();
    });

    it('click-outside handler should close menu and remove itself', () => {
        // Open menu
        uiManagerInstance.toggleDriveMenu();
        const clickOutsideHandler = mockVueApp.currentDriveMenuHandler;
        expect(clickOutsideHandler).toBeInstanceOf(Function);

        // Simulate click outside
        mockVueApp.$refs.driveMenu.contains.mockReturnValue(false);
        mockVueApp.$refs.driveMenuToggleButton.contains.mockReturnValue(false);

        const mockEvent = { target: document.createElement('div') }; // A generic target outside the menu
        clickOutsideHandler(mockEvent); // Call the handler

        expect(mockVueApp.showDriveMenu).toBe(false);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', clickOutsideHandler, true);
        expect(mockVueApp.currentDriveMenuHandler).toBeNull();
    });

    it('click-outside handler should not close menu if click is inside menu', () => {
        uiManagerInstance.toggleDriveMenu();
        const clickOutsideHandler = mockVueApp.currentDriveMenuHandler;

        mockVueApp.$refs.driveMenu.contains.mockReturnValue(true); // Click is inside menu
        const mockEvent = { target: document.createElement('div') };
        clickOutsideHandler(mockEvent);

        expect(mockVueApp.showDriveMenu).toBe(true); // Menu remains open
        expect(removeEventListenerSpy).not.toHaveBeenCalledWith('click', clickOutsideHandler, true);
    });

     it('click-outside handler should not close menu if click is on toggle button', () => {
        uiManagerInstance.toggleDriveMenu();
        const clickOutsideHandler = mockVueApp.currentDriveMenuHandler;

        mockVueApp.$refs.driveMenu.contains.mockReturnValue(false);
        mockVueApp.$refs.driveMenuToggleButton.contains.mockReturnValue(true); // Click on toggle button
        const mockEvent = { target: document.createElement('div') };
        clickOutsideHandler(mockEvent);

        expect(mockVueApp.showDriveMenu).toBe(true); // Menu remains open
    });

    it('should clean up previous listener if toggleDriveMenu is called multiple times rapidly while menu is open', () => {
        // Open menu - first listener added
        uiManagerInstance.toggleDriveMenu();
        const firstHandler = mockVueApp.currentDriveMenuHandler;

        // Toggle again (to close) - first listener removed
        uiManagerInstance.toggleDriveMenu();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', firstHandler, true);
        expect(mockVueApp.currentDriveMenuHandler).toBeNull();

        // Toggle again (to open) - second listener added
        uiManagerInstance.toggleDriveMenu();
        const secondHandler = mockVueApp.currentDriveMenuHandler;
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', secondHandler, true);

        expect(firstHandler).not.toBe(secondHandler); // Ensure they are different handlers if logic creates new one each time
    });
  });
});
