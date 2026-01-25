# Template Sync Testing Guide

**Purpose:** Comprehensive testing plan for the automated template synchronization system using `actions-template-sync`.

**Timeline:** Testing deferred until separate repository using the template is available (approximately 1 week from 2026-01-02).

---

## Prerequisites

  Before testing, ensure:

  - [ ] Template repository has `.github/workflows/template-sync.yml` merged to `main`
  - [ ] Template repository has `.templatesyncignore` merged to `main`
  - [ ] Separate test repository created from template (via "Use this template" button)
  - [ ] GitHub Actions enabled in test repository (Settings → Actions → General)
  - [ ] GitHub CLI installed locally (`brew install gh`) for PR testing

---

## Test Suite

### Test 1: Workflow Syntax Validation

**Objective:** Verify YAML syntax is correct

**Steps:**
```bash
cd /path/to/founder-funnel
pnpm dlx js-yaml .github/workflows/template-sync.yml
```

**Expected Result:**
- No syntax errors
- Valid YAML output displayed

**Pass Criteria:** ✅ Clean output, no errors

---

### Test 2: Dry Run Test

  **Objective:** Verify workflow can run without creating PR

  **Steps:**
  1. Navigate to test repository on GitHub
  2. Click **Actions** tab
  3. Select **Template Sync** workflow (left sidebar)
  4. Click **Run workflow** button
  5. Select branch: `main`
  6. Set **dry_run** to `true`
  7. Click **Run workflow**
  8. Wait for workflow to complete (~1-2 minutes)
  9. Click on the completed workflow run
  10. Review logs

  **Expected Result:**
  - Workflow completes successfully (green checkmark)
  - Logs show: "Running in dry run mode"
  - Logs show file comparison results
  - **No PR created** in test repository

  **Pass Criteria:**
  - ✅ Workflow succeeds
  - ✅ Logs show sync would work
  - ✅ Zero PRs created

  **Common Issues:**
  - Permission errors → Check "Workflow permissions" in Settings → Actions
  - Fetch errors → Verify template repo is public or PAT configured

---

### Test 3: Real PR Creation

**Objective:** Verify workflow creates proper PR with actual changes

**Setup:**
1. Make a small, safe change in template repository:
```bash
cd /path/to/founder-funnel
echo "# Template Update Test\nThis is a test update." >> TEST_SYNC.md
git add TEST_SYNC.md
git commit -m "test: add sync test file"
git push origin main
```

**Steps:**
1. Wait 2-3 minutes (give GitHub time to propagate)
2. In test repository, go to **Actions** tab
3. Click **Template Sync** workflow
4. Click **Run workflow**
5. Branch: `main`, dry_run: `false`
6. Click **Run workflow**
7. Wait for workflow to complete
8. Go to **Pull Requests** tab

**Expected Result:**
- ✅ New PR appears with title: `chore(template): sync upstream changes`
- ✅ PR has labels: `template-sync`, `automated`
- ✅ PR body contains:
  - 🔄 Template Sync header
  - Review checklist
  - Instructions
  - Link to template repo
- ✅ "Files changed" tab shows `TEST_SYNC.md` added
- ✅ PR branch name follows pattern: `template-sync/*`

**Pass Criteria:** All checkboxes above pass

**Verification Checklist:**
```bash
# Clone the PR locally
gh pr checkout <PR_NUMBER>

# Verify file exists
cat TEST_SYNC.md

# Check git history
git log --oneline -5

# Return to main
git checkout main
```

**Common Issues:**
- No PR created → Check workflow logs for errors
- Wrong files synced → Review `.templatesyncignore` patterns
- PR body missing → Check workflow YAML `pr_body` section

---

### Test 4: Protected Files (Content Protection)

  **Objective:** Verify user content is NOT overwritten during sync

  **Setup:**
  1. In test repository, create custom content:
