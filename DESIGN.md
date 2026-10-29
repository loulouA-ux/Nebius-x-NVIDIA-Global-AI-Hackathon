---
name: ShipTested UI v2
description: Evidence-led release checks expressed as a sailing journey.
colors:
  dark-bg: "#0B0E13"
  dark-surface: "#11151B"
  dark-raised: "#171C24"
  dark-line: "rgb(255 255 255 / .08)"
  dark-card: "rgb(255 255 255 / .16)"
  dark-text: "#EDF0F5"
  dark-body2: "#B4BCC8"
  dark-muted: "#8E98A6"
  dark-accent: "#34D3B4"
  dark-accent-soft: "rgb(52 211 180 / .08)"
  dark-accent-line: "rgb(52 211 180 / .3)"
  dark-p-bg: "#EDF0F5"
  dark-p-fg: "#0B0E13"
  dark-hi-fg: "#FF7B7B"
  dark-md-fg: "#F6B94A"
  dark-low: "#8FB4FF"
  dark-water: "#9AA3B0"
  dark-primary-hover: "#FFFFFF"
  dark-backdrop: "rgb(0 0 0 / .55)"
  dark-shadow-soft: "rgb(0 0 0 / .16)"
  light-bg: "#FAFAF8"
  light-surface: "#FFFFFF"
  light-raised: "#F4F5F2"
  light-line: "rgb(10 14 19 / .08)"
  light-card: "rgb(10 14 19 / .16)"
  light-text: "#0B0E13"
  light-body2: "#3F4754"
  light-muted: "#5D6672"
  light-accent: "#0E7A6B"
  light-accent-soft: "rgb(14 122 107 / .06)"
  light-accent-line: "rgb(14 122 107 / .3)"
  light-p-bg: "#0B0E13"
  light-p-fg: "#FFFFFF"
  light-hi-fg: "#C42B2B"
  light-md-fg: "#9A5B00"
  light-low: "#2F5BC2"
  light-water: "#8A939F"
  light-primary-hover: "#202630"
  light-backdrop: "rgb(0 0 0 / .35)"
  light-shadow-soft: "rgb(0 0 0 / .1)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(44px,5.4vw,76px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
  annotation:
    fontFamily: "Caveat, cursive"
    fontSize: "26px"
    fontWeight: 700
rounded:
  chip: "5px"
  control: "8px"
  navigation: "9px"
  segmented: "10px"
  card: "12px"
  panel: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  control-gap: "12px"
  md: "16px"
  inset: "20px"
  lg: "24px"
  xl: "32px"
  section-gap: "40px"
  hero-gap: "48px"
  section: "64px"
components:
  button-primary-dark:
    backgroundColor: "{colors.dark-p-bg}"
    textColor: "{colors.dark-p-fg}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover-dark:
    backgroundColor: "{colors.dark-primary-hover}"
    textColor: "{colors.dark-p-fg}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-secondary-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  moment-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
    height: "32px"
  button-primary-light:
    backgroundColor: "{colors.light-p-bg}"
    textColor: "{colors.light-p-fg}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover-light:
    backgroundColor: "{colors.light-primary-hover}"
    textColor: "{colors.light-p-fg}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-secondary-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  moment-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
    height: "32px"
---

# Design System: ShipTested UI v2

## Overview

**Creative North Star: “The sailing journey.”** A release is a boat, checks are buoys, and the verdict waits at the lighthouse. The landing page gives that journey room to lead. Reports remain calm, specific and readable: evidence, severity, coverage and next actions take priority over illustration.

The approved direction is implemented with theme-aware inline SVG, precise typography and restrained surfaces. The clean mark supplies quiet empty and gated states; it is distinct from the sketched voyage. Sailing language belongs in drawings and moments, while actions use plain labels such as “Open the report.”

This is a source-derived snapshot dated 27 Oct 2026, not a claim of deployment or complete delivery of every reference-board behavior. Sources: `src/app/globals.css`, `layout.tsx`, `workspace-styles.module.css`, `brand-motion.css`, `views/landing.module.css`, and `components/voyage/`. The later UI v2 rules supersede earlier CSS declarations. Visual evidence is in `docs/design-handoff-review/ui-v2/after-*`; the light mobile landing and dark desktop report were inspected when writing this document. Existing contrast evidence is in that directory's `CONTRAST.md`.

**Key Characteristics:**
- A full-width sailing illustration with a factual, recorded outcome.
- Ink-and-paper controls, sea-green completion cues and explicit severity.
- Generous headings above compact, legible evidence rows.
- Static final frames that survive reduced motion and no JavaScript.

## Colors

The palette pairs midnight ink or warm paper with restrained sea-green accents. Frontmatter keys prefix the actual CSS token with its theme; `body2` is the secondary text tier, `line` the hairline, and `card` the stronger border. These are the normative current values, not renamed substitutes in the stylesheet.

### Primary

Sea-green `accent` identifies the tick, links, focus and completed checks. Accent-soft provides the landing scene's radial atmosphere; accent-line supplies a stronger outline. Primary buttons use the high-contrast `p-bg`/`p-fg` pair. Their current hover uses `primary-hover`, a neutral shade; the reference brief's accent hover is not implemented here.

