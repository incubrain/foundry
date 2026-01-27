<script setup lang="ts">
import type { PropType } from 'vue';

const props = defineProps({
  href: {
    type: String,
    default: '',
  },
  target: {
    type: String as PropType<
      | '_blank'
      | '_parent'
      | '_self'
      | '_top'
      | (string & object)
      | null
      | undefined
    >,
    default: undefined,
    required: false,
  },
});

const { addCitation, getCitationIndex, getReference } = useCitations();
const { getPageMetadata, resolveInternalPath } = useContentConfig();
const { getTerm, resolveGlossaryPath } = useGlossary();

const isCitation = computed(() => props.href?.startsWith('cite:'));
const isInternalLink = computed(() => props.href?.startsWith('internal:'));
const isGlossaryTerm = computed(() => props.href?.startsWith('term:'));

// Convert internal: prefix to full path with docs prefix
const internalHref = computed(() => {
  if (!isInternalLink.value) return props.href;
  const path = props.href.replace('internal:', '');
  return resolveInternalPath(path);
});

const internalPageData = computed(() => {
  if (!isInternalLink.value) return null;
  return getPageMetadata(internalHref.value);
});

// Convert term: prefix to glossary page with search param
const glossaryTermId = computed(() =>
  isGlossaryTerm.value ? props.href.replace('term:', '') : '',
);

const glossaryHref = computed(() => {
  if (!isGlossaryTerm.value) return props.href;
  return resolveGlossaryPath(glossaryTermId.value);
});

const glossaryTermData = computed(() => {
  if (!isGlossaryTerm.value) return null;
  return getTerm(glossaryTermId.value).value;
});

// Support multiple citations separated by commas: cite:id1,id2,id3
const citationIds = computed(() => {
  if (!isCitation.value) return [];
  const idsString = props.href.replace('cite:', '');
  return idsString.split(',').map((id) => id.trim());
});

// Register all citations
citationIds.value.forEach((id) => {
  if (id) addCitation(id);
});

// ✅ Get reference details for each citation (from cached data)
const citationRefs = computed(() =>
  citationIds.value.map((id) => getReference(id).value).filter(Boolean),
);

const extractRootDomain = (url: string | null) => {
  if (!url) return 'NO URL';

  const urlObj = new URL(url);
  return urlObj.origin;
};
</script>

<template>
  <!-- Citation link with tooltip + external link -->
  <span v-if="isCitation">
    <slot />
    <sup
      class="text-[0.75em] ms-1 me-0 align-super leading-none tracking-tight inline-block"
    >
      <template v-for="(id, index) in citationIds" :key="id">
        <UTooltip
          v-if="citationRefs[index]"
          :delay-duration="0"
          :text="
            extractRootDomain(
              citationRefs[index].pdf || citationRefs[index].url || null,
            )
          "
          :ui="{ content: 'max-w-xs' }"
        >
          <a
            :href="citationRefs[index].pdf || citationRefs[index].url || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="no-underline text-primary font-medium"
          >
            [{{ getCitationIndex(id).value }}]
          </a>
        </UTooltip>
        <span v-if="index < citationIds.length - 1" class="mr-0.5">,</span>
      </template>
    </sup>
  </span>

  <!-- Internal documentation link with popover -->
  <UPopover
    v-else-if="isInternalLink"
    mode="hover"
    :open-delay="300"
    :close-delay="100"
    :content="{ side: 'top', align: 'center' }"
    :ui="{ content: 'p-2 text-sm max-w-xs' }"
  >
    <NuxtLink
      :to="internalHref"
      class="font-medium underline underline-offset-[3px] decoration-dotted decoration-neutral-400 dark:decoration-neutral-500 transition-all duration-200"
    >
      <UIcon
        name="i-lucide-file-text"
        class="mr-1 inline-block text-primary size-3.5 align-baseline"
      />
      <slot />
    </NuxtLink>

    <template #content>
      <div
        v-if="internalPageData"
        class="text-gray-700 dark:text-gray-300 space-y-1"
      >
        <div class="font-semibold text-gray-900 dark:text-gray-100">
          {{ internalPageData.title }}
        </div>
        <div v-if="internalPageData.description" class="text-xs">
          {{ internalPageData.description }}
        </div>
      </div>
      <div v-else class="text-gray-700 dark:text-gray-300">
        Internal link to: <span class="font-semibold">{{ internalHref }}</span>
      </div>
    </template>
  </UPopover>

  <!-- Glossary term link with popover -->
  <UPopover
    v-else-if="isGlossaryTerm && glossaryTermData"
    mode="hover"
    :open-delay="300"
    :close-delay="100"
    :content="{ side: 'top', align: 'center' }"
    :ui="{ content: 'p-3 text-sm max-w-md' }"
  >
    <NuxtLink
      :to="glossaryHref"
      class="underline decoration-dotted decoration-neutral-400 dark:decoration-neutral-500 underline-offset-[3px] font-medium hover:decoration-solid hover:decoration-neutral-500 dark:hover:decoration-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
    >
      <slot />
    </NuxtLink>

    <template #content>
      <div class="space-y-1">
        <div class="font-semibold text-gray-900 dark:text-gray-100">
          {{ glossaryTermData.term }}
          <span
            v-if="glossaryTermData.abbreviation"
            class="font-mono text-xs text-gray-600 dark:text-gray-400"
          >
            ({{ glossaryTermData.abbreviation }})
          </span>
        </div>
        <div class="text-gray-700 dark:text-gray-300">
          {{ glossaryTermData.definition }}
        </div>
        <div v-if="glossaryTermData.category" class="pt-1">
          <UBadge
            :label="glossaryTermData.category"
            :color="
              glossaryTermData.category === 'technical'
                ? 'primary'
                : glossaryTermData.category === 'regulatory'
                  ? 'warning'
                  : glossaryTermData.category === 'ecological'
                    ? 'success'
                    : 'neutral'
            "
            variant="soft"
            size="xs"
          />
        </div>
      </div>
    </template>
  </UPopover>

  <!-- Fallback for glossary terms without data -->
  <NuxtLink
    v-else-if="isGlossaryTerm"
    :to="glossaryHref"
    class="underline decoration-dotted decoration-primary-400 dark:decoration-primary-500 underline-offset-[3px] text-primary-600 dark:text-primary-400 font-medium hover:decoration-solid hover:decoration-primary-500 dark:hover:decoration-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all"
  >
    <slot />
  </NuxtLink>

  <!-- Regular link: render as normal -->
  <NuxtLink v-else :href="props.href" :target="props.target">
    <slot />
  </NuxtLink>
</template>
