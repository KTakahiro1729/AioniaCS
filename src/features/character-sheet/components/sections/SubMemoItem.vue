<template>
  <div class="submemo-item">
    <div class="submemo-header sub-box-title">
      <button class="button-base submemo-toggle" type="button" @click="$emit('toggle-collapse')">
        <span>{{ collapsed ? messages.toggle.expand : messages.toggle.collapse }}</span>
      </button>
      <input
        class="submemo-title"
        type="text"
        :value="subMemo.title"
        :placeholder="messages.titlePlaceholder"
        :readonly="readonly"
        @input="$emit('update-title', $event.target.value)"
      />
      <label class="submemo-spoiler">
        <input
          type="checkbox"
          :checked="subMemo.isSpoiler"
          :disabled="readonly"
          @change="$emit('update-spoiler', $event.target.checked)"
        />
        <span>{{ messages.spoilerLabel }}</span>
      </label>
      <button class="button-base submemo-delete" type="button" :disabled="readonly" @click="$emit('request-remove')">
        {{ messages.deleteLabel }}
      </button>
    </div>
    <Transition name="fade">
      <div v-show="!collapsed" class="submemo-body box-content">
        <div v-if="showGuard" class="submemo-guard">
          <p>{{ messages.spoilerNotice }}</p>
          <button class="button-base" type="button" @click="$emit('reveal')">{{ messages.readButton }}</button>
        </div>
        <textarea
          v-else
          class="submemo-textarea"
          :placeholder="messages.contentPlaceholder"
          :value="subMemo.content"
          :readonly="readonly"
          @input="$emit('update-content', $event.target.value)"
        ></textarea>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
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
  revealed: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const showGuard = computed(() => props.subMemo.isSpoiler && !props.revealed);
</script>

<style scoped>
.submemo-item {
  border: 1px solid var(--color-border, #444);
  border-radius: 4px;
  overflow: hidden;
}

.submemo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.submemo-toggle {
  min-width: 90px;
}

.submemo-title {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border, #444);
  background: transparent;
  color: inherit;
}

.submemo-title:read-only {
  opacity: 0.7;
}

.submemo-spoiler {
  display: flex;
  align-items: center;
  gap: 6px;
}

.submemo-delete {
  min-width: 80px;
}

.submemo-body {
  padding: 12px;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
