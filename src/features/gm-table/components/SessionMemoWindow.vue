<template>
  <div class="session-memo-window" :class="{ 'is-minimized': minimized }" :style="windowStyle">
    <header class="session-memo-window__header" @pointerdown="startDrag">
      <span class="session-memo-window__title">{{ title }}</span>
      <div class="session-memo-window__actions">
        <button class="session-memo-window__button" type="button" @click="$emit('toggle-minimize')">
          {{ minimized ? '▶' : '▼' }}
        </button>
      </div>
    </header>
    <section v-show="!minimized" class="session-memo-window__body">
      <textarea
        class="session-memo-window__textarea"
        :value="memo"
        @input="$emit('update:memo', $event.target.value)"
      ></textarea>
    </section>
    <div v-show="!minimized" class="session-memo-window__resize-handle" @pointerdown="startResize"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';

const props = defineProps({
  memo: { type: String, default: '' },
  title: { type: String, default: 'セッションメモ' },
  position: {
    type: Object,
    default: () => ({ top: 120, left: 40 }),
  },
  size: {
    type: Object,
    default: () => ({ width: 320, height: 420 }),
  },
  minimized: { type: Boolean, default: false },
});

const emit = defineEmits(['update:memo', 'update:position', 'update:size', 'toggle-minimize']);

const dragState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseTop: 0,
  baseLeft: 0,
  target: null,
});
const resizeState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseWidth: 0,
  baseHeight: 0,
  target: null,
});

const windowStyle = computed(() => ({
  top: `${props.position.top}px`,
  left: `${props.position.left}px`,
  width: `${props.size.width}px`,
  height: props.minimized ? 'auto' : `${props.size.height}px`,
}));

function startDrag(event) {
  if (resizeState.active) return;
  dragState.active = true;
  dragState.pointerId = event.pointerId;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.baseTop = props.position.top;
  dragState.baseLeft = props.position.left;
  dragState.target = event.currentTarget;
  if (dragState.target?.setPointerCapture) {
    dragState.target.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function onDrag(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  emit('update:position', {
    top: dragState.baseTop + deltaY,
    left: dragState.baseLeft + deltaX,
  });
}

function endDrag(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  dragState.active = false;
  if (dragState.target?.releasePointerCapture) {
    dragState.target.releasePointerCapture(event.pointerId);
  }
  dragState.pointerId = null;
  dragState.target = null;
}

function startResize(event) {
  if (dragState.active) return;
  resizeState.active = true;
  resizeState.pointerId = event.pointerId;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.baseWidth = props.size.width;
  resizeState.baseHeight = props.size.height;
  resizeState.target = event.currentTarget;
  if (resizeState.target?.setPointerCapture) {
    resizeState.target.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function onResize(event) {
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;
  const width = Math.max(240, resizeState.baseWidth + deltaX);
  const height = Math.max(200, resizeState.baseHeight + deltaY);
  emit('update:size', { width, height });
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
  onDrag(event);
  onResize(event);
}

function onPointerUp(event) {
  endDrag(event);
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

<style scoped>

.session-memo-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  box-shadow: 0 12px 32px rgb(0 0 0 / 70%);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  overflow: hidden;
  z-index: 240;
}

.session-memo-window__header {
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-panel-header);
  color: var(--color-text-normal);
  font-family: 'Cinzel Decorative', 'Shippori Mincho', serif;
  user-select: none;
}

.session-memo-window__title {
  font-size: 1rem;
}

.session-memo-window__actions {
  display: flex;
  gap: 0.25rem;
}

.session-memo-window__button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-sub-header);
  color: var(--color-text-normal);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.session-memo-window__button:hover {
  background: var(--color-accent);
  transform: translateY(-1px);
}

.session-memo-window__body {
  flex: 1;
  padding: 0.75rem;
}

.session-memo-window__textarea {
  width: 100%;
  height: 100%;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border-normal);
  border-radius: 8px;
  color: var(--color-text-normal);
  padding: 0.75rem;
  resize: none;
  font-family: 'Shippori Mincho', serif;
  font-size: 0.95rem;
  line-height: 1.5;
}

.session-memo-window__resize-handle {
  width: 18px;
  height: 18px;
  position: absolute;
  right: 8px;
  bottom: 8px;
  cursor: se-resize;
  border-right: 2px solid var(--color-border-normal);
  border-bottom: 2px solid var(--color-border-normal);
}

.is-minimized {
  height: auto !important;
}
</style>
