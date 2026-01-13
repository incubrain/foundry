
1. there is an issue with citations when navigating between pages, they are not being updated
2. the order of the bibliography references does not match the order of citations (numbering is not correct), and the anchors are not working, when we click on a cite link it should take us to the referenced bibliography link and highlight it
3. we need a better name for 'citations' (currently Any.vue) we cannot use 'cite' this appears to be a reserved keyword, same with 'ref', think about the DX/UX it should be short and obvious (/Users/mac/Development/incubrain/product-validator/docs/app/components/content/Any.vue), it may be a good idea to consider editing the ProseLink component to handle this... It should also accept multiple source 'ids' or just one
4. The bibliography should be added automatically to the bottom of the 'docs' pages, I don't want to have to add this every time; and the 'References' heading should show in the ToC, it also needs to be two columns instead of 1 on larger screens
5. We need to remove the 'Github' social icon from the header and the footer
6. our current approach to citations means we have to add a space before which is not optimal, eg. "Research demonstrates health consequences :any{id="pmc-health-impacts"}" I am toying with the idea of having the ability to add cites to the ProseP component, that way there shouldn't be a gap (https://github.com/nuxt-content/mdc/blob/main/src/runtime/components/prose/ProseP.vue)
7. our references collection should be one file per category, containing an array of different references, they also need to be linkable to PDFs within our 'public' dir


