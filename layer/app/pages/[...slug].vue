<!-- pages/[...slug].vue -->
<template>
  <ContentRenderer v-if="$attrs.page" :value="$attrs.page" />
</template>
