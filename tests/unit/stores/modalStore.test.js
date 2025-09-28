import { setActivePinia, createPinia } from 'pinia';
import { useModalStore } from '../../../src/stores/modalStore.js';

describe('modalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('showModal sets current modal state and resolves with provided value', async () => {
    const store = useModalStore();
    const component = { template: '<div />' };
    const promise = store.showModal({ title: 't', component });
    expect(store.isVisible).toBe(true);
    expect(store.currentModal.title).toBe('t');
    expect(store.currentModal.component).toBe(component);
    store.resolveModal({ value: 'ok' });
    await expect(promise).resolves.toEqual({ value: 'ok' });
    expect(store.isVisible).toBe(false);
    expect(store.currentModal).toBeNull();
  });

  test('hideModal resolves pending promise with close value', async () => {
    const store = useModalStore();
    const promise = store.showModal({ title: 'closeable' });
    store.hideModal();
    await expect(promise).resolves.toEqual({ value: 'close' });
    expect(store.currentModal).toBeNull();
    expect(store.isVisible).toBe(false);
  });

  test('showModal stores props, events, and header actions', () => {
    const store = useModalStore();
    const handler = vi.fn();
    const component = { template: '<div />' };
    const header = { template: '<div />' };
    store.showModal({ component, headerActions: header, props: { foo: 'bar' }, on: { foo: handler } });
    expect(store.currentModal.component).toBe(component);
    expect(store.currentModal.headerActions).toBe(header);
    expect(store.currentModal.props.foo).toBe('bar');
    expect(store.currentModal.on.foo).toBe(handler);
    store.hideModal();
    expect(store.currentModal).toBeNull();
  });
});
