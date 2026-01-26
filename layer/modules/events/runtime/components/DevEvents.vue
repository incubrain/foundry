<!-- components/DevEvents.vue -->
<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui';
import type { EventInput, TrackedEvents } from '../types/events';
import { EVENT_METADATA } from '../utils/locations';

if (!import.meta.dev) {
  throw new Error('DevEvents should only be used in development');
}

type EventExecution = {
  id: string;
  type: TrackedEvents;
  timestamp: number;
  data?: Record<string, any>;
  error?: any;
  status: 'pending' | 'success' | 'error';
};

const isOpen = ref(false);
const { trackEvent } = useEvents();
const route = useRoute();
const nuxtApp = useNuxtApp();

const eventChainTracking = ref<EventExecution[]>([]);

nuxtApp.hook('events:dev', (payload) => {
  // payload now contains full EventPayload + _devStatus
  const existingEvent = eventChainTracking.value.find(
    (e) => e.id === payload.id,
  );

  if (existingEvent) {
    existingEvent.status = payload._devStatus;
    if (payload._devStatus === 'success') {
      existingEvent.data = payload.data;
    } else {
      existingEvent.error = payload.error;
    }
  } else {
    eventChainTracking.value.push({
      id: payload.id,
      type: payload.type,
      timestamp: Date.now(),
      data: payload.data,
      error: payload.error,
      status: payload._devStatus,
    });
  }
});

const groupedItems = computed<SelectMenuItem[][]>(() => {
  const byCategory: Record<string, SelectMenuItem[]> = {
    form: [{ type: 'label', label: 'Form Events' }],
    conversion: [{ type: 'label', label: 'Conversion Events' }],
    engagement: [{ type: 'label', label: 'Engagement Events' }],
  };

  Object.entries(EVENT_METADATA).forEach(([eventType, meta]) => {
    byCategory[meta.category].push({
      label: meta.label,
      value: eventType as TrackedEvents,
      icon: meta.icon,
      description: meta.description,
    });
  });

  return Object.values(byCategory).filter((group) => group.length > 1);
});

const selectedEvent = ref<SelectMenuItem | null>(null);

const triggerEvent = async () => {
  if (!selectedEvent.value) return;

  // Clear previous tracking
  eventChainTracking.value = [];

  const eventType = selectedEvent.value as TrackedEvents;

  // Generate minimal test data based on event type
  let payload: EventInput;

  if (eventType === 'form_submitted') {
    payload = {
      id: `devtools_${Date.now()}`,
      type: 'form_submitted',
      target: 'payment', // Test with payment target
      data: {
        formData: { email: 'test@example.com', formId: 'test_form' },
        antiSpam: {
          honeypot: '',
          timeOnForm: 5000,
          jsToken: 'test_token',
        },
      },
      _devToolsTriggered: true,
    };
  } else if (eventType === 'form_error') {
    payload = {
      id: `devtools_${Date.now()}`,
      type: 'form_error',
      target: 'payment',
      data: {
        formData: {
          formId: 'test_form',
        },
      },
      error: 'Test error message',
      _devToolsTriggered: true,
    };
  } else if (eventType === 'offer_click') {
    payload = {
      id: `devtools_${Date.now()}`,
      type: 'offer_click',
      target: 'payment', // or 'service_internal', 'social', etc.
      _devToolsTriggered: true,
    };
  } else if (eventType === 'section_view') {
    payload = {
      id: `devtools_${Date.now()}`,
      type: 'section_view',
      target: 'benefits', // Test with benefits section
      _devToolsTriggered: true,
    };
  } else {
    // Fallback for any unmapped type (shouldn't happen)
    return;
  }

  await trackEvent(payload);
};

const handleClose = () => {
  isOpen.value = false;
  selectedEvent.value = null;
  eventChainTracking.value = [];
};

const getStatusColor = (status: EventExecution['status']) => {
  switch (status) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'neutral';
  }
};

const getStatusIcon = (status: EventExecution['status']) => {
  switch (status) {
    case 'success':
      return 'i-lucide-check-circle';
    case 'error':
      return 'i-lucide-x-circle';
    case 'pending':
      return 'i-lucide-loader-circle';
    default:
      return 'i-lucide-circle';
  }
};

defineExpose({
  open: () => {
    isOpen.value = true;
  },
});
</script>

<template>
  <ClientOnly>
    <UModal v-model:open="isOpen">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-zap" class="text-warning" />
          <h3 class="text-lg font-semibold">Trigger Event</h3>
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Select Event</label>
            <USelectMenu
              v-model="selectedEvent"
              :items="groupedItems"
              placeholder="Choose event..."
              class="w-full"
              :search-input="{
                icon: 'i-lucide-search',
                placeholder: 'Search...',
              }"
            >
              <template #leading="{ modelValue }">
                <UIcon
                  v-if="modelValue"
                  :name="modelValue.icon"
                  class="size-5"
                />
                <UIcon v-else name="i-lucide-zap" class="size-5 text-muted" />
              </template>

              <template #item-leading="{ item }">
                <UIcon v-if="item.icon" :name="item.icon" class="size-5" />
              </template>

              <template #item-label="{ item }">
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium">{{ item.label }}</span>
                  <span v-if="item.description" class="text-xs text-muted">
                    {{ item.description }}
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>

          <div
            v-if="selectedEvent"
            class="p-3 bg-muted/50 rounded-lg text-xs space-y-1"
          >
            <div class="font-medium">Auto-generated test data</div>
            <div class="text-muted">
              Required fields filled with mock values
            </div>
          </div>

          <div v-if="eventChainTracking.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-activity" class="text-primary size-4" />
                <span class="text-sm font-semibold">Event Chain</span>
                <UBadge
                  :label="String(eventChainTracking.length)"
                  size="xs"
                  color="primary"
                />
              </div>
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                @click="eventChainTracking = []"
              />
            </div>

            <div
              class="border border-default rounded-lg divide-y divide-default max-h-60 overflow-y-auto"
            >
              <div
                v-for="(event, index) in eventChainTracking"
                :key="event.id"
                class="p-3 hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="size-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5"
                    :class="[
                      index === 0
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted',
                    ]"
                  >
                    {{ index + 1 }}
                  </div>

                  <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center gap-2">
                      <UIcon
                        :name="getStatusIcon(event.status)"
                        :class="[
                          'size-4',
                          event.status === 'pending' && 'animate-spin',
                        ]"
                      />
                      <span class="font-mono text-xs font-medium truncate">
                        {{ event.type }}
                      </span>
                      <UBadge
                        :label="event.status"
                        :color="getStatusColor(event.status)"
                        size="xs"
                        variant="soft"
                      />
                    </div>

                    <div
                      v-if="event.error"
                      class="text-xs text-error space-y-1"
                    >
                      <div class="font-medium">Error:</div>
                      <div
                        class="font-mono bg-error/10 p-2 rounded text-[10px] break-all"
                      >
                        {{ event.error.message || String(event.error) }}
                      </div>
                    </div>

                    <details
                      v-if="event.data && Object.keys(event.data).length > 0"
                      class="text-xs"
                    >
                      <summary
                        class="cursor-pointer text-muted hover:text-default"
                      >
                        View data
                      </summary>
                      <pre
                        class="mt-1 p-2 bg-muted/50 rounded font-mono text-[10px] overflow-x-auto"
                        >{{ JSON.stringify(event.data, null, 2) }}</pre
                      >
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton label="Close" variant="ghost" @click="handleClose" />
          <UButton
            label="Trigger"
            icon="i-lucide-zap"
            :disabled="!selectedEvent"
            @click="triggerEvent"
          />
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>
