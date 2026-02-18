import { setActivePinia, createPinia } from 'pinia';
import { useModalStore } from '@/features/modals/stores/modalStore.js';

describe('modalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('showModal sets state and resolves', async () => {
    const store = useModalStore();
    const promise = store.showModal({ title: 't', message: 'm' });
    expect(store.isVisible).toBe(true);
    expect(store.title).toBe('t');
    store.resolveModal({ value: 'ok' });
    await expect(promise).resolves.toEqual({ value: 'ok' });
    expect(store.isVisible).toBe(false);
  });

  test('showModal accepts component', () => {
    const store = useModalStore();
    const component = { template: '<div />' };
    store.showModal({ component, props: { foo: 'bar' } });
    expect(store.component).toBe(component);
    expect(store.props.foo).toBe('bar');
  });

  test('showModal stores events and hideModal preserves state', () => {
    const store = useModalStore();
    const handler = vi.fn();
    store.showModal({ on: { foo: handler } });
    expect(store.events.foo).toBe(handler);
    store.hideModal();
    // hideModal only sets isVisible to false; state is preserved for the leave transition
    expect(store.isVisible).toBe(false);
    expect(store.events.foo).toBe(handler);
  });

  test('_resetState clears all modal state', () => {
    const store = useModalStore();
    store.showModal({ title: 'test', on: { foo: vi.fn() } });
    store._resetState();
    expect(store.events).toEqual({});
    expect(store.title).toBe('');
    expect(store.component).toBeNull();
  });
});
