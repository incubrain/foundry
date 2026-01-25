// composables/useAppStorage.ts
/**
 * Centralized storage abstraction with configSource prefix
 * Enables future migration to database storage with minimal changes
 */
export const useAppStorage = () => {
  const config = useRuntimeConfig();
  const prefix = config.public.configSource;

  /**
   * Get prefixed storage key
   */
  const getKey = (key: string): string => {
    return `${prefix}_${key}`;
  };

  /**
   * localStorage operations (SSR-safe)
   */
  const local = {
    get: (key: string): string | null => {
      if (import.meta.server) return null;
      return localStorage.getItem(getKey(key));
    },

    set: (key: string, value: string): void => {
      if (import.meta.server) return;
      localStorage.setItem(getKey(key), value);
    },

    remove: (key: string): void => {
      if (import.meta.server) return;
      localStorage.removeItem(getKey(key));
    },

    /**
     * Get all localStorage items with the config prefix
     * @param options.log - If true, logs the data to console
     * @returns Object with unprefixed keys and their values
     */
    all: (options?: { log?: boolean }): Record<string, string | null> => {
      if (import.meta.server) return {};
      
      const items = Object.keys(localStorage)
        .filter(key => key.startsWith(`${prefix}_`))
        .reduce((acc, key) => {
          // Remove prefix from key for cleaner output
          const unprefixedKey = key.replace(`${prefix}_`, '');
          acc[unprefixedKey] = localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>);

      if (options?.log) {
        console.group(`📦 localStorage (${prefix})`);
        console.table(items);
        console.groupEnd();
      }

      return items;
    },

    /**
     * Clear all localStorage items with the config prefix
     */
    clear: (): void => {
      if (import.meta.server) return;
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith(`${prefix}_`)
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    },
  };

  /**
   * sessionStorage operations (SSR-safe)
   */
  const session = {
    get: (key: string): string | null => {
      if (import.meta.server) return null;
      return sessionStorage.getItem(getKey(key));
    },

    set: (key: string, value: string): void => {
      if (import.meta.server) return;
      sessionStorage.setItem(getKey(key), value);
    },

    remove: (key: string): void => {
      if (import.meta.server) return;
      sessionStorage.removeItem(getKey(key));
    },

    /**
     * Get all sessionStorage items with the config prefix
     * @param options.log - If true, logs the data to console
     * @returns Object with unprefixed keys and their values
     */
    all: (options?: { log?: boolean }): Record<string, string | null> => {
      if (import.meta.server) return {};
      
      const items = Object.keys(sessionStorage)
        .filter(key => key.startsWith(`${prefix}_`))
        .reduce((acc, key) => {
          // Remove prefix from key for cleaner output
          const unprefixedKey = key.replace(`${prefix}_`, '');
          acc[unprefixedKey] = sessionStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>);

      if (options?.log) {
        console.group(`📦 sessionStorage (${prefix})`);
        console.table(items);
        console.groupEnd();
      }

      return items;
    },

    /**
     * Clear all sessionStorage items with the config prefix
     */
    clear: (): void => {
      if (import.meta.server) return;
      const keysToRemove = Object.keys(sessionStorage).filter(key => 
        key.startsWith(`${prefix}_`)
      );
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    },
  };

  return { local, session, getKey };
};
