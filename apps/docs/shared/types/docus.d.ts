declare module '#app' {
  interface PageMeta {
    /**
     * Define if the page should display the header
     * @default true
     */
    header?: boolean
    /**
     * Define if the page should display the footer
     * @default true
     */
    footer?: boolean
    /**
     * Define if the page should display the banner
     * @default true
     */
    banner?: boolean
  }
}
export {}