### Secondary

Severity is semantic, not decorative: `hi-fg` is High/Blocked red, `md-fg` is Medium/review amber, and `low` is Low blue. Unrated and Incomplete remain neutral. High and Medium surfaces use `color-mix(in srgb,var(--hi-fg) 12%,var(--surface))` and its Medium equivalent; Low follows the same mix. Do not repurpose red to imply a failure absent from the data.

### Neutral

`bg`, `surface` and `raised` provide tonal separation; `text`, `body2` and `muted` provide reading hierarchy. Alpha-based hairlines adapt to both themes. Water uses its own quiet grey and is decorative, not a text color. Theme selection follows the saved preference or OS preference through `data-theme` on the root element.

**The Evidence Color Rule.** A verdict or severity color must reflect the recorded result. Color always accompanies a label, dot, icon or outline. The existing contrast table covers text tiers and severity tints in both themes; it excludes decorative water and hairlines and is not a blanket audit of every possible combination.

## Typography

Bricolage Grotesque (600) gives headings their rounded, purposeful character. Inter (400/500/600) handles UI and prose. JetBrains Mono (400/500) identifies packages, paths, IDs and commands. Caveat (700) is reserved for notes inside drawings. Fonts load through `next/font/google`, Latin subset, swap display; aliases are set on `body`.

### Hierarchy

- **Display:** landing headline, responsive clamp in frontmatter; mobile fixes it at 44px. Optical sizing is automatic.
- **Headline / title:** global h1 / h2 use the frontmatter sizes. Individual report modules may use their own tighter sizes; inspect their cascade before changing them.
- **Body:** 16px and 1.5 globally; finding titles use 15px / 500. Supporting rows and controls use 13–14px.
- **Label / mono:** metadata and measured values stay legible at 13px. Numeric UI uses `"cv11", "ss01", "tnum"` font features. Code uses the mono alias resolved on body; the manifest textarea still has an explicit system-mono stack in its module.
- **Annotation:** voyage notes use 26px; the quiet mark's note is 28px. Never use Caveat for data, controls or moment pills.

**The Reading First Rule.** One h1 per page; balanced headings and pretty paragraph wrapping. Avoid making secondary content both tiny and faint. Keep real version strings and IDs readable and allow long identifiers to wrap where needed.

## Layout

The landing shell is centered at a maximum 1200px. Its headline/copy row uses a 7:5 grid with a 48px gap; the voyage spans the width beneath it, then the official partner strip follows. Desktop horizontal gutters are 24px, reduced to 20px on narrow screens. Below 768px, the headline row becomes one column and the actions stack full width.

The desktop app has a 220px sidebar, sticky for the viewport height, with a continuous surface column beneath it. Main content uses 32px by 40px padding. Below 768px the app uses a four-column bottom tab bar, safe-area clearance, wrapped toolbars and a compact overflow menu. The report's mobile finding row gives the title its own line and severity, CVSS and fix a second line. Rows retain a minimum 60px target, often expanding with their content. Coverage segments are 8px high.

Below 480px, the voyage swaps its 1200×420 desktop geometry for a 600×300 scene. It does not merely scale the desktop image: stage labels become chips and moments use one slot below the drawing. Reserve each scene's aspect ratio to prevent layout shifts. Other observed module breakpoints are 600px, 900px and 1024px; they are local adaptations, not a replacement global grid.

## Elevation & Depth

Surfaces are mainly flat and separated by tone or alpha hairlines. The hero uses a restrained radial accent glow. Raised overlays and transient moments receive soft, functional shadows; cards do not need decorative depth. The selected filter has `0 2px 4px var(--shadow-soft)` and moments have `0 4px 16px var(--shadow-soft)`. Exact shadow and motion values live in the sidecar.

**The State Change Rule.** Motion explains a change. The header logo and initial report verdict, counts and coverage are static. Buttons press briefly; the finding drawer enters and exits; theme view transitions cross-fade. Reduced motion disables animations and transitions globally, including pseudo-elements. Current implementation is stricter than the reference's optional short fades.

## Shapes

Controls have gently curved 8px corners, navigation 9px, segmented groups 10px, standard containers 12px and larger panels 16px. Severity chips use compact 5px corners; replay and moment pills use fully rounded ends. Thin borders contain evidence without competing with it.

The voyage uses round SVG caps and joins, a 2.5px ink stroke and static turbulence/displacement. The optional discrete filter-seed boil is confined to the playing landing hero. The clean quiet-state mark has no wobble. Header marks remain fully visible with the tick dash offset at zero.

## Components

### Buttons

High-contrast and direct. Primary is ink-on-paper (inverted in dark theme); secondary is surface with a stronger border. Both use 10px by 15px padding, 14px / 500 UI type, 8px radius and a minimum 44px hit target. Disabled buttons reduce opacity and use the disabled cursor. Focus is a 2px accent outline with 2px offset. Pointer presses scale to 0.97; focus-visible presses avoid that transform. Current shared button hover is not universally gated by pointer media queries; report-row hover is gated.

