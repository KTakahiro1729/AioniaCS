vi.mock('@/features/modals/stores/modalStore.js', () => ({
  useModalStore: vi.fn(),
}));

import { useModalStore } from '@/features/modals/stores/modalStore.js';
import { useModal } from '@/features/modals/composables/useModal.js';

describe('useModal composable', () => {
  test('showModal proxies to store', () => {
    const showModalMock = vi.fn();
    useModalStore.mockReturnValue({ showModal: showModalMock });
    const { showModal } = useModal();
    const opts = { title: 't' };
    showModal(opts);
    expect(showModalMock).toHaveBeenCalledWith(opts);
  });
});
