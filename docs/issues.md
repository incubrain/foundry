
1. We need to remove the 'Github' social icon from the header and the footer
2. When hovered on, the citation should have a tooltip with information about the citation
3. Internal linkage should have the same hover information, maybe this would come from the title and description of a page
4. Docus needs access to shared layer for RSS related, or does it... if we only have rss on the docus side now
5. Cross referencing of content might be needed for 'team', as this would be wanted for the 'website' and also for the 'docs' for blog authors etc
6. clicking on the reference and it taking you to the bottom of the page is actually a bad UX, users would lose there reading place, better to open the reference in a new tab, meaning we must have the URLs for the references loaded, just show the url as tooltip on hover
7. navigating between pages with bilbliography is adding the bibliography over and over again, we need to check if it exists first and then only add
8. adding cites using [](cite:cite-id) works, but is buggy when editing with nuxt-studio, it seems to delete them since there is nothing inside of [here](cite:cite-id), we need to brainstorm how we would handle this, maybe we could add everything that is related to the cite inside of [here](cite:cite-id), then we could easily compile fact checkable statements and claims
9. when copying the markdown page the <bibliography> tag contains none of the actual references, we need to think how we can resolve this; it would probably need to be done inside of the beforeParse hook
10. In regards to point 9, if there are no citations on the page, then we should NOT be adding the bibliography in the beforeParse hook
11. the sources page should be adding one table per source type (category), this is better for grouping and essential up front, as we will be adding ~50 sources very fast
12. 


