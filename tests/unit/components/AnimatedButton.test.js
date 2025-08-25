import { mount } from '@vue/test-utils';
import AnimatedButton from '../../../src/components/common/AnimatedButton.vue';
import { nextTick } from 'vue';

describe('AnimatedButton', () => {
  test('animates and emits finished', async () => {
    vi.useFakeTimers();
    const wrapper = mount(AnimatedButton, {
      props: {
        defaultLabel: 'd',
        animatingLabel: 'a',
        successLabel: 's',
        timings: {
          state1_bgFill: 10,
          state2_textHold: 10,
          state3_textFadeOut: 10,
          state4_bgReset: 10,
        },
        trigger: 0,
      },
    });
    expect(wrapper.text()).toBe('d');
    await wrapper.setProps({ trigger: 1 });
    vi.advanceTimersByTime(10);
    await nextTick();
    expect(wrapper.classes()).toContain('state-2');
    expect(wrapper.text()).toBe('a');
    vi.advanceTimersByTime(10);
    await nextTick();
    vi.advanceTimersByTime(10);
    await nextTick();
    expect(wrapper.text()).toBe('s');
    vi.advanceTimersByTime(10);
    await nextTick();
    expect(wrapper.emitted().finished).toBeTruthy();
    vi.useRealTimers();
  });
});
