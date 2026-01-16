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

// Check if this is a citation link (href starts with "cite:")
const isCitation = computed(() => props.href?.startsWith('cite:'));

// Check if this is an internal documentation link (href starts with "internal:")
const isInternalLink = computed(() => props.href?.startsWith('internal:'));

// Check if this is a glossary term link (href starts with "term:")
const isGlossaryTerm = computed(() => props.href?.startsWith('term:'));

// Convert internal
const internalHref = computed(() => {
  if (!isInternalLink.value) return props.href;
  const path = props.href.replace('internal:', '');
  return `/${path}`;
});

// Convert term: prefix to /glossary#term-id anchor
const glossaryHref = computed(() => {
  if (!isGlossaryTerm.value) return props.href;
  const term = props.href.replace('term:', '');
  const anchorId = term.toLowerCase().replace(/\s+/g, '-');
  return `/glossary#term-${anchorId}`;
});

// Fetch glossary term data for tooltips
const { data: glossaryData } = await useAsyncData('glossary-all', () =>
  queryCollection('glossary').all(),
);

const allGlossaryTerms = computed(() => {
  if (!glossaryData.value) return [];
  return glossaryData.value.flatMap((file) => file.terms || []);
});

const glossaryTermData = computed(() => {
  if (!isGlossaryTerm.value) return null;
  const termName = props.href.replace('term:', '');
  return allGlossaryTerms.value.find(
    (t) => t.term.toLowerCase() === termName.toLowerCase() ||
           t.abbreviation?.toLowerCase() === termName.toLowerCase(),
  );
});

const glossaryTooltipText = computed(() => {
  if (!glossaryTermData.value) return '';
  const term = glossaryTermData.value.term;
  const abbr = glossaryTermData.value.abbreviation;
  const def = glossaryTermData.value.definition;

  if (abbr) {
    return `${term} (${abbr}): ${def}`;
  }
  return `${term}: ${def}`;
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
    <sup class="citation-mark tracking-tight inline-block">
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
            class="no-underline text-primary hover:underline"
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
    <NuxtLink :to="internalHref" class="internal-link">
      <slot />
    </NuxtLink>

    <template #content>
      <div class="text-gray-700 dark:text-gray-300">
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
    <NuxtLink :to="glossaryHref" class="glossary-term">
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
  <NuxtLink v-else-if="isGlossaryTerm" :to="glossaryHref" class="glossary-term">
    <slot />
  </NuxtLink>

  <!-- Regular link: render as normal -->
  <NuxtLink v-else :href="props.href" :target="props.target">
    <slot />
  </NuxtLink>
</template>

<style scoped>
.citation-mark {
  font-size: 0.75em;
  margin-inline-start: 0.25em;
  margin-inline-end: 0em;
  vertical-align: super;
  line-height: 0;
}

.glossary-term {
  text-decoration: underline dotted;
  text-decoration-color: currentColor;
  text-underline-offset: 3px;
}

.glossary-term:hover {
  text-decoration-style: solid;
}

.internal-link {
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: currentColor;
  text-underline-offset: 3px;
}

.internal-link:hover {
  text-decoration-style: solid;
}
</style>
