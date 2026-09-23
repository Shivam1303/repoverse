# Repoverse

**Your code has a universe.** Enter a public GitHub username and explore its repositories as a procedural solar system. The profile is the origin star; each repository is a world whose scale, motion, atmosphere, and surface come from GitHub data.

> Screenshot placeholder: capture `/u/torvalds` once the visual system is finalized.

Repoverse is an artistic visualization, not a scientific measure of repository quality or developer impact.

## Current scope

This implementation covers the foundation, the core universe, the initial visual language system, cinematic interactions, and the first Phase 5 effects. The landing accepts a username or a GitHub profile URL. `/u/{username}` is directly linkable. The universe opens with a camera arrival, a star ignition, staggered planet materialization, and orbit drawing. It supports drag orbit, cursor-centered wheel zoom, idle rotation, labels, and a lightweight hover readout. Clicking a planet flies the camera in, places the planet on the left, and opens its repository details on the right. Escape, the close button, or the backdrop returns to the saved universe view. On narrow screens the planet sits above a details sheet. TypeScript, JavaScript, Python, Rust, Go, Java, and other languages have distinct procedural surfaces; seeded palette and terrain variants distinguish repositories within one language. A small deterministic subset receives layered rings. Fork counts create at most six cratered, instanced moons per planet, with short orbit trails around the focused world. Recently active repositories show soft orbital lights and pulsing surface and atmosphere energy. The `torvalds` profile is the primary live test case.

Commit time travel, repository cities, account comparisons, organizations, and authentication are outside the current phase.

## Stack

Next.js 16 App Router, React, TypeScript, React Three Fiber, Three.js, Drei, postprocessing, Tailwind CSS, and GSAP. Zustand is installed but unused; no future features are implemented here.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. There are no required environment variables. Optionally copy `.env.example` to `.env.local` and set `GITHUB_TOKEN` to increase GitHub's server-side request allowance. Public profiles work without it.

```bash
npm run typecheck
npm run lint
npm run build
```

The npm scripts use Next's webpack mode because Turbopack's CSS worker cannot bind to a local port in some restricted development environments.

## Architecture

```text
src/app/
  page.tsx                         landing
  u/[username]/page.tsx            shareable universe route
  api/github/user/[username]/      public normalized JSON endpoint
src/lib/github/
  client.ts                        versioned GitHub requests and errors
  username.ts                      shared username and URL parser
  normalize.ts                     ranking, deterministic seeds, visual metadata
  types.ts                         API and scene contracts
src/lib/fixtures/profiles.ts       local visual datasets
src/components/reporverse/
  UniverseExperience.tsx           overlay, hover readout, and selection state
  camera/                          entrance, cursor zoom, and selection flights
  ui/                              focused repository details
  scene/                           canvas, star, and orbital systems
  visuals/                         seeded palettes and procedural shaders
```

The server gets the public profile and up to five pages of repository listings. It does not fetch languages or contributors per repository. GitHub requests use the REST API version `2026-03-10` header and a five-minute Next.js fetch cache. Errors are translated into safe UI states. The response model is independent of GitHub's raw shape, so future visual work stays in the scene layer.

## GitHub → universe

| GitHub signal | Current visual mapping |
| --- | --- |
| Profile | Origin star, name, and profile summary |
| Repository | One procedural planet on a deterministic orbit |
| Stars + repository size | Logarithmic importance and planet radius; stars also strengthen atmosphere |
| Language | One of seven shader surface families |
| Repository seed | Palette, terrain, and ring traits; a few worlds receive rings irrespective of rank |
| Recent `pushed_at` | Activity energy, rotation speed, atmosphere and surface pulses, and orbital motes |
| Archived status | Desaturated, dimmed surface |
| Fork count | Logarithmically mapped to zero to six orbiting moons per planet |

The same username and repository ID produce the same seed and approximate layout across visits. Up to 36 top-ranked repositories render. Original repositories take priority; forks are included when there are fewer than eight originals. Empty public profiles still show their origin star.

## Fixtures

In development only, add `?fixture=` to a universe URL:

- `/u/torvalds?fixture=torvalds` — offline shape of the primary demo profile; values are illustrative, not live.
- `/u/observatory?fixture=medium` — 12 worlds including a huge TypeScript project, Rust, active Python, archived Java, and small projects.
- `/u/small-signal?fixture=small` — two worlds.
- `/u/many-worlds?fixture=huge` — ranking and rendering limit with 180 repositories.
- `/u/empty-space?fixture=empty` — an origin star with no planets.

The same fixture option works on `/api/github/user/{username}` in development. Production ignores it.

## API notes

The app calls `GET /users/{username}` and `GET /users/{username}/repos` through its own server client. GitHub may rate limit unauthenticated requests; the app returns a clear retry state. Invalid names, deleted accounts, unsupported account types, empty accounts, and malformed responses are handled without exposing raw API errors. Public organization accounts such as `vercel` currently use the same one-star profile model; organization galaxies are a separate future concept.

## Later roadmap

Later Phase 5 work could refine sharing and performance. Repository cities, time travel, comparison, and organization galaxies remain future ideas.
# repoverse
