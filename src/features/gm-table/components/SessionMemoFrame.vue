<template>
  <div class="session-memo-frame" :class="`is-${position}`">
    <header class="session-memo-frame__header">
      <h2 class="session-memo-frame__title">{{ title }}</h2>
      <div class="session-memo-frame__position-switch">
        <button
          v-for="option in positionOptions"
          :key="option.value"
          type="button"
          class="session-memo-frame__position-button"
          :class="{ 'is-active': option.value === position }"
          @click="changePosition(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </header>
    <div ref="bodyRef" class="session-memo-frame__body">
      <div class="session-memo-frame__main">
        <slot />
      </div>
      <div class="session-memo-frame__divider" @pointerdown="startResize"></div>
      <section class="session-memo-frame__panel" :style="panelStyle">
        <textarea
          class="session-memo-frame__textarea"
          :value="memo"
          @input="emit('update:memo', $event.target.value)"
        ></textarea>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

const MIN_MEMO_WIDTH = 260;
const MIN_MEMO_HEIGHT = 180;
const MIN_MAIN_WIDTH = 480;
const MIN_MAIN_HEIGHT = 360;

const props = defineProps({
  memo: { type: String, default: '' },
  title: { type: String, default: '' },
  position: {
    type: String,
    default: 'bottom',
    validator: (value) => ['bottom', 'left', 'right'].includes(value),
  },
  width: { type: Number, default: 360 },
  height: { type: Number, default: 240 },
});

const emit = defineEmits(['update:memo', 'update:position', 'update:width', 'update:height']);

const bodyRef = ref(null);

const positionOptions = [
  { value: 'bottom', label: '下部' },
  { value: 'left', label: '左側' },
  { value: 'right', label: '右側' },
];

function changePosition(nextPosition) {
  if (nextPosition !== props.position) {
    emit('update:position', nextPosition);
  }
}

const panelStyle = computed(() => {
  if (props.position === 'bottom') {
    return { height: `${props.height}px` };
  }
  return { width: `${props.width}px` };
});

const resizeState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseWidth: 0,
  baseHeight: 0,
  containerWidth: 0,
  containerHeight: 0,
  target: null,
});

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  if (typeof max === 'number' && max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), typeof max === 'number' ? max : value);
}

function startResize(event) {
  if (!bodyRef.value) return;
  resizeState.active = true;
  resizeState.pointerId = event.pointerId;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.baseWidth = props.width;
  resizeState.baseHeight = props.height;
  const rect = bodyRef.value.getBoundingClientRect();
  resizeState.containerWidth = rect.width;
  resizeState.containerHeight = rect.height;
  resizeState.target = event.currentTarget;
  if (resizeState.target?.setPointerCapture) {
    resizeState.target.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
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
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  if (props.position === 'bottom') {
    const deltaY = event.clientY - resizeState.startY;
    const maxHeight = resizeState.containerHeight - MIN_MAIN_HEIGHT;
    const height = clamp(resizeState.baseHeight - deltaY, MIN_MEMO_HEIGHT, maxHeight);
    emit('update:height', height);
  } else {
    const deltaX = event.clientX - resizeState.startX;
    const maxWidth = resizeState.containerWidth - MIN_MAIN_WIDTH;
    const width = clamp(resizeState.baseWidth + deltaX, MIN_MEMO_WIDTH, maxWidth);
    emit('update:width', width);
  }
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
</script>

<style scoped src="./SessionMemoFrame.css"></style>
