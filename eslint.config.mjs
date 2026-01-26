import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  dirs: {
    src: [
      './layer',
      './examples',
    ],
  },
  features: {
    tooling: true,
    stylistic: true,
  },
}).append(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)