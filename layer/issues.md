# Fixed or Pending Review
- [x] fix prettier issue, not working in some page
- [x] HMR not working locally, probably because we are using layers and pnpm workspace
- [x] tailwindcss HMR and intellisense not working
- [x] docs navigation is causing issues, <bibliography> is rendering at the top of the page, this happens when navigating from a non-docs page, if refreshed it loads in the correct place, however subsiquent docs navigation does not update the <bibliography> with new citations
  - check the new ProseCite component, this was working before - it is the likely culprite
  - check the useCitations composable - it is possible this needs to be SSR friendly, maybe moving the `queryCollection` call to a server route and using `useAsyncFetch` to call it would be better
- [x] inline `MDC` components are being overwritten by `nuxt-studio` when we edit the file in the GUI
- [x] replace all `heroicons` usage with `lucide` icon equivalents
- [x] check linting in pnpm workspace, this will likely be broken
- [x] add built with `@incubrain/foundry` to footer - this should also contain the version number which should be extracted from the package.json
  - To enhance this, add basic telemetry piped to the incubrain server for understanding usage, and listing their website on our docs page
  - for further enhancement we could also add event anonomization to the server and pipe events to a data warehouse for analysis, this could feed into our SaaS version of the template
- [x] citations need to handle ids that do not exist gracefully, and provide developer feedback, ideally we would want some kind of auto complete or pattern matchiing that would return similar results for ids that do not exist
- [x] Internal linking is currently prefixing the `docs` path prefix to ALL links including pages


# Critical

- [ ] flickering of layout in between layout navigation, use transitions, but this is likely a bandaid to a larger issue with how we are using layouts and a catchall page
- [ ] editing inline components with a span passed inside [here] is not possible inside of nuxt studio as far as I can tell

# General

- [ ] standardise citation and glossary terms to use 'category' prefix, add this property to the collections for example `org-dsi`
- [ ] when copying the markdown page the <bibliography> tag contains none of the actual references, we need to think how we can resolve this; it would probably need to be done inside of the beforeParse hook
  - [ ] References is not included in ToC or markdown - this likely needs to happen at build time
- [ ] We need to create a 'preface' of sorts to define light pollution clearly and establish the problem up front, this should include 'Blue Light Hazard' as we will need to compare white/blue LEDs agains warm LEDs, maybe we need a detailed section on 'lights' to explain the different types of LEDs and their properties
  - [ ] once completed link to in the landing page problem cards
- [ ] create similar linking system for internal cross linking as we have with `:cite` and `:def`
  - [ ] consider compiling a list of pages that reference each document, add this above the `<bibliography>` tag, it should auto-build, it would also need to be added to markdown for copy
- [ ] do we need the video components anymore since nuxt/ui has video support and it works with <iframe>
  - https://ui.nuxt.com/docs/typography/images-and-embeds#iframes & https://github.com/nuxt-content/nuxt-studio/releases/tag/v1.2.0 & https://docus.dev/en/essentials/images-embeds#videos
  - it is possible we could keep it and overrite the `<video>` tag with our own custom prose component

