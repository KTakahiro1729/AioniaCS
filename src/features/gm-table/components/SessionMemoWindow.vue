<template>
  <div
    class="session-memo-panel"
    :class="panelClasses"
    :style="panelStyle"
  >
    <header class="session-memo-panel__header">
      <span class="session-memo-panel__title">{{ title }}</span>
      <div class="session-memo-panel__actions">
        <button
          class="session-memo-panel__button"
          type="button"
          :aria-label="placementAriaLabel"
          @click="togglePlacement"
        >
          <span class="session-memo-panel__button-label">{{ togglePlacementLabel }}</span>
          <span class="session-memo-panel__button-value">{{ placementDisplay }}</span>
        </button>
        <button
          class="session-memo-panel__button session-memo-panel__button--icon"
          type="button"
          :aria-label="minimizeAriaLabel"
          @click="$emit('toggle-minimize')"
        >
          {{ minimized ? '▶' : '▼' }}
        </button>
      </div>
    </header>
    <section v-show="!minimized" class="session-memo-panel__body">
      <textarea
        class="session-memo-panel__textarea"
        :value="memo"
        @input="$emit('update:memo', $event.target.value)"
      ></textarea>
    </section>
    <div
      v-show="!minimized"
      class="session-memo-panel__resize-handle"
      :class="`session-memo-panel__resize-handle--${placement}`"
      @pointerdown="startResize"
    ></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';

const MIN_HEIGHT = 180;
const DEFAULT_HEIGHT = 280;
const MIN_WIDTH = 260;
const DEFAULT_WIDTH = 360;
const PLACEMENTS = ['footer', 'left', 'right'];

const props = defineProps({
  memo: { type: String, default: '' },
  title: { type: String, default: 'セッションメモ' },
  placement: { type: String, default: 'footer' },
  size: {
    type: Object,
    default: () => ({ width: 360, height: 280 }),
  },
  minimized: { type: Boolean, default: false },
  placementLabels: {
    type: Object,
    default: () => ({
      footer: '下部',
      left: '左側',
      right: '右側',
      toggleLabel: '表示位置',
      ariaLabel: (current) => `メモ欄の表示位置を切り替え (現在: ${current})`,
    }),
  },
  actionLabels: {
    type: Object,
    default: () => ({
      collapse: 'メモ欄を折りたたむ',
      expand: 'メモ欄を展開する',
    }),
  },
});

const emit = defineEmits(['update:memo', 'update:size', 'update:placement', 'toggle-minimize']);

const panelClasses = computed(() => ({
  'is-footer': props.placement === 'footer',
  'is-left': props.placement === 'left',
  'is-right': props.placement === 'right',
  'is-minimized': props.minimized,
}));

const normalizedHeight = computed(() => Math.max(MIN_HEIGHT, props.size?.height ?? DEFAULT_HEIGHT));
const normalizedWidth = computed(() => Math.max(MIN_WIDTH, props.size?.width ?? DEFAULT_WIDTH));

const panelStyle = computed(() => {
  if (props.placement === 'footer') {
    return {
      height: props.minimized ? undefined : `${normalizedHeight.value}px`,
    };
  }
  return {
    width: `${normalizedWidth.value}px`,
  };
});

const placementDisplay = computed(() => props.placementLabels?.[props.placement] ?? props.placement);
const togglePlacementLabel = computed(() => props.placementLabels?.toggleLabel ?? '表示位置');
const placementAriaLabel = computed(() => {
  const builder = props.placementLabels?.ariaLabel;
  const current = placementDisplay.value;
  if (typeof builder === 'function') {
    return builder(current);
  }
  return `${togglePlacementLabel.value} (${current})`;
});
const minimizeAriaLabel = computed(() =>
  props.minimized
    ? props.actionLabels?.expand ?? 'メモ欄を展開する'
    : props.actionLabels?.collapse ?? 'メモ欄を折りたたむ',
);

const resizeState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseWidth: DEFAULT_WIDTH,
  baseHeight: DEFAULT_HEIGHT,
  target: null,
});

function togglePlacement() {
  const currentIndex = PLACEMENTS.indexOf(props.placement);
  const nextPlacement = PLACEMENTS[(currentIndex + 1) % PLACEMENTS.length] || 'footer';
  emit('update:placement', nextPlacement);
  if (nextPlacement === 'footer') {
    emit('update:size', { height: Math.max(props.size?.height ?? DEFAULT_HEIGHT, MIN_HEIGHT) });
  } else {
    emit('update:size', { width: Math.max(props.size?.width ?? DEFAULT_WIDTH, MIN_WIDTH) });
  }
}

function startResize(event) {
  if (resizeState.active) return;
  resizeState.active = true;
  resizeState.pointerId = event.pointerId;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.baseWidth = props.size?.width ?? DEFAULT_WIDTH;
  resizeState.baseHeight = props.size?.height ?? DEFAULT_HEIGHT;
  resizeState.target = event.currentTarget;
  if (resizeState.target?.setPointerCapture) {
    resizeState.target.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function onResize(event) {
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  if (props.placement === 'footer') {
    const deltaY = resizeState.startY - event.clientY;
    const height = Math.max(MIN_HEIGHT, resizeState.baseHeight + deltaY);
    emit('update:size', { height });
    return;
  }

  if (props.placement === 'left') {
    const deltaX = event.clientX - resizeState.startX;
    const width = Math.max(MIN_WIDTH, resizeState.baseWidth + deltaX);
    emit('update:size', { width });
    return;
  }

  const deltaX = resizeState.startX - event.clientX;
  const width = Math.max(MIN_WIDTH, resizeState.baseWidth + deltaX);
  emit('update:size', { width });
}

function endResize(event) {
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  resizeState.active = false;
  if (resizeState.target?.releasePointerCapture) {
    resizeState.target.releasePointerCapture(event.pointerId);
  }
  resizeState.pointerId = null;
  resizeState.target = null;
}

function onPointerMove(event) {
  onResize(event);
}

function onPointerUp(event) {
  endResize(event);
}

function addGlobalListeners() {
  if (typeof window === 'undefined') return;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function removeGlobalListeners() {
  if (typeof window === 'undefined') return;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
}

onMounted(addGlobalListeners);
onBeforeUnmount(removeGlobalListeners);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeGlobalListeners();
  });
}
</script>

<style scoped src="./SessionMemoWindow.css"></style>
