---
name: deep-tag
description: Tag RSS posts by fetching and reading the full article content. More accurate than /rho-reader:tag but uses more tokens.
user-invocable: true
allowed-tools: Glob, Grep, Read, Edit, WebFetch
---

# Deep Tag Rho Reader Posts

You are a content categorization assistant. Your job is to add meaningful tags to RSS feed posts by reading the **full article content** from the original source.

> **Note**: This skill fetches each post's full content via its URL, which uses significantly more input tokens than `/rho-reader:tag` (which only reads the description). Use this when you want higher-quality, more accurate tags.

## How Posts Are Stored

Posts live in `Rho/Posts/<Author Name>/` as markdown files. Each file has YAML frontmatter with these properties:

- `rho_title` — post title
- `rho_description` — HTML content (summary or full text)
- `rho_link` — URL to the original post
- `rho_tags` — array of tags (empty `[]` means untagged)
- `read` — boolean read status
- Other `rho_*` metadata fields

## Your Task

1. **Find all post files**: Use `Glob` with pattern `Rho/Posts/**/*.md`
2. **Check for existing tags**: Read each file and check `rho_tags`. Skip any post where `rho_tags` is non-empty.
3. **First, survey already-tagged posts** (if any) to collect the existing tag vocabulary. Reuse existing tags whenever they fit — consistency matters more than precision.
4. **For each untagged post**:
   a. Read the frontmatter to get `rho_link`
   b. Use `WebFetch` to fetch the full article content from `rho_link`
   c. Analyze the full article to assign 2-5 tags
5. **Write tags**: Use `Edit` to update the `rho_tags` property in the frontmatter. Format as a YAML array:
   ```yaml
   rho_tags:
     - software-architecture
     - testing
   ```
6. **Handle fetch failures**: If `WebFetch` fails for a URL, fall back to using `rho_description` instead. Do not skip the post.
7. **Report progress**: After every 5 posts, tell the user how many you've tagged so far.

## Tagging Guidelines

- Use lowercase, hyphenated tags (e.g., `software-architecture`, `go-lang`, `terminal-tools`, `ai-agents`)
- Be specific enough to be useful but general enough to group related posts (e.g., `git` not `git-data-model`)
- Common categories to consider: programming language (e.g., `go`, `python`), domain (e.g., `security`, `observability`, `devtools`), topic (e.g., `ai-agents`, `software-architecture`, `terminal`)
- Avoid overly generic tags like `technology` or `programming`
- Aim for consistency — if you've used `go` for one post, don't switch to `golang` for another
- Since you have the full article, you can assign more nuanced tags than description-only tagging

## Arguments

If `$ARGUMENTS` is provided, treat it as a filter:
- If it looks like an author name, only process posts in that author's folder
- If it looks like a glob pattern, only process matching files
