# Embedding the handpan widget — hand-off

Status of the embed work, the contract that exists today, and what the next
change has to build. Written for whoever picks this up.

## Where this actually stands

**Shipped** (PR #54, merged to `dev` as `e611bbb`):

- One audio engine per widget. Two widgets on a page no longer share a synth, a
  tempo, or a stop.
- A validated props API on `HandpanWidget`.
- A public CSS custom-property surface, 49 `--shp-*` tokens.

**Not built yet** — do not promise these to anyone:

- No `<sg-handpan-widget>` custom element.
- No standalone bundle. The widget is only mountable from inside this repo.
- No demo page outside the site.

So today the widget is embeddable _within this codebase_, and the groundwork an
external embed needs is in place. Nothing more.

## Decisions already taken

These were settled before the groundwork landed; they are inputs, not open
questions.

| Decision  | Choice                                             |
| --------- | -------------------------------------------------- |
| Audience  | Third-party / public pages                         |
| Mechanism | Custom element, **light DOM** (no shadow root)     |
| API scope | Render + configure. No imperative playback control |

Light DOM plus hostile host CSS is a real tension, and it was accepted
deliberately: shadow DOM would have isolated styling but cut the widget off from
the host's own tokens, which is the thing that makes it look like it belongs.
The mitigation is a defensive scoped reset, which is part of the work below, not
something already done.

## The contract that exists today

### Props

`HandpanWidget` takes seven optional props. All are **initial** state, read once
at mount — a host that re-renders cannot drag a visitor back off their own
choice.

| Prop           | Accepts                                                   | Falls back to   |
| -------------- | --------------------------------------------------------- | --------------- |
| `familyId`     | a scale family id, e.g. `kurd`; merged-away ids work      | catalog default |
| `scaleKey`     | `D`, `f#`, `bb`, `E♭` — any casing or accidental spelling | family default  |
| `noteCount`    | number or numeric string                                  | family default  |
| `notation`     | `note` \| `number`                                        | `note`          |
| `view`         | `listen` \| `chords` \| `about`                           | `listen`        |
| `playbackMode` | `arpeggio` \| `simultaneous`                              | `arpeggio`      |
| `arpeggioBpm`  | 60–200, clamped                                           | 120             |

Guarantees the next layer can rely on, all covered by
`ui/widgetProps.test.ts`:

- Fields fall back **independently**. A good family with a nonsense key keeps
  the family.
- The whole selection is re-checked against the catalog; anything resolving to
  no instrument falls back wholesale. A bad prop set cannot render an empty
  widget.
- The returned pad count is the one the instrument **actually has**, which is
  not always what was asked for — a merged family may publish a shell its
  survivor does not.
- The returned family id is canonical, because the picker matches on exact id.
- Blank and absent mean the same thing. `Number(null)` is `0`, which would
  otherwise have clamped the tempo to its minimum.
- Inherited property names (`toString`, `constructor`, `__proto__`) are not
  catalog entries. The lookups are own-property checks; before that they threw.

Attribute strings map cleanly onto this — every prop already accepts a string.

### Styling

Two tiers, defined by `@mixin shp-tokens` in `styles/_widget-tokens.scss` and
applied on the widget root:

- `--shp-*` — the public surface. A host sets these.
- `--_shp-*` — what the stylesheets read, resolved from the public name, then
  the site token, then a literal.

The split is load-bearing. A single tier declaring `--shp-*` on the root would
beat the same property inherited from a host's wrapper, because a locally
declared custom property always wins over an inherited one — so an override
placed on an ancestor was silently ignored. **Set `--shp-*`, never `--_shp-*`.**

Every token ends in a literal, so the widget renders correctly on a page with no
design tokens of its own. Do not target the hashed CSS-module class names; they
are not a public surface.

### Audio

- Tone.js loads on the first user gesture, never with the page.
- One `AudioContext` per document, shared. Verified in a real browser with two
  widgets: one context between them.
- Everything else is per widget — synth, initialisation state, timeline.
- Every gesture gets its own initialisation attempt; nothing in-flight is
  memoised. A resume made without a live user activation can stay pending until
  it times out, and handing that stuck promise to the next gesture spends a good
  activation on a dead one.
- Exclusive playback (scale, chord) takes a generation ticket and checks it
  after every await. Single notes do not — tapping two pads should sound two
  notes.

Consequence for an embed: the host must not expect sound before a real gesture
inside the widget, and must not call playback programmatically. That is why the
API scope is render-and-configure.

## Mounting it today, inside this repo

```astro
---
import HandpanWidget from '../../widgets/academy-handpan/ui/HandpanWidget';
---

<HandpanWidget client:visible familyId="kurd" scaleKey="D" noteCount={9} />
```

`client:visible` is what the live page uses. `client:load` is fine for a demo
where the widget is above the fold.

## What the custom element has to do

1. **Define `<sg-handpan-widget>`**, mapping attributes to props. Attribute
   names should be kebab-case (`scale-key`, `note-count`, `arpeggio-bpm`);
   everything already accepts strings, so mapping is mechanical. Mount React
   into the element's light DOM.
2. **Vite library build** producing a standalone JS bundle plus a CSS file.
   React must be bundled, not externalised — a host page cannot be assumed to
   have it.
3. **A defensive scoped reset** on the widget root, so hostile host CSS cannot
   break layout. Buttons are the sharp edge: a host's global `button { }` rules
   will otherwise reach every pad. Scope it to the widget root; do not leak
   rules onto the host.
4. **A plain-HTML demo page** — no Astro, no build step — that loads the bundle
   from a `<script>` tag. This is the only honest test that the bundle stands
   alone.
5. **Two instances on that page**, with different attributes, played
   simultaneously. This is the regression that PR #54 exists to make possible;
   verify it rather than assuming it.

## Open problems

**Fonts.** The font tokens name `Newsreader` and `IBM Plex Mono`, whose
`@font-face` rules live in the site's `src/styles/fonts.scss` with root-relative
`url('/fonts/...')` paths. Neither the rules nor those paths exist on a host
page. The tokens do carry real fallback stacks — `Georgia, 'Times New Roman',
serif` and `'SFMono-Regular', monospace` — so this is graceful degradation, not
breakage: the widget will look plainer than on the site. Decide deliberately
whether to ship the faces with the bundle, load them from a CDN, or accept the
fallback. Do not leave it to chance.

**CSP.** A host with a strict policy may block whatever the bundle does at
runtime. Worth establishing what the bundle actually needs before promising it
works anywhere.

**Bundle size.** The widget chunk was brought from 290,674 B raw to 54 KB by
loading Tone dynamically. A standalone build bundles React too — measure it, and
keep Tone on its dynamic import.

**Concurrent context resume is unverified against a real suspended context.**
The code assumes concurrent `resume()` calls are harmless, which the Web Audio
spec supports and the unit tests cover against a mock. Three attempts to observe
it in headless Chromium failed because Playwright hands out an already-running
context, with and without both autoplay flags. It needs a real browser with
autoplay actually enforced — a manual check.

**Pre-existing suite flake.** Widget tests that do not mock audio import real
Tone and run bounded start-up against real timers, so under load they exceed the
5s per-test timeout. Confirmed present on `dev` before this work, most often in
`ui/familySwitch.test.tsx`. Unrelated to the embed, but it makes every gate run
roughly a coin flip under load — worth fixing before relying on green runs.

## What good looks like

The existing gates, plus:

- Two instances on the plain-HTML demo, different attributes, both playing,
  stopping one leaving the other running.
- The demo page working from a `file://` URL or a bare static server, with no
  part of this repo's build in the path.
- The widget rendering sanely on a page with an aggressive global stylesheet.

See [handpan-widget.md](handpan-widget.md) for the widget's own internals.
