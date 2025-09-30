import { mount } from '@vue/test-utils';
import IoModal from '../../../src/components/modals/contents/IoModal.vue';

describe('IoModal', () => {
  const baseProps = {
    saveLocalLabel: 'save local',
    loadLocalLabel: 'load local',
    outputLabels: { default: 'out', animating: 'anim', success: 'done' },
    outputTimings: {},
    printLabel: 'print',
    driveDescription: 'desc',
    driveOpenLabel: 'open',
    driveNewLabel: 'new',
    driveOverwriteLabel: 'overwrite',
    signInLabel: 'sign in',
    signOutLabel: 'sign out',
  };

  test('renders sign-in button when not signed in', async () => {
    const wrapper = mount(IoModal, {
      props: {
        ...baseProps,
        signedIn: false,
        canOverwrite: false,
      },
    });

    await wrapper.find('button.button-base').trigger('click');
    expect(wrapper.emitted()['save-local']).toHaveLength(1);

    const signInButton = wrapper.findAll('button.button-base').at(-1);
    expect(signInButton.text()).toBe('sign in');
    await signInButton.trigger('click');
    expect(wrapper.emitted()['google-sign-in']).toHaveLength(1);
  });

  test('disables overwrite button when cannot overwrite', () => {
    const wrapper = mount(IoModal, {
      props: {
        ...baseProps,
        signedIn: true,
        canOverwrite: false,
      },
    });

    const buttons = wrapper.findAll('button.button-base');
    const overwriteButton = buttons.find((btn) => btn.text() === 'overwrite');
    expect(overwriteButton.attributes('disabled')).toBeDefined();
  });
});
