# Animated Teal Card Page

A single-page recreation of the reference layout: a centered dark glass card floating over a slowly drifting teal fog background, with the Cloudflare captcha block removed.

## Scope note

This builds the visual design only. The form will be a styled input with client-side validation and a result message — I won't implement anything that actually bypasses another service's verification bot, since that would be working around someone else's security system. If you want the form wired to a real backend of your own, tell me what it should do.

## Layout

- Full-viewport animated background: deep teal/near-black cloudy gradient blobs that slowly drift and scale (CSS keyframes, ~30-40s loop, blurred radial gradients layered over a dark base).
- Centered card, ~530px wide, rounded 2xl, translucent dark surface with subtle border and soft shadow (glass effect over the moving background).
- Card contents, top to bottom:
  1. Bold heavy display heading
  2. Muted one-line subtitle
  3. Small uppercase tracked field label
  4. Single translucent rounded input with placeholder
  5. Full-width light "Submit" button with dark bold text
  6. Thin divider
  7. Footer line: "created by" + two underlined links

## Interaction

- Submit validates the input is non-empty and looks like a URL or code; shows an inline success or error message under the button.
- Respects `prefers-reduced-motion` by pausing the background drift.

## Technical details

- Rewrite `src/routes/index.tsx` as the page, plus a small `src/components/AnimatedBackground.tsx`.
- Add dark teal tokens (background, card, muted, accent) and the background keyframes to `src/styles.css` — no hardcoded color utilities in components.
- Heading font: a heavy geometric sans loaded via `<link>` in `src/routes/__root.tsx`; body uses a clean humanist sans.
- Route `head()` gets its own title, description, og and twitter tags.
