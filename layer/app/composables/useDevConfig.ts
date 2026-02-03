// composables/useDevConfig.ts
export const useDevConfig = () => {
  const isClient = import.meta.client
  const isDev = import.meta.dev

  // SSR-safe reduced API
  if (!isClient || !isDev) {
    return {
      clearAllStorage: () => {},
      getStorageSnapshot: () => ({}),
    }
  }

  const toast = useToast()
  const { local, session } = useAppStorage()

  const getStorageSnapshot = () => {
    if (import.meta.server) return { localStorage_items: {}, sessionStorage_items: {} }

    try {
      const localStorage_items = local.all()
      const sessionStorage_items = session.all()

      return { localStorage_items, sessionStorage_items }
    }
    catch (e) {
      return { localStorage_items: {}, sessionStorage_items: {} }
    }
  }

  const clearAllStorage = async () => {
    if (!isDev) return
    const before = getStorageSnapshot()

    local.clear()
    session.clear()

    const after = getStorageSnapshot()
    console.info('Storage cleared:', { before, after })

    const totalCleared
      = Object.keys(before.localStorage_items).length
        + Object.keys(before.sessionStorage_items).length

    toast.add?.({
      title: 'Development Storage Cleared',
      description: `Cleared ${totalCleared} items. Page will reload in 3 seconds.`,
      color: 'warning',
      duration: 3000,
      actions: [
        {
          label: 'Reload Now',
          onClick: () => window?.location.reload(),
        },
      ],
    })

    setTimeout(() => window?.location.reload(), 3000)
  }

  if (typeof window !== 'undefined') {
    // @ts-expect-error devTools extension
    window.devTools = {
      clearAll: clearAllStorage,
      snapshot: getStorageSnapshot,
    }
  }

  return {
    clearAllStorage,
    getStorageSnapshot,
  }
}
