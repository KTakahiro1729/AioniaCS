import { describe, expect, it } from 'vitest';
import messagesCsv from '../../src/contents/ui_messages.csv?raw';
import { createI18nLoader } from '../../src/i18n/loader.js';
import { messages } from '../../src/i18n/index.js';

describe('i18n CSV loader', () => {
  const loader = createI18nLoader(messagesCsv);

  it('retrieves plain text values', () => {
    expect(loader.t('errors.unexpected')).toBe('予期せぬエラーが発生しました');
  });

  it('supports variable interpolation', () => {
    expect(loader.t('googleDrive.load.success.message', { name: 'テスト' })).toBe('テスト を読み込みました');
  });

  it('falls back to key when missing', () => {
    expect(loader.t('missing.key.example')).toBe('missing.key.example');
  });
});

describe('ja locale messages structure', () => {
  it('keeps overwrite confirmation configuration', () => {
    expect(messages.googleDrive.overwriteConfirm('テスト')).toEqual({
      title: '上書き確認',
      message: 'テスト は既に存在します。上書きしますか？',
      buttons: [
        { label: '上書き', value: 'overwrite', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    });
  });

  it('returns load success copy with injected name', () => {
    expect(messages.googleDrive.load.success('英雄')).toEqual({
      title: '読込完了',
      message: '英雄 を読み込みました',
    });
  });

  it('preserves static button labels', () => {
    expect(messages.ui.buttons).toMatchObject({
      saveCloudNew: '新規保存',
      saveCloudOverwrite: '上書保存',
      saveLocal: '端末保存',
      loadLocal: '読込',
      save: '保存',
    });
  });

  it('keeps share load error mapping intact', () => {
    expect(messages.share.loadError.toast('fetchFailed')).toEqual({
      title: '共有データエラー',
      message: '共有データの取得に失敗しました',
    });
    expect(messages.share.loadError.toast('unknown')).toEqual({
      title: '共有データエラー',
      message: '共有データの読み込みに失敗しました',
    });
  });
});
