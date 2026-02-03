<!-- app/components/convert/Form.vue -->
<script setup lang="ts">
import { z } from 'zod'
import type { OfferId } from '#shared/types/events'

interface FieldDef {
  name: string
  label?: string
  type: 'text' | 'email' | 'textarea' | 'tel'
  placeholder?: string
  required?: boolean
}

interface Props {
  fields?: FieldDef[]
  location: string
  submitLabel?: string
  note?: string
  layout?: 'stacked' | 'horizontal'
  successRedirect?: string
  offerSlug?: OfferId
}

const props = withDefaults(defineProps<Props>(), {
  fields: () => [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'your@email.com',
      required: true,
    },
  ],
  submitLabel: 'Get Access',
  layout: 'stacked',
  successRedirect: undefined,
})

const redirectPath = computed(() => {
  if (props.successRedirect) return props.successRedirect
  return props.offerSlug ? `/success?offer=${props.offerSlug}` : '/success'
})

// Dynamic State
const state = reactive<Record<string, any>>({})
// Initialize state
props.fields.forEach((field) => {
  state[field.name] = undefined
})

// Dynamic Schema
const schema = computed(() => {
  const shape: Record<string, any> = {}

  props.fields.forEach((field) => {
    let validator = z.string()

    if (field.type === 'email') {
      validator = validator.email('Please enter a valid email address')
    }

    if (!field.required) {
      validator = validator.optional().or(z.literal(''))
    }
    else {
      validator = validator.min(1, `${field.label || field.name} is required`)
    }

    shape[field.name] = validator
  })

  return z.object(shape)
})

// Form submission state
const { trackEvent } = useEvents()
const route = useRoute()
const toast = useToast()
const isSubmitting = ref(false)

// Anti-spam tracking
const formRenderedAt = ref(Date.now())
const honeypot = ref('')
const jsToken = ref('')

onMounted(() => {
  jsToken.value = crypto.randomUUID()
})

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    const validated = schema.value.parse(state)

    // Client-side honeypot check (silent reject)
    if (honeypot.value) {
      navigateTo(redirectPath.value)
      return
    }

    await trackEvent({
      id: `form_submit_${props.location}`,
      type: 'form_submitted',
      target: `${props.offerSlug}_internal`, // or 'booking' based on form context
      data: {
        formData: { ...validated, formId: props.location }, // Capture all dynamic fields + formId
        antiSpam: {
          honeypot: honeypot.value,
          timeOnForm: Date.now() - formRenderedAt.value,
          jsToken: jsToken.value,
        },
      },
    })
    navigateTo(redirectPath.value)
  }
  catch (error: any) {
    // Validation failed
    if (error.issues) {
      toast.add({
        title: 'Validation Error',
        description: error.issues[0]?.message || 'Please check your inputs.',
        color: 'error',
      })
      isSubmitting.value = false
      return
    }

    const errorMsg
      = error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'

    toast.add({
      title: 'Submission failed',
      description: errorMsg,
      color: 'error',
    })

    await trackEvent({
      id: `form_error_${props.location}`,
      type: 'form_error',
      target: `${props.offerSlug}_internal`, // or 'booking' based on form context
      data: {
        formData: {
          formId: props.location,
        },
      },
      error: errorMsg,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

// Dynamic classes
const formClasses = computed(() =>
  props.layout === 'horizontal'
    ? 'flex flex-col sm:flex-row gap-3 items-end'
    : 'space-y-4',
)
</script>

<template>
  <div class="w-full">
    <!-- Universal form -->
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      @submit="handleSubmit"
    >
      <!-- Honeypot field (invisible to humans, bots will fill it) -->
      <input
        v-model="honeypot"
        type="text"
        name="website"
        autocomplete="off"
        tabindex="-1"
        aria-hidden="true"
        style="
          position: absolute;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
          height: 0;
          width: 0;
        "
      >

      <div :class="formClasses">
        <!-- Dynamic Fields Loop -->
        <template
          v-for="field in fields"
          :key="field.name"
        >
          <UFormField
            :name="field.name"
            :label="layout === 'stacked' ? field.label : undefined"
            :class="layout === 'horizontal' ? 'flex-1' : 'w-full'"
          >
            <UTextarea
              v-if="field.type === 'textarea'"
              v-model="state[field.name]"
              :placeholder="field.placeholder"
              size="xl"
              :disabled="isSubmitting"
              :rows="3"
              autoresize
            />
            <UInput
              v-else
              v-model="state[field.name]"
              :type="field.type"
              :placeholder="field.placeholder"
              size="xl"
              :disabled="isSubmitting"
            />
          </UFormField>
        </template>

        <UButton
          type="submit"
          size="xl"
          :block="layout === 'stacked'"
          :loading="isSubmitting"
          variant="solid"
          color="primary"
          class="cursor-pointer disabled:cursor-not-allowed text-toned font-black"
        >
          {{ submitLabel }}
        </UButton>
      </div>
    </UForm>

    <!-- Optional note -->
    <p
      v-if="note"
      class="text-xs text-muted text-center mt-3"
    >
      {{ note }}
    </p>
  </div>
</template>
