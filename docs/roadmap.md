# Blog roadmap

## Product direction

The first release is a personal, content-first blog built with Astro. Posts are authored as Markdown or MDX files in the repository and published through Git-based deployment. A browser-based admin CMS is not part of the initial release.

This keeps the public site fast and the writing workflow simple while the blog's needs are still small.

## Phase 1: Static personal blog

1. Store posts in Astro content collections as Markdown/MDX files.
2. Build public pages for the home feed, individual posts, tags/categories, and basic site information.
3. Add the usual post metadata: title, summary, publish date, tags, category, cover image, and draft state.
4. Generate the static site with Astro and publish it through the repository's deployment workflow.
5. Keep client-side JavaScript optional and limited to features that genuinely need interaction.

### Writing and publishing flow

```text
Write Markdown/MDX locally
        -> review locally with Astro
        -> commit and push to Git
        -> deploy the generated public blog
```

## Phase 2: Evaluate an admin CMS only when needed

Revisit the D1/Tiptap admin design when browser-based writing or one of these capabilities becomes a real need:

- image upload and media management
- draft autosave or revision history
- scheduled publishing
- private posts or richer access control
- a non-Git writing workflow

The existing database and API documents are retained as a future CMS design reference. They should be implemented only when Phase 2 is explicitly started; Phase 1 does not require an `/admin` app, D1 post storage, or the posts API.
