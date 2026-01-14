



8. adding cites using [](cite:cite-id) works, but is buggy when editing with nuxt-studio, it seems to delete them since there is nothing inside of [here](cite:cite-id), we need to brainstorm how we would handle this, maybe we could add everything that is related to the cite inside of [here](cite:cite-id), then we could easily compile fact checkable statements and claims
9. when copying the markdown page the <bibliography> tag contains none of the actual references, we need to think how we can resolve this; it would probably need to be done inside of the beforeParse hook



5. Cross referencing of content might be needed for 'team', as this would be wanted for the 'website' and also for the 'docs' for blog authors etc
3. Internal linkage should have the same hover information, maybe this would come from the title and description of a page
4. Docus needs access to shared layer for RSS related, or does it... if we only have rss on the docus side now




