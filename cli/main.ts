#!/usr/bin/env node
import { createCLI } from './cli'

const cli = createCLI({
  name: 'create-founder-funnel',
  description: 'Create a new Founder Funnel project',
  setup: {
    defaults: {},
  },
})

cli.runMain()
