<template>
  <div class="submemo-item">
    <div class="submemo-header sub-box-title">
      <button
        class="submemo-toggle"
        type="button"
        :aria-label="collapsed ? messages.toggle.expand : messages.toggle.collapse"
        @click="$emit('toggle-collapse')"
      >
        <span aria-hidden="true">{{ collapsed ? '▶' : '▼' }}</span>
        <span class="sr-only">{{ collapsed ? messages.toggle.expand : messages.toggle.collapse }}</span>
      </button>
      <input
        class="submemo-title"
        type="text"
        :value="subMemo.title"
        :placeholder="messages.titlePlaceholder"
        @change="$emit('update-title', $event.target.value)"
      />
      <label class="submemo-spoiler">
        <input type="checkbox" :checked="subMemo.isSpoiler" @change="$emit('update-spoiler', $event.target.checked)" />
        <span>{{ messages.spoilerLabel }}</span>
      </label>
      <button
        class="button-base list-button list-button--delete button-base--delete"
        type="button"
        :aria-label="messages.deleteLabel"
        @click="$emit('request-remove')"
      >
        －
      </button>
    </div>
    <Transition name="fade">
      <div v-show="!collapsed" class="submemo-body">
        <textarea
          class="submemo-textarea"
          :placeholder="messages.contentPlaceholder"
          :value="subMemo.content"
          @change="$emit('update-content', $event.target.value)"
        ></textarea>
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  subMemo: {
    type: Object,
    required: true,
  },
  messages: {
    type: Object,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.submemo-item {
  border: 1px solid var(--color-border-normal);
  border-radius: 4px;
  overflow: hidden;
}

.submemo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 0;
}

.submemo-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-main);
  font-size: 1rem;
  cursor: pointer;
}

.submemo-title {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-body);
  color: inherit;
}

.submemo-title:read-only {
  opacity: 0.7;
}

.submemo-spoiler {
  display: flex;
  align-items: center;
  gap: 4px;
}

.submemo-body {
  padding: 18px;
  background-color: var(--color-panel-body);
}

.submemo-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
}

.submemo-guard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
