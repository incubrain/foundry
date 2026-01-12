<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

export interface Document {
  title: string;
  description?: string;
  category: string;
  date?: string;
  url?: string;
  external?: boolean;
  anchor?: string;
  badge?: {
    label: string;
    color?:
      | 'primary'
      | 'secondary'
      | 'success'
      | 'info'
      | 'warning'
      | 'error'
      | 'neutral';
  };
}

interface Props {
  documents: Document[];
  title?: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  documents: () => [],
  title: undefined,
  description: undefined,
});

const columns: TableColumn<Document>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    size: 500,
    minSize: 300,
    cell: ({ row }) => {
      const doc = row.original;
      return h(
        'div',
        {
          class:
            'flex flex-col gap-1 py-2 max-w-[500px] min-w-[300px] text-wrap',
        },
        [
          h('div', { class: 'flex items-center gap-2 flex-wrap' }, [
            h('span', { class: 'font-medium text-highlighted' }, doc.title),
            doc.badge
              ? h(UBadge, {
                  label: doc.badge.label,
                  color: doc.badge.color || 'primary',
                  variant: 'subtle',
                  size: 'sm',
                })
              : null,
          ]),
          doc.description
            ? h(
                'span',
                { class: 'text-sm text-muted line-clamp-2' },
                doc.description,
              )
            : null,
        ],
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
    minSize: 100,
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-sm capitalize whitespace-nowrap' },
        row.getValue('category'),
      ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 120,
    minSize: 100,
  },
  {
    id: 'actions',
    size: 160,
    minSize: 140,
    meta: {
      class: {
        td: 'text-right',
      },
    },
    cell: ({ row }) => {
      const doc = row.original;
      const url = doc.url || (doc.anchor ? `#${doc.anchor}` : '#');

      return h(UButton, {
        label: doc.external ? 'View Document' : 'View',
        icon: doc.external ? 'i-lucide-external-link' : 'i-lucide-file-text',
        to: url,
        color: 'primary',
        variant: 'outline',
        size: 'sm',
        external: doc.external,
        target: doc.external ? '_blank' : undefined,
      });
    },
  },
];
</script>

<template>
  <div class="space-y-4">
    <div v-if="title || description" class="space-y-2">
      <h2 v-if="title" class="text-2xl font-bold">
        {{ title }}
      </h2>
      <p v-if="description" class="text-muted">
        {{ description }}
      </p>
    </div>

    <div class="w-full overflow-x-auto">
      <UTable :data="documents" :columns="columns" />
    </div>
  </div>
</template>
