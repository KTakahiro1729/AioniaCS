<template>
  <div class="session-memo-window" :class="panelClasses" :style="panelStyle">
    <div
      :class="['session-memo-window__resize-handle', `session-memo-window__resize-handle--${orientation}`]"
      @pointerdown="startResize"
    >
      <span class="session-memo-window__resize-grip"></span>
    </div>
    <header class="session-memo-window__header">
      <span class="session-memo-window__title">{{ title }}</span>
      <div class="session-memo-window__actions">
        <div class="session-memo-window__orientation" role="group" :aria-label="positionToggleLabel">
          <button
            v-for="option in orientationOptions"
            :key="option.value"
            class="session-memo-window__button session-memo-window__button--toggle"
            type="button"
            :class="{ 'is-active': option.value === orientation }"
            :title="option.label"
            :aria-pressed="option.value === orientation"
            @click="setOrientation(option.value)"
          >
            {{ option.display }}
          </button>
        </div>
      </div>
    </header>
    <section class="session-memo-window__body">
      <textarea
        class="session-memo-window__textarea"
        :value="memo"
        @input="$emit('update:memo', $event.target.value)"
      ></textarea>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';

const MIN_HEIGHT = 180;
const MIN_WIDTH = 260;
const ORIENTATION_SET = new Set(['bottom', 'left', 'right']);

const props = defineProps({
  memo: { type: String, default: '' },
  title: { type: String, default: 'セッションメモ' },
  orientation: { type: String, default: 'bottom' },
  width: { type: Number, default: 360 },
  height: { type: Number, default: 320 },
  orientationLabels: {
    type: Object,
    default: () => ({
      bottom: 'フッター表示',
      left: '左サイド表示',
      right: '右サイド表示',
    }),
  },
  positionToggleLabel: {
    type: String,
    default: 'メモ表示位置の切り替え',
  },
});

const emit = defineEmits(['update:memo', 'update:size', 'update:orientation']);

const resizeState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseWidth: 0,
  baseHeight: 0,
  mode: 'bottom',
  target: null,
});

const normalizedOrientationLabels = computed(() => ({
  bottom: props.orientationLabels?.bottom ?? 'フッター表示',
  left: props.orientationLabels?.left ?? '左サイド表示',
  right: props.orientationLabels?.right ?? '右サイド表示',
}));

const orientationOptions = computed(() => [
  { value: 'bottom', label: normalizedOrientationLabels.value.bottom, display: '下' },
  { value: 'left', label: normalizedOrientationLabels.value.left, display: '左' },
  { value: 'right', label: normalizedOrientationLabels.value.right, display: '右' },
]);

const panelClasses = computed(() => ({
  'session-memo-window--bottom': props.orientation === 'bottom',
  'session-memo-window--left': props.orientation === 'left',
  'session-memo-window--right': props.orientation === 'right',
}));

const panelStyle = computed(() => {
  const style = {};
  if (props.orientation === 'bottom') {
    style.height = `${Math.max(MIN_HEIGHT, props.height)}px`;
  } else {
    style.width = `${Math.max(MIN_WIDTH, props.width)}px`;
  }
  return style;
});

function setOrientation(value) {
  if (!ORIENTATION_SET.has(value) || value === props.orientation) return;
  emit('update:orientation', value);
}

function startResize(event) {
  resizeState.active = true;
  resizeState.pointerId = event.pointerId;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.baseWidth = props.width;
  resizeState.baseHeight = props.height;
  resizeState.mode = props.orientation;
  resizeState.target = event.currentTarget;
  if (resizeState.target?.setPointerCapture) {
    resizeState.target.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function onResize(event) {
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  if (resizeState.mode === 'bottom') {
    const delta = resizeState.startY - event.clientY;
    const height = Math.max(MIN_HEIGHT, resizeState.baseHeight + delta);
    emit('update:size', { height });
  } else if (resizeState.mode === 'left') {
    const delta = event.clientX - resizeState.startX;
    const width = Math.max(MIN_WIDTH, resizeState.baseWidth + delta);
    emit('update:size', { width });
  } else if (resizeState.mode === 'right') {
    const delta = resizeState.startX - event.clientX;
    const width = Math.max(MIN_WIDTH, resizeState.baseWidth + delta);
    emit('update:size', { width });
  }
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
