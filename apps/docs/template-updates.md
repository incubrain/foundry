# Template Update System — Technical Reference

## Overview

Founder Funnel uses [`actions-template-sync`](https://github.com/AndreasAugustin/actions-template-sync) to automatically sync upstream changes to your repository.

## Architecture

### How It Works

```
Template Repo (incubrain/founder-funnel)
   ↓
   ↓ [GitHub Action runs monthly]
   ↓
Your Repo (your-username/your-project)
   ↓
   ↓ [Creates Pull Request]
   ↓
You review → Merge → Updated!
```

### Workflow File

Location: `.github/workflows/template-sync.yml`

The workflow:
1. Runs on 1st of every month at midnight UTC
2. Fetches latest changes from `incubrain/founder-funnel`
3. Compares with your repo
4. Creates PR if changes detected
5. Auto-closes old template-sync PRs

### Protected Files

Location: `.templatesyncignore`

Works like `.gitignore` but for template syncing:
- Glob patterns to exclude files
- Protects user content from being overwritten
- Can be customized per repository

## Configuration

### Changing Sync Frequency

Edit `.github/workflows/template-sync.yml`:

```yaml
schedule:
  - cron: "0 0 1 * *"  # Monthly (default)
  # - cron: "0 0 * * 0"  # Weekly (every Sunday)
  # - cron: "0 0 1 */3 *"  # Quarterly
```

**Cron syntax:** [crontab.guru](https://crontab.guru)

### Customizing PR Labels

```yaml
pr_labels: template-sync,automated,dependencies
```

### Adding PR Reviewers

Auto-assign reviewers to template PRs:

```yaml
pr_reviewers: your-username,teammate-username
```

### Signing Commits (GPG)

For security-conscious teams:

1. **Generate GPG key:**
```bash
gpg --full-generate-key
```

2. **Export private key:**
```bash
gpg --armor --export-secret-key your@email.com | pbcopy
```

3. **Add to GitHub Secrets:**
  - Repository Settings → Secrets → New secret
  - Name: `GPG_PRIVATE_KEY`
  - Value: Paste from clipboard

4. **Update workflow:**
```yaml
- name: Sync with template
  uses: AndreasAugustin/actions-template-sync@v2
  with:
    # ... existing config ...
    git_user_name: "Your Name"
    git_user_email: "your@email.com"
    gpg_private_key: ${{ secrets.GPG_PRIVATE_KEY }}
```

## Advanced Features

### Lifecycle Hooks

Run custom scripts during sync process:

```yaml
- name: Sync with template
  uses: AndreasAugustin/actions-template-sync@v2
  with:
    # ... existing config ...
    is_allow_hooks: true
    hooks: |
      prepull:
        commands:
          - echo "About to pull changes..."
          - pnpm lint  # Run linter first
      precommit:
        commands:
          - echo "About to commit..."
          - pnpm build  # Ensure it builds
```

Available hooks:
- `prepull` — Before fetching upstream
- `precommit` — Before committing changes
- `prepush` — Before pushing to branch
- `prepr` — Before creating PR

### Force File Deletion

If template deletes a file, force delete it locally:

```yaml
is_force_deletion: true
git_remote_pull_params: "--allow-unrelated-histories --strategy=recursive --no-edit"
```

⚠️ Use with caution — deletes files even if you modified them.

### Dry Run Mode

Test sync without creating PR:

```yaml
is_dry_run: true
```

Or via manual trigger → select "true" for dry_run input.

## Troubleshooting

### Workflow Not Running

**Check GitHub Actions is enabled:**
1. Settings → Actions → General
2. "Allow all actions and reusable workflows" should be selected
3. "Allow GitHub Actions to create and approve pull requests" should be checked

### Permission Errors

If you see: `refusing to allow a GitHub App to create or update workflow`

**Solution:** The workflow tries to update `.github/workflows/*` but lacks permission.

1. Create Personal Access Token (PAT):
  - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
  - Repository access → Only select repositories → Your repo
  - Permissions → Repository permissions → Contents: Read and write, Workflows: Read and write

2. Add token to repo secrets:
  - Repository → Settings → Secrets → Actions → New secret
  - Name: `WORKFLOW_TOKEN`
  - Value: Paste your PAT

3. Update workflow:
```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.WORKFLOW_TOKEN }}
    persist-credentials: false

- name: Sync with template
  uses: AndreasAugustin/actions-template-sync@v2
  with:
    source_gh_token: ${{ secrets.WORKFLOW_TOKEN }}
    # ... rest of config
```

### Merge Conflicts

If PR shows conflicts:

1. **Checkout PR branch:**
```bash
gh pr checkout <PR_NUMBER>
```

2. **View conflicts:**
```bash
git status  # Shows conflicted files
```

3. **Resolve manually:**
  - Open conflicted files
  - Edit to resolve `<<<<<<<`, `=======`, `>>>>>>>` markers
  - Keep your changes or upstream changes as appropriate

4. **Mark as resolved:**
```bash
git add .
git commit -m "resolve: merge conflicts from template sync"
git push
```

5. **Merge PR** once conflicts resolved

### PR Not Auto-Closing

Old template-sync PRs should auto-close, but if not:

**Enable PR cleanup:**
```yaml
is_pr_cleanup: true
```

Or manually close old PRs.

## Best Practices

### Review Process

1. **Always review PRs** — Don't blindly merge
2. **Check `package.json`** — Dependency updates may need testing
3. **Test locally** — Pull PR branch and run `pnpm dev`
4. **Check breaking changes** — Read PR description

### Customization Strategy

**If you customize core files:**
1. Document changes in code comments
2. Add file to `.templatesyncignore`
3. Manually check template updates for that file
4. Consider: Is this a core feature request? Open issue in template repo

**Avoid:**
- Editing core files unnecessarily
- Diverging too far from template
- Ignoring critical security updates

### Merge Strategy

**Recommended workflow:**
1. Monthly PR arrives
2. Review within 1 week
3. Test locally if significant changes
4. Merge if tests pass
5. Deploy as normal

**Don't:**
- Let PRs pile up (harder to merge later)
- Ignore dependency updates (security risk)
- Merge without reviewing

## Migration Path (For Existing Users)

If you cloned the template before this feature was added:

```bash
# Add workflow file
mkdir -p .github/workflows
curl -o .github/workflows/template-sync.yml \
  https://raw.githubusercontent.com/incubrain/founder-funnel/main/.github/workflows/template-sync.yml

# Add ignore file
curl -o .templatesyncignore \
  https://raw.githubusercontent.com/incubrain/founder-funnel/main/.templatesyncignore

# Commit
git add .github/workflows/template-sync.yml .templatesyncignore
git commit -m "feat: enable template sync"
git push
```

## FAQ

**Q: Can I customize the sync schedule?**
A: Yes, edit the `cron` in `.github/workflows/template-sync.yml`

**Q: What if I don't want a specific update?**
A: Close the PR. You can manually cherry-pick specific commits later if needed.

**Q: Can I sync from a different template?**
A: Yes, change `source_repo_path` in the workflow file.

**Q: Does this work with private templates?**
A: Yes, requires PAT token. See "Permission Errors" in Troubleshooting.

**Q: Can I test updates before they go live?**
A: Yes, PRs create a branch. Pull that branch locally and test.

**Q: What if template and my repo diverged significantly?**
A: The action handles unrelated histories. Expect more merge conflicts, resolve manually.

**Q: Can I disable sync temporarily?**
A: Yes, disable workflow in GitHub Actions UI. Re-enable anytime.

## Support

- **Template Issues:** [Founder Funnel Issues](https://github.com/incubrain/founder-funnel/issues)
- **Sync Action Issues:** [actions-template-sync Issues](https://github.com/AndreasAugustin/actions-template-sync/issues)
- **Community:** [GitHub Discussions](https://github.com/incubrain/founder-funnel/discussions)
