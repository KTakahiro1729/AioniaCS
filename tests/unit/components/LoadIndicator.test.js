import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../../../src/stores/characterStore.js'
import LoadIndicator from '../../../src/components/ui/LoadIndicator.vue'

function setWeight(store, weight) {
  store.equipments.weapon1.group = ''
  store.equipments.weapon2.group = ''
  store.equipments.armor.group = ''
  if (weight === 5) {
    store.equipments.weapon1.group = 'combat_large'
  } else if (weight === 6) {
    store.equipments.weapon1.group = 'combat_large'
    store.equipments.weapon2.group = 'catalyst'
  } else if (weight === 10) {
    store.equipments.weapon1.group = 'combat_large'
    store.equipments.weapon2.group = 'combat_large'
  } else if (weight === 11) {
    store.equipments.weapon1.group = 'combat_medium'
    store.equipments.weapon2.group = 'combat_medium'
    store.equipments.armor.group = 'heavy_armor'
  } else if (weight === 7) {
    store.equipments.weapon1.group = 'combat_large'
    store.equipments.armor.group = 'light_armor'
  } else if (weight === 12) {
    store.equipments.weapon1.group = 'combat_large'
    store.equipments.weapon2.group = 'combat_large'
    store.equipments.armor.group = 'light_armor'
  }
}

describe('LoadIndicator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('penalty state is normal at weight 5', () => {
    const store = useCharacterStore()
    setWeight(store, 5)
    const wrapper = mount(LoadIndicator)
    expect(wrapper.vm.penaltyState).toBe('normal')
  })

  it('penalty state is light at weight 6', () => {
    const store = useCharacterStore()
    setWeight(store, 6)
    const wrapper = mount(LoadIndicator)
    expect(wrapper.vm.penaltyState).toBe('light')
  })

  it('penalty state is light at weight 10', () => {
    const store = useCharacterStore()
    setWeight(store, 10)
    const wrapper = mount(LoadIndicator)
    expect(wrapper.vm.penaltyState).toBe('light')
  })

  it('penalty state is heavy at weight 11', () => {
    const store = useCharacterStore()
    setWeight(store, 11)
    const wrapper = mount(LoadIndicator)
    expect(wrapper.vm.penaltyState).toBe('heavy')
  })

  it('lights correct number of steps', () => {
    const store = useCharacterStore()
    setWeight(store, 6)
    const wrapper = mount(LoadIndicator)
    const on = wrapper.findAll('.load-indicator__step--on')
    expect(on.length).toBe(6)
  })

  it('no ghost classes in normal state', () => {
    const store = useCharacterStore()
    setWeight(store, 5)
    const wrapper = mount(LoadIndicator)
    const ghost = wrapper.findAll('.load-indicator__step--ghost-light, .load-indicator__step--ghost-heavy')
    expect(ghost.length).toBe(0)
  })

  it('adds ghost-light classes in light penalty state', () => {
    const store = useCharacterStore()
    setWeight(store, 7)
    const wrapper = mount(LoadIndicator)
    const steps = wrapper.findAll('.load-indicator__step')
    const ghostSteps = steps.slice(7, 11)
    ghostSteps.forEach((s) => expect(s.classes()).toContain('load-indicator__step--ghost-light'))
  })

  it('adds ghost-heavy classes in heavy penalty state', () => {
    const store = useCharacterStore()
    setWeight(store, 12)
    const wrapper = mount(LoadIndicator)
    const steps = wrapper.findAll('.load-indicator__step')
    const ghostSteps = steps.slice(12, 15)
    ghostSteps.forEach((s) => expect(s.classes()).toContain('load-indicator__step--ghost-heavy'))
  })
})
