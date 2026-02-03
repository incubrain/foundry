<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import type { PageSectionProps, PageSectionSlots } from '@nuxt/ui'

const props = defineProps<PageSectionProps>()
const sectionRef = ref<HTMLElement | null>(null)

const { trackEvent } = useEvents()
const hasTriggered = ref(false)

const { stop } = useIntersectionObserver(
  sectionRef,
  ([entry]) => {
    if (!entry?.isIntersecting || hasTriggered.value) return

    hasTriggered.value = true

    const id = sectionRef.value?.getAttribute('id')
    if (id) {
      trackEvent({
        id: `section_view_${id}`,
        type: 'section_view',
        target: id,
      })
    }

    stop()
  },
  { threshold: 0.2 },
)

defineSlots<PageSectionSlots>()
</script>

<template>
  <div ref="sectionRef">
    <UPageSection v-bind="$props">
      <template
        v-for="(_, slot) in $slots"
        #[slot]="scope"
      >
        <slot
          :name="(slot as keyof PageSectionSlots)"
          v-bind="scope || {}"
        />
      </template>
    </UPageSection>
  </div>
</template>
