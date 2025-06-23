import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useHeaderVisibility } from '../../../src/composables/useHeaderVisibility.js';

vi.stubGlobal('requestAnimationFrame', (fn) => fn());

Object.defineProperty(window, 'scrollY', {
  configurable: true,
  writable: true,
  value: 0,
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 80;
  },
});

const TestComp = {
  template: "<div ref='header' style='height:80px'></div>",
  setup() {
    const header = ref(null);
    useHeaderVisibility(header);
    return { header };
  },
};

describe('useHeaderVisibility', () => {
  test('moves header with scroll', async () => {
    window.scrollY = 0;
    const wrapper = mount(TestComp, { attachTo: document.body });
    await wrapper.vm.$nextTick();

    window.scrollY = 100;
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.header.style.transform).toBe('translateY(-80px)');

    window.scrollY = 70;
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.header.style.transform).toBe('translateY(-50px)');
  });
});
