---
title: Why Foundry posts go live on their own
description: A committed post with a future publishAt stays unlisted and 404 until that moment, with no rebuild or cron.
publishAt: "2026-10-01T09:00:00.000Z"
draft: false
author: Foundry
tags:
  - blog
  - scheduling
source: example:article/live-sample
---

Foundry decides whether a post is live **per request**, not at build time.

A post is live when `draft` is false and `publishAt` is in the past. Anything else is a plain 404 and never appears in the blog list, the sitemap, `llms.txt` or the RSS feed.

## Writing one

The `foundry-blog` CLI (or its MCP server) writes the markdown file and commits it, so publishing is a `git push` away.
