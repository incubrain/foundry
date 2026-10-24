<script setup lang="ts">
// Every signal the page emits surfaces as a small station chip, so the
// recording is visible wherever you are on the drum — except while the live
// tail itself is on screen (it already shows the same rows, bigger).
interface Toast { key: number, type: string, detail: string }

const toasts = ref<Toast[]>([])
let key = 0

const liveVisible = ref(false)
onMounted(() => {
  const live = document.getElementById('live')
  if (!live) return
  const io = new IntersectionObserver(
    ([entry]) => { liveVisible.value = !!entry?.isIntersecting },
    { threshold: 0.12 },
  )
  io.observe(live)
})

const nuxtApp = useNuxtApp()
nuxtApp.hook('events:track', (payload: { id?: string, type?: string, target?: string }) => {
  if (import.meta.server || liveVisible.value) return
  const toast = {
    key: key++,
    type: payload.type ?? 'event',
    detail: payload.target ?? payload.id ?? '',
  }
  toasts.value.push(toast)
  if (toasts.value.length > 3) toasts.value.shift()
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.key !== toast.key)
  }, 2600)
})
</script>

<template>
  <!-- #teleports is Nuxt's SSR-safe target. `to="body"` makes Vue hydrate from
       body.firstChild, so anything prepended to <body> (e.g. the direction-contract
       comment) shifts the walk by one node and breaks hydration. -->
  <Teleport to="#teleports">
    <!-- Visual mirror only: the live tail carries the aria-live region -->
    <div
      class="pointer-events-none fixed right-3 bottom-3 z-50 flex flex-col items-end gap-1.5 sm:right-5 sm:bottom-5"
      aria-hidden="true"
    >
      <TransitionGroup name="st-toast">
        <div
          v-for="t in toasts"
          :key="t.key"
          class="st-toast flex items-baseline gap-2 border px-3 py-1.5"
          :style="{ background: 'var(--st-soot-2)', borderColor: 'var(--st-grat)' }"
        >
          <span
            class="inline-block h-1.5 w-1.5 self-center"
            style="background: var(--st-verm)"
          />
          <span
            class="st-mono !text-[0.6rem] !tracking-[0.12em] uppercase"
            :style="{ color: t.type === 'offer_click' ? 'var(--st-verm)' : 'var(--st-light)' }"
          >{{ t.type }}</span>
          <code
            class="st-mono max-w-48 truncate !text-[0.6rem]"
            style="color: var(--st-dim); letter-spacing: 0"
          >{{ t.detail }}</code>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
