<script setup lang="ts">
const { stars, shootingStars, isClient } = useStarfield(60, 4)
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Starfield Background -->
    <div v-if="isClient" class="starfield-container">
      <div
        v-for="star in stars"
        :key="`star-${star.id}`"
        class="star"
        :style="star.style"
      />
      <div
        v-for="shootingStar in shootingStars"
        :key="`shooting-${shootingStar.id}`"
        class="shooting-star"
        :style="shootingStar.style"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <NavHeader />

      <main class="py-12 lg:py-16">
        <UContainer>
          <slot />
        </UContainer>
      </main>

      <NavFooter />
    </div>
  </div>
</template>
