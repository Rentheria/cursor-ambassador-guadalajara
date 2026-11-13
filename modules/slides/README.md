# Slides Engine (Optional)

Reusable workshop slide chrome. **No community-specific workshop content** — only a skeleton deck you replace.

## Routes

| URL                       | Behavior                            |
| ------------------------- | ----------------------------------- |
| `/slides`                 | Canonical shareable entry (slide 1) |
| `/slides/2` … `/slides/N` | Numbered slides                     |
| `/slides/1`               | Redirects → `/slides`               |
| `/slides/XX` (invalid)    | Redirects → `/slides`               |

Set `content/featured.ts` `href` to `/slides` (not `/slides/1`).

## How to build your deck

1. Edit `modules/slides/content/example-deck.tsx` (or add `your-deck.tsx`).
2. Register in `modules/slides/content/index.ts` and set `defaultSlideDeck`.
3. Keep **first and last** slides as `type: 'title'` and wrap content in `<TitleCard />` for full-viewport layout.
4. Use primitives for everything else — don’t invent one-off card styles.

## Components

| File               | Role                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `SlideLayout.tsx`  | Keyboard + prev/next; title-slide chrome; `entryPath` / `slidePath`                                   |
| `SlideContent.tsx` | Renders React or sanitized HTML                                                                       |
| `primitives.tsx`   | `SlideTitle`, `SlideBody`, `SlideGrid`, `SlideCallout`, `SlideListItem`, `SlideFootnote`, `TitleCard` |
| `CodeBlock.tsx`    | Copyable code (CursorGothic)                                                                          |
| `PromptBlock.tsx`  | Copyable prompt                                                                                       |
| `DiagramSlide.tsx` | Inline SVG + injects CursorGothic `@font-face`                                                        |

## Diagrams

Put SVGs in `public/slides/diagrams/`. Prefer `font-family="CursorGothic, system-ui, sans-serif"` on `<text>` — `DiagramSlide` rewrites fonts at render time either way.

Starter: `public/slides/diagrams/example-flow.svg`.

## Custom entry path

If you want `/workshop` instead of `/slides`:

1. Move or duplicate `app/slides/` → `app/workshop/`.
2. Pass `entryPath="/workshop"` and `slidePath={(n) => `/workshop/${n}`}` to `SlideLayout`.
3. Redirect `/slides/1` (and invalid ids) to your entry in `next.config.js` / page `redirect()`.

## Skip slides entirely

Remove links to `/slides` from `content/featured.ts` and other content. You can delete `app/slides/` if unused.
