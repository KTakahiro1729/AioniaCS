<template>
  <div
    ref="windowRef"
    class="session-memo-window"
    :class="{ 'is-minimized': minimized }"
    :style="windowStyle"
  >
    <header class="session-memo-window__header" @pointerdown="startDrag">
      <span class="session-memo-window__title">{{ title }}</span>
      <div class="session-memo-window__actions">
        <button
          class="session-memo-window__button"
          type="button"
          @pointerdown.stop
          @click="$emit('toggle-minimize')"
        >
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
    <div
      v-for="direction in resizeDirections"
      v-show="!minimized"
      :key="direction"
      class="session-memo-window__resize-handle"
      :class="`session-memo-window__resize-handle--${direction}`"
      @pointerdown="(event) => startResize(direction, event)"
    ></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

const MIN_WIDTH = 240;
const MIN_HEIGHT = 200;

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

const windowRef = ref(null);
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
  baseTop: 0,
  baseLeft: 0,
  direction: 'se',
  target: null,
});
const resizeDirections = ['se', 'sw', 'ne', 'nw'];

function getCurrentDimensions() {
  const rect = windowRef.value?.getBoundingClientRect();
  const width = rect?.width ?? props.size.width;
  const height = rect?.height ?? props.size.height;
  return { width, height };
}

function clampToViewport(top, left, width, height) {
  if (typeof window === 'undefined') {
    return { top, left, width, height };
  }

  let clampedWidth = width;
  let clampedHeight = height;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (clampedWidth > viewportWidth) {
    clampedWidth = viewportWidth;
  }
  if (clampedHeight > viewportHeight) {
    clampedHeight = viewportHeight;
  }

  const maxLeft = Math.max(viewportWidth - clampedWidth, 0);
  const maxTop = Math.max(viewportHeight - clampedHeight, 0);

  const clampedLeft = Math.min(Math.max(left, 0), maxLeft);
  const clampedTop = Math.min(Math.max(top, 0), maxTop);

  return {
    top: clampedTop,
    left: clampedLeft,
    width: clampedWidth,
    height: clampedHeight,
  };
}

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
  const { width, height } = getCurrentDimensions();
  const { top, left } = clampToViewport(
    dragState.baseTop + deltaY,
    dragState.baseLeft + deltaX,
    width,
    height,
  );
  emit('update:position', { top, left });
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

function startResize(direction, event) {
  if (dragState.active) return;
  resizeState.active = true;
  resizeState.pointerId = event.pointerId;
  resizeState.startX = event.clientX;
  resizeState.startY = event.clientY;
  resizeState.baseWidth = props.size.width;
  resizeState.baseHeight = props.size.height;
  resizeState.baseTop = props.position.top;
  resizeState.baseLeft = props.position.left;
  resizeState.direction = direction;
  resizeState.target = event.currentTarget;
  if (resizeState.target?.setPointerCapture) {
    resizeState.target.setPointerCapture(event.pointerId);
  }
  event.stopPropagation();
  event.preventDefault();
}

function onResize(event) {
  if (!resizeState.active || event.pointerId !== resizeState.pointerId) return;
  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;
  const direction = resizeState.direction;

  let width = resizeState.baseWidth;
  let height = resizeState.baseHeight;
  let top = resizeState.baseTop;
  let left = resizeState.baseLeft;

  if (direction.includes('e')) {
    width = resizeState.baseWidth + deltaX;
  }
  if (direction.includes('s')) {
    height = resizeState.baseHeight + deltaY;
  }
  if (direction.includes('w')) {
    width = resizeState.baseWidth - deltaX;
    left = resizeState.baseLeft + deltaX;
  }
  if (direction.includes('n')) {
    height = resizeState.baseHeight - deltaY;
    top = resizeState.baseTop + deltaY;
  }

  width = Math.max(MIN_WIDTH, width);
  height = Math.max(MIN_HEIGHT, height);

  if (direction.includes('w')) {
    left = resizeState.baseLeft + (resizeState.baseWidth - width);
  }
  if (direction.includes('n')) {
    top = resizeState.baseTop + (resizeState.baseHeight - height);
  }

  ({ top, left, width, height } = clampToViewport(top, left, width, height));

  emit('update:size', { width, height });
  emit('update:position', { top, left });
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

<style scoped src="./SessionMemoWindow.css"></style>