### Inputs / Fields

Surface-backed, 8px rounded and bordered with the stronger neutral line. Scan fields use 10px by 12px padding, full width and labels above. Preserve visible focus and descriptive error/disabled explanations; color alone is insufficient. Disabled fields use the canvas background.

### Navigation

The sidebar exposes Reports, New scan, Repairs and Staging hosts. Active navigation receives accent emphasis and a raised surface; gated links explain sign-in requirements. Theme and account controls sit in its footer. Phone tabs preserve the same destinations. Theme changes use a short view transition where supported.

### Chips and findings

Severity combines a dot, text and a tint; Unrated uses a dashed outline. Filters are a segmented group with a surface-selected state and soft shadow. The current stylesheet changes selected styling; it does not implement a dedicated sliding-indicator element. Fix versions are rounded pills derived from evidence. Replay context stays distinct from live or saved state.

### Cards / Containers

Report verdict, counts, findings, coverage and research form separate reading surfaces. Verdict color is subordinate to its written reason. Preserve the source/coverage caveats. A “Blocked” verdict does not mean ShipTested technically prevents deployments. The report UI and accessible controls are authoritative; illustration never substitutes for evidence.

### Voyage and moments

The landing hero replays a recorded run once per session, with replay available. Its SSR resting state is the finished scene. Stage ticks, moments and lighthouse stamp use supplied events and the real verdict; derive candidate fix versions from the report. Hero labels explicitly say this is an illustration, not a live scan. The stamp is marketing-only.

The scan component advances only through consecutive completed events. Failed events produce Incomplete. Its polite live step log is the accessible source of truth; moments are hidden from assistive technology to avoid duplicate announcements. Keep at most two moment pills on desktop and only the most recent on phones. A missing detail must not invent a count. Offscreen/hidden-tab visibility pauses scene animation; reduced motion leaves the current factual frame and removes hero moments.

**Current integration limit:** the API does not stream stage events. `ScanProgress` supplies an empty event list and honestly leaves checks queued until the report arrives. Its elapsed timer measures waiting time, not completion. Cancel waiting stops the browser wait, not provider work. Do not document a live progressive scan or recorded per-stage durations as shipped merely because the component can accept events.

### Dry dock / repair sea trials

Baseline and patched command evidence controls the two result cards. The patch appears when the after-lockfile exists. The success flag requires both test-command exit codes to be zero, a passed run and complete cleanup. Evidence updates can animate the patch/flag; the component does not fabricate intermediate runner events.

**Current evidence limit:** the runner records command exit status, not individual test counts. Show “Test command passed · exit 0” or the actual failure, never a made-up “48 / 48.” Draft PR creation remains subject to complete verification and explicit approval; the illustration is not permission to publish or merge.

### Clean mark / quiet states

Use the clean water, hull, brackets and tick for 404, no reports, clear and gated pages. Each state includes concise explanatory text and a real next action. Empty and 404 use the muted tone; completion can use accent. The note currently fades into view; do not claim a left-to-right handwriting reveal. The final SVG frame exists before JavaScript; motion is optional.

No `public/motion/shiptested-voyage.riv` asset is present in this implementation. The current design uses SVG/CSS; optional Rive runtime, WASM, CSP changes and lazy loading are future work contingent on that supplied file.

## Do's and Don'ts

### Do:

- **Do** use the actual theme tokens and preserve both themes when extending a component.
- **Do** let the voyage lead the landing page and let evidence lead the app.
- **Do** derive numbers, versions, severity and completion from real report or runner data.
- **Do** preserve accessible logs, keyboard focus, mobile hit targets and static reduced-motion frames.
- **Do** retain official partner assets unmodified and distinguish planned integrations from available features.
- **Do** check current CSS and `ui-v2` captures together; older brand-kit values are not authority for this v2 snapshot.

### Don't:

- **Don't** invent progress, successful checks, test counts, scan durations or a clean verdict.
- **Don't** use the hero's decorative timing as live scan state.
- **Don't** use Caveat in controls, data or moment pills, or animate the header logo on load.
- **Don't** replace the quiet clean mark with the noisy sketch treatment.
- **Don't** add animation libraries, canvas or a Rive claim to the existing SVG implementation.
- **Don't** treat this documentation as evidence of deployment, production approval or completion of unimplemented reference behaviors.

## Public developer presentation — 28 October 2026

The landing and `/developers` surfaces now use an editorial developer-infrastructure direction requested by Peter: warm paper/ink themes, Bricolage headings, Inter body, mono only for code and evidence, generous whitespace and compact hairline-separated rows. This supersedes the sailing scene **on the landing page only**. Report/operational views retain their existing evidence-first layout and semantic colors. The boat mark remains the product identity; no third-party brand identity is copied.

Landing mode: Persuade. Developer guide mode: Read. The hero's leading artifact is a real public demo report summary, explicitly labelled synthetic/recorded, followed by a three-stage workflow and executable library example. No live customer data or invented metrics belong in public screenshots. At 390px the header wraps navigation, content becomes one column, and code scrolls within its own surface.
