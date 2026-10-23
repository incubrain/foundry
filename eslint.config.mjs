import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

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
}, {
  files: [
    'cli/**/*.ts',
  ],
}).append(
  // Agent worktrees are full repo copies — never lint them as part of this tree.
  { ignores: ['.claude/worktrees/**'] },
  ...pluginVueA11y.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // Downgrade to warnings until pre-existing components are fixed
      'vuejs-accessibility/mouse-events-have-key-events': 'warn',
      'vuejs-accessibility/click-events-have-key-events': 'warn',
      'vuejs-accessibility/no-static-element-interactions': 'warn',
      'vuejs-accessibility/label-has-for': 'warn',
    },
  },
)
