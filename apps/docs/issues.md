2. cross linking popover is not displaying correct data (ProseA), should fetch this from the pages, maybe a centralised composable to store all titles and descriptions for pages
5. The 'For Energy & Environment Departments' etc sections should not be included like this, we need a way to search by department keyword, maybe this could be included in frontmatter or even better per subheading, maybe 'badges' could be used
6. frontmatter should have 'label' and 'title', use the 'label' for the nav menue and 'title' for better SEO and displaying on the page, the full title should be used for the internal linking in the ProseA component

4. References is not included in ToC
1. Term anchors not working as expected, nor is highlighting
3. We need to create a 'preface' of sorts to define light pollution clearly and establish the problem up front, this should include 'Blue Light Hazard' as we will need to compare white/blue LEDs agains warm LEDs, maybe we need a detailed section on 'lights' to explain the different types of LEDs and their properties
8. adding cites using [](cite:cite-id) works, but is buggy when editing with nuxt-studio, it seems to delete them since there is nothing inside of [here](cite:cite-id), we need to brainstorm how we would handle this, maybe we could add everything that is related to the cite inside of [here](cite:cite-id), then we could easily compile fact checkable statements and claims
9. when copying the markdown page the <bibliography> tag contains none of the actual references, we need to think how we can resolve this; it would probably need to be done inside of the beforeParse hook
5. Cross referencing of content might be needed for 'team', as this would be wanted for the 'website' and also for the 'docs' for blog authors etc
3. Internal linkage should have the same hover information, maybe this would come from the title and description of a page
4. Docus needs access to shared layer for RSS related, or does it... if we only have rss on the docus side now