```bash
cd /path/to/test-repo
mkdir -p templates/founder-funnel/content/pages
echo "# My Custom Content\nThis should NEVER sync." > templates/founder-funnel/content/pages/custom.md
git add templates/founder-funnel/content/pages/custom.md
git commit -m "feat: add custom user content"
git push
```

  2. In template repository, modify the same file:
```bash
cd /path/to/founder-funnel
mkdir -p templates/founder-funnel/content/pages
echo "# Template Content\nThis should be ignored." > templates/founder-funnel/content/pages/custom.md
git add templates/founder-funnel/content/pages/custom.md
git commit -m "test: add content to verify protection"
git push
```

  **Steps:**
  1. Trigger sync in test repository (Actions → Template Sync → Run workflow)
  2. Wait for PR to appear
  3. Check "Files changed" tab

  **Expected Result:**
  - ✅ PR does NOT include `templates/founder-funnel/content/pages/custom.md`
  - ✅ User's custom content remains unchanged
  - ✅ Only non-protected files appear in diff

  **Verification:**
```bash
# Checkout PR
gh pr checkout <PR_NUMBER>

# Verify user content unchanged
cat templates/founder-funnel/content/pages/custom.md
# Should show: "My Custom Content"
# Should NOT show: "Template Content"
```

  **Pass Criteria:** User content protected, not overwritten

  **Common Issues:**
  - Content synced → `.templatesyncignore` pattern incorrect
  - File missing → Path doesn't match protection pattern

---

### Test 5: Conflict Resolution

**Objective:** Verify workflow handles merge conflicts gracefully

**Setup:**
1. In test repository, edit a core file:
```bash
cd /path/to/test-repo
# Edit line 10 of shared/config/navigation.ts
# Change something specific (e.g., add a comment)
git add shared/config/navigation.ts
git commit -m "feat: customize navigation"
git push
```

2. In template repository, edit the SAME line differently:
```bash
cd /path/to/founder-funnel
# Edit line 10 of shared/config/navigation.ts differently
# Add a different comment or change same line
git add shared/config/navigation.ts
git commit -m "feat: update navigation"
git push
```

**Steps:**
1. Trigger sync in test repository
2. Wait for workflow to complete
3. Check PR status

