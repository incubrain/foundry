<!-- app/components/convert/Email.vue -->
<script setup lang="ts">
import { z } from 'zod';

interface Props {
  location: string;
  label?: string;
  note?: string;
  layout?: 'stacked' | 'horizontal';
  successRedirect?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Get Access',
  layout: 'stacked',
  successRedirect: '/offers/template-guide-success',
});

// Schema
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const state = reactive({ email: '' });

// Real-time validation
const is_valid_email = computed(() => {
  try {
    schema.parse({ email: state.email });
    return true;
  } catch {
    return false;
  }
});

// Form submission state
const { trackEvent } = useEvents();
const route = useRoute();
const toast = useToast();
const isSubmitting = ref(false);
const isSuccess = ref(false);

// Anti-spam tracking
const formRenderedAt = ref(Date.now());
const honeypot = ref('');
const jsToken = ref('');

onMounted(() => {
  jsToken.value = crypto.randomUUID();
});

const handleSubmit = async () => {
  isSubmitting.value = true;

  try {
    const validated = schema.parse(state);

    // Client-side honeypot check (silent reject)
    if (honeypot.value) {
      isSuccess.value = true;
      navigateTo(props.successRedirect);
      return;
    }

    await trackEvent({
      id: `email_capture_submit`,
      type: 'form_submitted',
      location: route.path,
      action: 'submit',
      target: 'email_capture',
      timestamp: Date.now(),
      data: {
        formId: 'email_capture',
        email: validated.email,
        antiSpam: {
          honeypot: honeypot.value,
          timeOnForm: Date.now() - formRenderedAt.value,
          jsToken: jsToken.value,
        },
        metadata: {
          location: props.location,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        },
      },
    } satisfies EventPayload);

    isSuccess.value = true;
    navigateTo(props.successRedirect);
  } catch (error: any) {
    // Validation failed
    if (error.issues) {
      toast.add({
        title: 'Invalid email',
        description: 'Please check your email address and try again.',
        color: 'error',
      });
      isSubmitting.value = false;
      return;
    }

    const errorMsg =
      error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';

    toast.add({
      title: 'Submission failed',
      description: errorMsg,
      color: 'error',
    });

    await trackEvent({
      id: `email_capture_error`,
      type: 'form_error',
      location: 'form',
      action: 'submission_failed',
      target: 'email_capture',
      timestamp: Date.now(),
      data: {
        formId: 'email_capture',
      },
      error: errorMsg,
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Dynamic classes
const formClasses = computed(() =>
  props.layout === 'horizontal'
    ? 'flex flex-col sm:flex-row gap-3'
    : 'space-y-3',
);
</script>

<template>
  <div class="w-full">
    <!-- Universal form -->
    <UForm ref="formRef" :state="state" :schema="schema" @submit="handleSubmit">
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
        <UFormField name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="your@email.com"
            size="xl"
            :disabled="isSubmitting"
            :class="layout === 'horizontal' ? 'flex-1' : 'w-full'"
          />
        </UFormField>
        <UButton
          type="submit"
          size="xl"
          :block="layout === 'stacked'"
          :loading="isSubmitting"
          :disabled="state.email && (!is_valid_email || isSubmitting)"
          variant="solid"
          color="primary"
          class="cursor-pointer disabled:cursor-not-allowed text-toned font-black"
        >
          {{ label }}
        </UButton>
      </div>
    </UForm>

    <!-- Optional note -->
    <p v-if="note" class="text-xs text-muted text-center mt-3">
      {{ note }}
    </p>
  </div>
</template>
