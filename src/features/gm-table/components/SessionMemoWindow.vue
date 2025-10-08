<script setup>
import { reactive, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  position: {
    type: Object,
    required: true,
  },
  size: {
    type: Object,
    required: true,
  },
  minimized: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'update:position', 'update:size', 'update:minimized']);

const dragState = reactive({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
const resizeState = reactive({ active: false, startX: 0, startY: 0, originWidth: 0, originHeight: 0 });

function clampPosition(x, y) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = props.size.width;
  const height = props.minimized ? 48 : props.size.height;
  const clampedX = Math.min(Math.max(0, x), Math.max(0, viewportWidth - width));
  const clampedY = Math.min(Math.max(0, y), Math.max(0, viewportHeight - height));
  return { x: clampedX, y: clampedY };
}

function startDrag(event) {
  dragState.active = true;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.originX = props.position.x;
  dragState.originY = props.position.y;
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', stopDrag);
}

function handleDragMove(event) {
  if (!dragState.active) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const target = clampPosition(dragState.originX + deltaX, dragState.originY + deltaY);
  emit('update:position', target);
}

function stopDrag() {
  dragState.active = false;
  window.removeEventListener('mousemove', handleDragMove);
  window.removeEventListener('mouseup', stopDrag);
}

function startResize(event) {
  event.stopPropagation();
  resizeState.active = true;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.originWidth = props.size.width;
  resizeState.originHeight = props.size.height;
  window.addEventListener('mousemove', handleResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function handleResizeMove(event) {
  if (!resizeState.active) return;
  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;
  const width = Math.max(240, resizeState.originWidth + deltaX);
  const height = Math.max(200, resizeState.originHeight + deltaY);
  emit('update:size', { width, height });
}

function stopResize() {
  resizeState.active = false;
  window.removeEventListener('mousemove', handleResizeMove);
  window.removeEventListener('mouseup', stopResize);
}

function toggleMinimize() {
  emit('update:minimized', !props.minimized);
}

function handleInput(event) {
  emit('update:modelValue', event.target.value);
}

watch(
  () => props.minimized,
  () => {
    const { x, y } = clampPosition(props.position.x, props.position.y);
    emit('update:position', { x, y });
  },
);

onBeforeUnmount(() => {
  stopDrag();
  stopResize();
});
</script>

<template>
  <div
    class="session-memo"
    :class="{ 'session-memo--minimized': minimized }"
    :style="{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: minimized ? '48px' : `${size.height}px` }"
  >
    <div class="session-memo__title-bar" @mousedown="startDrag">
      <span class="session-memo__title">セッション全体メモ</span>
      <button type="button" class="session-memo__minimize" @click="toggleMinimize">
        {{ minimized ? '▶' : '▼' }}
      </button>
    </div>
    <textarea v-if="!minimized" class="session-memo__textarea" :value="modelValue" @input="handleInput" />
    <div v-if="!minimized" class="session-memo__resize-handle" @mousedown="startResize" />
  </div>
</template>

<style scoped>
.session-memo {
  position: fixed;
  background: rgba(25, 24, 32, 0.95);
  border: 1px solid rgba(110, 93, 152, 0.4);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(6px);
  color: #f4f1ff;
  overflow: hidden;
  z-index: 40;
}

.session-memo--minimized {
  height: 48px !important;
}

.session-memo__title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(90deg, rgba(68, 54, 105, 0.8), rgba(27, 26, 43, 0.8));
  cursor: move;
  user-select: none;
}

.session-memo__title {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.session-memo__minimize {
  background: transparent;
  border: 1px solid rgba(180, 166, 220, 0.6);
  color: inherit;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.session-memo__textarea {
  flex: 1;
  width: 100%;
  background: rgba(17, 16, 24, 0.85);
  border: none;
  color: inherit;
  resize: none;
  padding: 0.75rem;
  font-family: inherit;
  line-height: 1.5;
  border-top: 1px solid rgba(110, 93, 152, 0.3);
}

.session-memo__textarea:focus {
  outline: none;
  border-color: rgba(199, 181, 255, 0.6);
}

.session-memo__resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(199, 181, 255, 0.6) 50%);
}
</style>
