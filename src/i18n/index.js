import messagesCsv from '../contents/ui_messages.csv?raw';
import { createI18nLoader } from './loader.js';

const i18n = createI18nLoader(messagesCsv, 'ja');
export const t = (key, variables) => i18n.t(key, variables);

const driveLoadErrorMap = {
  general: 'share.loadError.message.general',
  fetchFailed: 'share.loadError.message.fetchFailed',
  parseFailed: 'share.loadError.message.parseFailed',
};

export const messages = {
  errors: {
    unexpected: t('errors.unexpected'),
  },
  googleDrive: {
    auth: {
      connected: () => ({
        title: t('googleDrive.auth.connected.title'),
        message: t('googleDrive.auth.connected.message'),
      }),
    },
    signOut: {
      success: () => ({
        title: t('googleDrive.signOut.success.title'),
        message: t('googleDrive.signOut.success.message'),
      }),
    },
    save: {
      loading: () => ({
        title: t('googleDrive.save.loading.title'),
        message: t('googleDrive.save.loading.message'),
      }),
      newLoading: () => ({
        title: t('googleDrive.save.newLoading.title'),
        message: t('googleDrive.save.newLoading.message'),
      }),
      newSuccess: () => ({
        title: t('googleDrive.save.newSuccess.title'),
        message: t('googleDrive.save.newSuccess.message'),
      }),
      success: () => ({
        title: t('googleDrive.save.success.title'),
        message: t('googleDrive.save.success.message'),
      }),
      error: (err) => ({
        title: t('googleDrive.save.error.title'),
        message: err?.message || t('googleDrive.save.error.message'),
      }),
    },
    load: {
      loading: (name) => ({
        title: t('googleDrive.load.loading.title'),
        message: t('googleDrive.load.loading.message', { name }),
      }),
      success: (name) => ({
        title: t('googleDrive.load.success.title'),
        message: t('googleDrive.load.success.message', { name }),
      }),
      error: (err) => ({
        title: t('googleDrive.load.error.title'),
        message: err?.message || t('googleDrive.load.error.message'),
      }),
      noSelection: () => ({
        title: t('googleDrive.load.noSelection.title'),
        message: t('googleDrive.load.noSelection.message'),
      }),
      missingData: () => ({
        title: t('googleDrive.load.missingData.title'),
        message: t('googleDrive.load.missingData.message'),
      }),
    },
    overwriteConfirm: (name) => ({
      title: t('googleDrive.overwriteConfirm.title'),
      message: t('googleDrive.overwriteConfirm.message', { name }),
      buttons: [
        { label: t('googleDrive.overwriteConfirm.buttons.overwrite'), value: 'overwrite', variant: 'primary' },
        {
          label: t('googleDrive.overwriteConfirm.buttons.cancel'),
          value: 'cancel',
          variant: 'secondary',
          duration: 1,
        },
      ],
    }),
    apiInitError: () => ({
      title: t('googleDrive.apiInitError.title'),
      message: t('googleDrive.apiInitError.message'),
    }),
    initPending: () => ({
      title: t('googleDrive.initPending.title'),
      message: t('googleDrive.initPending.message'),
    }),
    config: {
      loadError: () => ({
        title: t('googleDrive.config.loadError.title'),
        message: t('googleDrive.config.loadError.message'),
      }),
      requiresSignIn: () => ({
        title: t('googleDrive.config.requiresSignIn.title'),
        message: t('googleDrive.config.requiresSignIn.message'),
      }),
      updateSuccess: () => ({
        title: t('googleDrive.config.updateSuccess.title'),
        message: t('googleDrive.config.updateSuccess.message'),
      }),
      updateError: (err) => ({
        title: t('googleDrive.config.updateError.title'),
        message: err?.message || t('googleDrive.config.updateError.message'),
      }),
    },
  },
  share: {
    needSignIn: () => ({
      title: t('share.needSignIn.title'),
      message: t('share.needSignIn.message'),
    }),
    toast: {
      creating: () => ({ title: t('share.toast.creating.title'), message: t('share.toast.creating.message') }),
      success: () => ({ title: t('share.toast.success.title'), message: t('share.toast.success.message') }),
      error: (err) => ({
        title: t('share.toast.error.title'),
        message: err?.message || t('share.toast.error.message'),
      }),
      clipboardUnavailable: () => ({
        title: t('share.toast.clipboardUnavailable.title'),
        message: t('share.toast.clipboardUnavailable.message'),
      }),
    },
    errors: {
      saveFailed: t('share.errors.saveFailed'),
      shareFailed: t('share.errors.shareFailed'),
      managerMissing: t('share.errors.managerMissing'),
    },
    resultModal: {
      title: t('share.resultModal.title'),
      description: t('share.resultModal.description'),
      urlLabel: t('share.resultModal.urlLabel'),
      copyLabel: t('share.resultModal.copyLabel'),
      copySuccess: () => ({
        title: t('share.resultModal.copySuccess.title'),
        message: t('share.resultModal.copySuccess.message'),
      }),
      copyError: () => ({
        title: t('share.resultModal.copyError.title'),
        message: t('share.resultModal.copyError.message'),
      }),
    },
    loadError: {
      toast: (key = 'general') => ({
        title: t('share.loadError.title'),
        message: t(driveLoadErrorMap[key] || driveLoadErrorMap.general),
      }),
    },
  },
  characterHub: {
    driveFolder: {
      changeButton: t('characterHub.driveFolder.changeButton'),
      label: t('characterHub.driveFolder.label'),
      placeholder: t('characterHub.driveFolder.placeholder'),
    },
    buttons: {
      signIn: t('characterHub.buttons.signIn'),
    },
  },
  image: {
    loadError: (err) => ({
      title: t('image.loadError.title'),
      message: err?.message ?? t('image.loadError.message', { message: '' }),
    }),
    uploadErrors: {
      noFile: t('image.uploadErrors.noFile'),
      unsupportedType: t('image.uploadErrors.unsupportedType'),
      tooLarge: t('image.uploadErrors.tooLarge'),
      readError: t('image.uploadErrors.readError'),
    },
  },
  dataExport: {
    loadError: (msg) => ({
      title: t('dataExport.loadError.title'),
      message: msg ?? t('dataExport.loadError.message', { message: '' }),
    }),
  },
  file: {
    loadError: t('file.loadError'),
    unsupportedFormat: t('file.unsupportedFormat'),
  },
  ui: {
    header: {
      defaultTitle: t('ui.header.defaultTitle'),
      helpLabel: t('ui.header.helpLabel'),
      newCharacter: t('ui.header.newCharacter'),
      signIn: t('ui.header.signIn'),
      signOut: t('ui.header.signOut'),
    },
    footer: {
      experience: t('ui.footer.experience'),
      output: t('ui.footer.output'),
      share: t('ui.footer.share'),
      copyEdit: t('ui.footer.copyEdit'),
    },
    viewModeBanner: t('ui.viewModeBanner'),
    buttons: {
      saveCloudNew: t('ui.buttons.saveCloudNew'),
      saveCloudOverwrite: t('ui.buttons.saveCloudOverwrite'),
      saveCloudTitle: t('ui.buttons.saveCloudTitle'),
      loadCloud: t('ui.buttons.loadCloud'),
      loadCloudTitle: t('ui.buttons.loadCloudTitle'),
      saveLocal: t('ui.buttons.saveLocal'),
      saveLocalTitle: t('ui.buttons.saveLocalTitle'),
      loadLocal: t('ui.buttons.loadLocal'),
      loadLocalTitle: t('ui.buttons.loadLocalTitle'),
      save: t('ui.buttons.save'),
    },
    confirmations: {
      unsavedChanges: {
        title: t('ui.confirmations.unsavedChanges.title'),
        message: t('ui.confirmations.unsavedChanges.message'),
        buttons: [
          { label: t('ui.confirmations.unsavedChanges.buttons.save'), value: 'save', variant: 'primary' },
          { label: t('ui.confirmations.unsavedChanges.buttons.discard'), value: 'discard', variant: 'secondary' },
          { label: t('ui.confirmations.unsavedChanges.buttons.cancel'), value: 'cancel', variant: 'secondary' },
        ],
      },
    },
    modal: {
      load: {
        title: t('ui.modal.load.title'),
        buttons: {
          loadLocal: t('ui.modal.load.buttons.loadLocal'),
          loadDrive: t('ui.modal.load.buttons.loadDrive'),
          restoreHistory: t('ui.modal.load.buttons.restoreHistory'),
        },
        signInMessage: t('ui.modal.load.signInMessage'),
      },
      historyRecovery: {
        title: t('ui.modal.historyRecovery.title'),
        description: t('ui.modal.historyRecovery.description'),
        empty: t('ui.modal.historyRecovery.empty'),
        confirm: t('ui.modal.historyRecovery.confirm'),
        cancel: t('ui.modal.historyRecovery.cancel'),
      },
      io: {
        title: t('ui.modal.io.title'),
        buttons: {
          saveLocal: t('ui.modal.io.buttons.saveLocal'),
          print: t('ui.modal.io.buttons.print'),
          chatPalette: t('ui.modal.io.buttons.chatPalette'),
        },
        chatPalette: {
          success: () => ({
            title: t('ui.modal.io.chatPalette.success.title'),
            message: t('ui.modal.io.chatPalette.success.message'),
          }),
          error: (err) => ({
            title: t('ui.modal.io.chatPalette.error.title'),
            message: err?.message || t('ui.modal.io.chatPalette.error.message'),
          }),
          clipboardUnavailable: t('ui.modal.io.chatPalette.clipboardUnavailable'),
        },
      },
    },
  },
  driveLoadPage: {
    title: t('driveLoadPage.title'),
    placeholder: t('driveLoadPage.placeholder'),
    emptyMessage: t('driveLoadPage.emptyMessage'),
    buttons: {
      back: t('driveLoadPage.buttons.back'),
      refresh: t('driveLoadPage.buttons.refresh'),
    },
    status: {
      loading: t('driveLoadPage.status.loading'),
      refreshed: t('driveLoadPage.status.refreshed'),
      error: t('driveLoadPage.status.error'),
      retryHint: t('driveLoadPage.status.retryHint'),
    },
    labels: {
      untitled: t('driveLoadPage.labels.untitled'),
      unknownCharacter: t('driveLoadPage.labels.unknownCharacter'),
      created: t('driveLoadPage.labels.created'),
      modified: t('driveLoadPage.labels.modified'),
      hash: t('driveLoadPage.labels.hash'),
      driveHash: t('driveLoadPage.labels.driveHash'),
      cachedHash: t('driveLoadPage.labels.cachedHash'),
      notAvailable: t('driveLoadPage.labels.notAvailable'),
      unknownDate: t('driveLoadPage.labels.unknownDate'),
      shared: t('driveLoadPage.labels.shared'),
      sharedAria: t('driveLoadPage.labels.sharedAria'),
      selectAction: t('driveLoadPage.labels.selectAction'),
    },
    actions: {
      load: t('driveLoadPage.actions.load'),
      delete: t('driveLoadPage.actions.delete'),
      share: t('driveLoadPage.actions.share'),
      unshare: t('driveLoadPage.actions.unshare'),
      unshareShort: t('driveLoadPage.actions.unshareShort'),
      unshareDisabled: t('driveLoadPage.actions.unshareDisabled'),
      unshareDisabledShort: t('driveLoadPage.actions.unshareDisabledShort'),
      cancel: t('driveLoadPage.actions.cancel'),
      download: t('driveLoadPage.actions.download'),
      loadAria: (name) => t('driveLoadPage.actions.loadAria', { name }),
      deleteAria: (name) => t('driveLoadPage.actions.deleteAria', { name }),
      shareAria: (name) => t('driveLoadPage.actions.shareAria', { name }),
      unshareAria: (name) => t('driveLoadPage.actions.unshareAria', { name }),
      downloadAria: (name) => t('driveLoadPage.actions.downloadAria', { name }),
    },
    confirmations: {
      delete: (name) => t('driveLoadPage.confirmations.delete', { name }),
      unshare: (name) => t('driveLoadPage.confirmations.unshare', { name }),
    },
    toasts: {
      share: {
        loading: () => ({
          title: t('driveLoadPage.toasts.share.loading.title'),
          message: t('driveLoadPage.toasts.share.loading.message'),
        }),
        success: () => ({
          title: t('driveLoadPage.toasts.share.success.title'),
          message: t('driveLoadPage.toasts.share.success.message'),
        }),
        error: (err) => ({
          title: t('driveLoadPage.toasts.share.error.title'),
          message: err?.message || t('driveLoadPage.toasts.share.error.message'),
        }),
      },
      unshare: {
        loading: () => ({
          title: t('driveLoadPage.toasts.unshare.loading.title'),
          message: t('driveLoadPage.toasts.unshare.loading.message'),
        }),
        success: () => ({
          title: t('driveLoadPage.toasts.unshare.success.title'),
          message: t('driveLoadPage.toasts.unshare.success.message'),
        }),
        error: (err) => ({
          title: t('driveLoadPage.toasts.unshare.error.title'),
          message: err?.message || t('driveLoadPage.toasts.unshare.error.message'),
        }),
      },
      download: {
        loading: () => ({
          title: t('driveLoadPage.toasts.download.loading.title'),
          message: t('driveLoadPage.toasts.download.loading.message'),
        }),
        success: () => ({
          title: t('driveLoadPage.toasts.download.success.title'),
          message: t('driveLoadPage.toasts.download.success.message'),
        }),
        error: (err) => ({
          title: t('driveLoadPage.toasts.download.error.title'),
          message: err?.message || t('driveLoadPage.toasts.download.error.message'),
        }),
      },
      delete: {
        loading: () => ({
          title: t('driveLoadPage.toasts.delete.loading.title'),
          message: t('driveLoadPage.toasts.delete.loading.message'),
        }),
        success: () => ({
          title: t('driveLoadPage.toasts.delete.success.title'),
          message: t('driveLoadPage.toasts.delete.success.message'),
        }),
        error: (err) => ({
          title: t('driveLoadPage.toasts.delete.error.title'),
          message: err?.message || t('driveLoadPage.toasts.delete.error.message'),
        }),
      },
    },
    errors: {
      missingDriveManager: t('driveLoadPage.errors.missingDriveManager'),
      folderUnavailable: t('driveLoadPage.errors.folderUnavailable'),
      apiUnavailable: t('driveLoadPage.errors.apiUnavailable'),
      cacheFailed: t('driveLoadPage.errors.cacheFailed'),
      syncFailed: t('driveLoadPage.errors.syncFailed'),
    },
  },
  sheet: {
    loadIndicator: {
      label: t('sheet.loadIndicator.label'),
    },
    toggles: {
      showDescription: t('sheet.toggles.showDescription'),
    },
    images: {
      alt: t('sheet.images.alt'),
      previous: t('sheet.images.previous'),
      next: t('sheet.images.next'),
      add: t('sheet.images.add'),
      delete: t('sheet.images.delete'),
      deleteAria: t('sheet.images.deleteAria'),
      empty: t('sheet.images.empty'),
    },
    placeholders: {
      expertSkill: t('sheet.placeholders.expertSkill'),
      expertSkillDisabled: t('sheet.placeholders.expertSkillDisabled'),
      specialSkillNote: t('sheet.placeholders.specialSkillNote'),
      characterMemo: t('sheet.placeholders.characterMemo'),
      weaponName: t('sheet.placeholders.weaponName'),
      armorName: t('sheet.placeholders.armorName'),
      adventureMemo: t('sheet.placeholders.adventureMemo'),
    },
    aria: {
      deleteItem: t('sheet.aria.deleteItem'),
      removeExpert: t('sheet.aria.removeExpert'),
      addExpert: t('sheet.aria.addExpert'),
      removeSpecialSkill: t('sheet.aria.removeSpecialSkill'),
      addSpecialSkill: t('sheet.aria.addSpecialSkill'),
      addAdventureLog: t('sheet.aria.addAdventureLog'),
    },
    sections: {
      basicInfo: {
        title: t('sheet.sections.basicInfo.title'),
        fields: {
          name: t('sheet.sections.basicInfo.fields.name'),
          playerName: t('sheet.sections.basicInfo.fields.playerName'),
          species: t('sheet.sections.basicInfo.fields.species'),
          rareSpecies: t('sheet.sections.basicInfo.fields.rareSpecies'),
          gender: t('sheet.sections.basicInfo.fields.gender'),
          age: t('sheet.sections.basicInfo.fields.age'),
          height: t('sheet.sections.basicInfo.fields.height'),
          weight: t('sheet.sections.basicInfo.fields.weight'),
          origin: t('sheet.sections.basicInfo.fields.origin'),
          occupation: t('sheet.sections.basicInfo.fields.occupation'),
          faith: t('sheet.sections.basicInfo.fields.faith'),
        },
      },
      scar: {
        title: t('sheet.sections.scar.title'),
        fields: {
          initial: t('sheet.sections.scar.fields.initial'),
          current: t('sheet.sections.scar.fields.current'),
        },
      },
      weakness: {
        title: t('sheet.sections.weakness.title'),
        columns: {
          text: t('sheet.sections.weakness.columns.text'),
          acquired: t('sheet.sections.weakness.columns.acquired'),
        },
      },
      skills: {
        title: t('sheet.sections.skills.title'),
      },
      memo: {
        title: t('sheet.sections.memo.title'),
        subMemo: {
          titlePlaceholder: t('sheet.sections.memo.subMemo.titlePlaceholder'),
          contentPlaceholder: t('sheet.sections.memo.subMemo.contentPlaceholder'),
          spoilerLabel: t('sheet.sections.memo.subMemo.spoilerLabel'),
          spoilerNotice: t('sheet.sections.memo.subMemo.spoilerNotice'),
          readButton: t('sheet.sections.memo.subMemo.readButton'),
          addButton: t('sheet.sections.memo.subMemo.addButton'),
          deleteLabel: t('sheet.sections.memo.subMemo.deleteLabel'),
          toggle: {
            expand: t('sheet.sections.memo.subMemo.toggle.expand'),
            collapse: t('sheet.sections.memo.subMemo.toggle.collapse'),
          },
          deleteConfirm: {
            title: t('sheet.sections.memo.subMemo.deleteConfirm.title'),
            message: t('sheet.sections.memo.subMemo.deleteConfirm.message'),
            delete: t('sheet.sections.memo.subMemo.deleteConfirm.delete'),
            cancel: t('sheet.sections.memo.subMemo.deleteConfirm.cancel'),
          },
        },
      },
      specialSkills: {
        title: t('sheet.sections.specialSkills.title'),
        columns: {
          group: t('sheet.sections.specialSkills.columns.group'),
          name: t('sheet.sections.specialSkills.columns.name'),
          acquired: t('sheet.sections.specialSkills.columns.acquired'),
        },
      },
      items: {
        title: t('sheet.sections.items.title'),
        labels: {
          otherItems: t('sheet.sections.items.labels.otherItems'),
          slots: {
            weapon1: t('sheet.sections.items.labels.slots.weapon1'),
            weapon2: t('sheet.sections.items.labels.slots.weapon2'),
            armor: t('sheet.sections.items.labels.slots.armor'),
          },
        },
      },
      adventureLog: {
        title: t('sheet.sections.adventureLog.title'),
        columns: {
          scenario: t('sheet.sections.adventureLog.columns.scenario'),
          experience: t('sheet.sections.adventureLog.columns.experience'),
          scar: t('sheet.sections.adventureLog.columns.scar'),
        },
      },
    },
  },
  outputButton: {
    default: t('outputButton.default'),
    success: t('outputButton.success'),
    error: t('outputButton.error'),
    animating: t('outputButton.animating'),
    animationTimings: {
      state1_bgFill: 500,
      state2_textHold: 1000,
      state3_textFadeOut: 500,
      state4_bgReset: 700,
      state5_successHold: 300,
    },
  },
  weaknessDropdownHelp: t('weaknessDropdownHelp'),
  specialSkillDropdownHelp: t('specialSkillDropdownHelp'),
};