**Expected Result:**
- ✅ PR is created (workflow doesn't fail)
- ✅ PR shows merge conflict indicator
- ✅ "Files changed" shows conflict markers if viewable
- ✅ PR description notes conflicts need resolution

**Conflict Resolution Test:**
```bash
# Checkout PR
gh pr checkout <PR_NUMBER>

# Verify conflict exists
git status
# Should show: "both modified: shared/config/navigation.ts"

# Check conflicted file
cat shared/config/navigation.ts
# Should contain:
# <<<<<<< HEAD
# (your changes)
# =======
# (template changes)
# >>>>>>> [commit hash]

# Resolve conflict (keep your changes for this test)
# Edit file, remove markers, keep desired code

git add shared/config/navigation.ts
git commit -m "resolve: merge conflict in navigation"
git push

# Verify PR updated
# Check GitHub PR page - conflict should be resolved
```

**Pass Criteria:**
- ✅ Workflow creates PR despite conflicts
- ✅ Conflicts are clearly marked
- ✅ Manual resolution process works
- ✅ PR merges after resolution

**Common Issues:**
- Workflow fails instead of creating PR → Check merge strategy config
- Conflict markers malformed → Review git configuration

---

### Test 6: PR Auto-Cleanup

  **Objective:** Verify old template-sync PRs are auto-closed when new PR created

  **Setup:**
  1. Create initial PR (via Test 3)
  2. **Do NOT merge it**
  3. Make another change to template

  **Steps:**
  1. Note the PR number of first template sync PR (e.g., #5)
  2. In template repo, make another small change:
```bash
cd /path/to/founder-funnel
echo "Second update" >> TEST_SYNC.md
git add TEST_SYNC.md
git commit -m "test: second sync update"
git push
```
  3. Trigger sync again in test repository
  4. Wait for new PR
  5. Check status of old PR (#5)

  **Expected Result:**
  - ✅ New PR created (e.g., #6)
  - ✅ Old PR (#5) is automatically closed
  - ✅ Old PR shows comment: "Closed by newer template sync"
  - ✅ Old branch deleted (if `is_keep_branch_on_pr_cleanup: false`)

  **Verification:**
```bash
# List all PRs
gh pr list --state all

# Check old PR status
gh pr view 5
# Should show: State: CLOSED
```

  **Pass Criteria:**
  - ✅ Only one open template-sync PR at a time
  - ✅ Old PRs closed automatically
  - ✅ No branch clutter

  **Common Issues:**
  - Multiple PRs remain open → Check `is_pr_cleanup: true` in workflow
  - Branches not deleted → Check `is_keep_branch_on_pr_cleanup` setting

---

### Test 7: Manual Trigger

**Objective:** Verify on-demand workflow execution works

**Steps:**
1. Navigate to test repository on GitHub
2. Click **Actions** tab
3. Click **Template Sync** workflow (left sidebar)
4. Verify "Run workflow" button is visible
5. Click **Run workflow**
6. Select branch: `main`
7. Set dry_run: `false`
8. Click **Run workflow**
9. Wait for workflow to complete

**Expected Result:**
- ✅ Workflow triggers immediately
- ✅ Workflow completes successfully
- ✅ PR created (if changes exist) OR no-op message (if no changes)

**Pass Criteria:**
- ✅ Manual trigger works on-demand
- ✅ No need to wait for cron schedule

---

### Test 8: Hybrid Files Warning

  **Objective:** Verify PR properly warns about files that may need manual review

  **Setup:**
  - Ensure template has updated `package.json` with new dependency

  **Steps:**
  1. Trigger sync
  2. Review PR body and "Files changed"

  **Expected Result:**
  - ✅ PR description highlights critical files like `package.json`
  - ✅ Review checklist includes dependency checks
  - ✅ Users are warned to test locally before merging

  **Pass Criteria:** Clear warnings for hybrid files

---

### Test 9: Multiple File Types

**Objective:** Verify workflow handles diverse file changes (add, modify, delete)

**Setup:**
1. In template repository:
```bash
# Add new file
echo "New feature" > NEW_FILE.md

# Modify existing file
echo "Update" >> README.md

# Delete a test file
rm TEST_SYNC.md

git add -A
git commit -m "test: add, modify, delete operations"
git push
```

**Steps:**
1. Trigger sync
2. Review PR "Files changed"

**Expected Result:**
- ✅ "Files changed" shows:
  - Green (added): `NEW_FILE.md`
  - Yellow (modified): `README.md`
  - Red (deleted): `TEST_SYNC.md`
- ✅ All changes applied correctly

**Pass Criteria:** All file operations work

---

### Test 10: Cron Schedule (Optional, Long-Running)

  **Objective:** Verify monthly cron trigger works

  **Note:** This test takes 1 month to complete naturally.

  **Shortcut Method:**
  1. Temporarily edit workflow in test repo to run every 5 minutes:
```yaml
schedule:
  - cron: "*/5 * * * *"  # Every 5 minutes (TESTING ONLY)
```
  2. Push change
  3. Wait 5 minutes
  4. Check if workflow runs automatically

  **Expected Result:**
  - ✅ Workflow triggers on schedule
  - ✅ PR created if changes exist

  **Cleanup:**
  - Revert cron to monthly after testing

  **Pass Criteria:** Scheduled trigger works

---

## Success Criteria Summary

All tests must pass:

- ✅ **Test 1:** Workflow YAML valid
- ✅ **Test 2:** Dry run works
- ✅ **Test 3:** PR creation succeeds
- ✅ **Test 4:** User content protected
- ✅ **Test 5:** Conflicts handled gracefully
- ✅ **Test 6:** Old PRs auto-close
- ✅ **Test 7:** Manual trigger works
- ✅ **Test 8:** Hybrid files warned
- ✅ **Test 9:** Multiple file operations work
- ✅ **Test 10:** (Optional) Cron schedule works

---

## Post-Testing Checklist

  After all tests pass:

  - [ ] Clean up test files from template repo:
```bash
cd /path/to/founder-funnel
git rm TEST_SYNC.md NEW_FILE.md
git commit -m "chore: remove sync test files"
git push
```

  - [ ] Document any edge cases found

  - [ ] Update `.templatesyncignore` if new patterns needed

  - [ ] Update `docs/template-updates.md` with any new troubleshooting

  - [ ] Create announcement for users about template sync feature

  - [ ] Add badge to README (optional):
```markdown
![Template Sync](https://img.shields.io/badge/template-auto--sync-blue)
```

---

## Rollback Plan

If critical issues found during testing:

**Immediate (Test Repository):**
```bash
# Disable workflow temporarily
gh api repos/:owner/:repo/actions/workflows/template-sync.yml/disable -X PUT
```

**Template Repository:**
```bash
# Revert commits that added sync system
git revert <commit-hash-of-sync-addition>
git push
```

**User Communication:**
- Post in GitHub Discussions
- Notify in README
- Provide manual workaround

---

## Testing Timeline

  **Day 1 (Setup):**
  - Create test repository from template
  - Verify prerequisites
  - Run Tests 1-2 (syntax, dry run)

  **Day 2 (Core Functionality):**
  - Run Tests 3-5 (PR creation, protection, conflicts)

  **Day 3 (Edge Cases):**
  - Run Tests 6-9 (cleanup, manual trigger, warnings, file operations)

  **Day 4 (Documentation):**
  - Document findings
  - Update documentation if needed
  - Create user announcement

  **Day 5+ (Optional):**
  - Run Test 10 (cron schedule) if desired

---

## Expected Issues & Solutions

### Issue: Permission Denied

**Symptom:** Workflow fails with "permission denied" error

**Solution:**
1. Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### Issue: No Changes Detected

**Symptom:** Workflow completes but no PR created

**Solution:**
- Verify changes exist in template repo
- Check `.templatesyncignore` isn't blocking everything
- Review workflow logs for skip messages

### Issue: Workflow Not Appearing

**Symptom:** "Template Sync" workflow doesn't show in Actions tab

**Solution:**
- Verify `.github/workflows/template-sync.yml` exists in `main` branch
- Check for YAML syntax errors
- Workflow must be pushed to default branch to appear

---

## Reporting Results

  After testing, create issue in template repository with:

  **Title:** "Template Sync Testing Results - [Date]"

  **Template:**
```markdown
# Template Sync Testing Results

**Test Date:** YYYY-MM-DD
**Test Repository:** [link]
**Tester:** @username

## Results Summary

- [ ] Test 1: Workflow Syntax - PASS/FAIL
- [ ] Test 2: Dry Run - PASS/FAIL
- [ ] Test 3: PR Creation - PASS/FAIL
- [ ] Test 4: Protected Files - PASS/FAIL
- [ ] Test 5: Conflict Resolution - PASS/FAIL
- [ ] Test 6: PR Auto-Cleanup - PASS/FAIL
- [ ] Test 7: Manual Trigger - PASS/FAIL
- [ ] Test 8: Hybrid Files Warning - PASS/FAIL
- [ ] Test 9: Multiple File Types - PASS/FAIL
- [ ] Test 10: Cron Schedule - PASS/FAIL/SKIPPED

## Issues Found

[Describe any issues, with screenshots/logs]

## Recommendations

[Any suggestions for improvements]

## Conclusion

- [ ] Ready for production
- [ ] Needs fixes (see issues above)
```

---

**Total Testing Time Estimate:** 4-6 hours (excluding cron test)

**Recommended:** Run tests in order, document each step with screenshots for future reference.
