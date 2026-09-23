# Reporverse

Build a polished experimental 3D web experience called **Repoverse**.

Core idea:

> Enter any GitHub username and transform their public GitHub profile into an explorable 3D universe.

Repositories become planets.

The user becomes the center of the universe.

Stars, forks, languages, repository size, contributors, and activity should influence the appearance and behavior of each planet.

The result should feel like:

**GitHub × space exploration × data visualization × cinematic portfolio**

This is NOT a dashboard.

This is NOT a conventional GitHub analytics site.

This should feel like discovering someone's code as a solar system.

---

# Primary goal

The first version must create a strong enough visual moment for a 15–30 second Twitter/X recording.

The ideal demo:

```text
Enter:

torvalds

↓

camera launches into space

↓

a huge solar system materializes

↓

Linux appears as the dominant planet

↓

smaller repositories orbit around it

↓

hover reveals repo information

↓

click Linux

↓

camera flies directly toward it

↓

planet detail experience opens
```

The viewer should understand the concept within approximately 5 seconds.

---

# Tech stack

Use:

* latest stable Next.js
* TypeScript
* App Router
* React Three Fiber
* Three.js
* `@react-three/drei`
* `@react-three/postprocessing`
* GSAP
* Zustand
* Tailwind CSS

Optional:

* custom GLSL shaders
* simplex noise
* Rapier only if actual physics becomes useful

Avoid unnecessary libraries.

Use npm unless the repository already uses another package manager.

---

# GitHub API

Use GitHub's REST API.

Initial version should work with **public GitHub profiles without requiring login**.

Relevant data includes:

User:

```text
GET /users/{username}
```

Repositories:

```text
GET /users/{username}/repos
```

Repository language information can later use:

```text
GET /repos/{owner}/{repo}/languages
```

Contributor details can later use:

```text
GET /repos/{owner}/{repo}/contributors
```

Do NOT make one request per repository during the initial page load unless necessary.

The repository listing already provides useful values such as:

* name
* description
* language
* stars
* forks
* size
* pushed_at
* created_at
* updated_at
* topics
* archived status

GitHub's REST API is versioned; use the currently supported API version header and centralize all API communication behind our own GitHub client abstraction.

Do not hardcode GitHub API access throughout UI components.

Create something similar to:

```text
/lib/github/
    client.ts
    types.ts
    normalize.ts
```

---

# API architecture

Use a Next.js server route rather than calling GitHub directly from every client component.

For example:

```text
/api/github/user/[username]
```

The server route should:

1. fetch the GitHub profile
2. fetch public repositories
3. normalize the results
4. calculate visualization metadata
5. return a clean universe payload

Example internal response:

```ts
type GithubUniverse = {
  user: {
    login: string
    name?: string
    avatarUrl: string
    bio?: string
    followers: number
    following: number
    publicRepos: number
  }

  repositories: UniverseRepository[]
}
```

Use caching appropriately.

Handle:

* invalid usernames
* GitHub API errors
* empty accounts
* rate limiting
* deleted/disabled profiles

The UI should never crash because GitHub responds unexpectedly.

---

# Universe data model

Create a normalized visualization model.

Example:

```ts
type UniverseRepository = {
  id: number

  name: string
  description?: string

  language?: string

  stars: number
  forks: number
  size: number

  createdAt: string
  updatedAt: string
  pushedAt?: string

  archived: boolean

  visualization: {
    radius: number
    orbitRadius: number
    orbitSpeed: number
    rotationSpeed: number

    planetType: PlanetType

    atmosphereIntensity: number
    activityIntensity: number

    moonCount: number

    seed: number
  }
}
```

The rendering layer should depend on this normalized object rather than raw GitHub responses.

---

# Mapping GitHub → universe

The mapping must be intuitive enough that users understand why their universe looks different.

## Repository = planet

Every repository becomes one planet.

---

# Planet size

Planet size should primarily represent repository importance.

Do NOT map raw repository size linearly because one huge repo could overwhelm everything.

Use a logarithmic or normalized scale.

Suggested inputs:

```text
repository size
+
stars
```

Example conceptual formula:

```ts
importance =
  log(size + 1) * sizeWeight +
  log(stars + 1) * starWeight
```

Then normalize it into:

```text
planet radius:
0.7 → 4.5
```

The biggest repository should look dramatically larger without becoming absurd.

---

# Stars = luminous satellites

GitHub stars should have a strong visual meaning.

For the MVP:

Do NOT literally create one object for every star.

Instead map stars to:

* luminosity
* particle halo
* number of small orbital lights
* surface glow

High-star repository:

```text
strong glow
dense orbital particles
brighter atmosphere
```

Low-star repository:

```text
subtle glow
few particles
```

Optionally display a few representative star objects around the planet.

---

# Forks = moons

Fork count should map to moons.

Again, never create thousands of moons.

Use logarithmic scaling.

Example:

```text
0 forks
→ 0 moons

1–5
→ 1 moon

6–25
→ 2 moons

26–100
→ 3 moons

100+
→ 4–6 moons
```

Each moon should:

* orbit the repository planet
* vary slightly in size
* use deterministic seeded placement

---

# Language = planet identity

Programming language should strongly influence the planet appearance.

Create a visual language system.

Examples:

## JavaScript

Appearance:

* warm energetic surface
* glowing city-like lines
* active particle movement

## TypeScript

Appearance:

* cool crystalline / technological
* geometric patterns
* cleaner atmosphere

## Python

Appearance:

* lush / organic
* flowing terrain
* calm atmospheric effect

## Rust

Appearance:

* volcanic
* dark metallic rock
* orange lava cracks

## Go

Appearance:

* oceanic
* blue atmosphere
* smooth surface

## Java

Appearance:

* molten / industrial
* dramatic heat bands

## C

Appearance:

* rocky
* ancient
* raw

## C++

Appearance:

* metallic
* industrial
* complex surface structures

## Swift

Appearance:

* smooth red/orange planet
* premium metallic feeling

## Kotlin

Appearance:

* purple crystalline surface

## HTML

Appearance:

* bright artificial world
* structural/grid patterns

## CSS

Appearance:

* surreal colorful atmosphere

Unknown languages:

Generate a deterministic style from a generic procedural planet system.

Do not make the entire planet a flat GitHub-language color.

Use language as **art direction**, not simple coloring.

---

# Recent activity = energy

Repository activity should visibly affect the planet.

Calculate age from:

```text
pushed_at
```

Example:

```text
pushed within 7 days
→ extremely active

within 30 days
→ active

within 6 months
→ moderate

older
→ dormant
```

Active repositories can have:

* stronger atmosphere
* surface pulses
* city lights
* moving particles
* faster orbital energy

Dormant repositories:

* darker atmosphere
* slower rotation
* fewer effects

Archived repositories:

* frozen / dead planet
* desaturated
* cracked appearance
* almost no atmosphere

This should be visually obvious.

---

# User = star

The GitHub profile becomes the center of the system.

Render a glowing central star.

The star should display the user's avatar subtly.

Do NOT simply put a circular profile photo floating in space.

Instead create something like:

```text
bright central sphere
+
subtle avatar hologram / texture
+
corona effect
```

Orbiting repositories surround this central star.

Near it display:

```text
Shivam1303

42 repositories
1,240 followers
```

Keep this typography elegant and minimal.

---

# Orbit system

Repositories orbit the central user star.

Do not create perfectly flat circles.

Use slightly different:

* inclination
* eccentricity
* height
* orbit speed

But preserve visual readability.

Important repositories should generally be closer to the camera path and easier to discover.

Avoid planets intersecting each other.

Use deterministic seeded positioning.

---

# Deterministic universe

The same GitHub account should produce approximately the same universe each visit.

Create stable seeds using:

```text
username
repo id
repo name
```

Do not use uncontrolled `Math.random()` for permanent characteristics.

Seed things like:

* terrain noise
* moon position
* ring orientation
* orbit inclination
* surface features

---

# Landing experience

The initial screen should already feel cinematic.

Layout concept:

```text


                      REPOVERSE


             Explore code as a universe.


             [ github username       ]

                   ENTER UNIVERSE


            Try: torvalds · vercel · facebook


```

Dark background.

Very subtle distant galaxy.

One small rotating planet or star in the background.

Minimal UI.

No navigation bar.

No SaaS cards.

No pricing.

No excessive explanatory text.

---

# Landing interaction

User can type:

```text
torvalds
```

OR:

```text
github.com/torvalds
```

OR:

```text
https://github.com/torvalds
```

Normalize all forms into:

```text
torvalds
```

Also support repo URLs later, but profile usernames are MVP priority.

---

# Universe generation transition

This transition is extremely important.

Do not immediately render planets.

Example sequence:

```text
0.0s
input disappears

0.3s
camera pushes into darkness

0.7s
stars streak past camera

1.1s
central star ignites

1.5s
first large repository planet appears

1.8s
additional planets materialize

2.2s
orbits draw themselves

2.5s
moons appear

2.8s
camera rotates around system

3.2s
UI fades in
```

Make it feel like the user's code history is being transformed into a universe.

---

# Planet materialization

Planets should not simply `display: block`.

Experiment with:

* point cloud → solid planet
* scale from zero
* wireframe → material
* particles assembling
* shader dissolve
* energy ring collapse

Use one polished transition consistently.

---

# Main universe interface

Once inside:

Top left:

```text
REPOVERSE
@username
```

Top right:

```text
Search another profile
```

Bottom:

```text
drag to orbit
scroll to zoom
click a planet to explore
```

Optional:

```text
Reset View
Share
```

Keep UI extremely minimal.

---

# Planet hover interaction

Hovering a planet should:

1. slow that planet slightly
2. highlight atmosphere
3. display repository name
4. show small metadata

Example:

```text
GLANCE UNLOCK

Swift
★ 245
⑂ 18

Updated 2 days ago
```

The tooltip should feel spatial and futuristic.

Do not use a giant normal HTML card.

Use minimal floating UI.

---

# Clicking a planet

When a planet is clicked:

disable general orbit controls temporarily.

Camera should smoothly fly toward the selected planet.

Sequence:

```text
planet selected

↓

other planets darken

↓

camera rotates to target

↓

camera accelerates toward planet

↓

planet fills viewport

↓

repo detail mode appears
```

This transition is one of the key demo moments.

---

# Planet detail MVP

Do NOT build file/folder cities yet.

The first detail experience should simply showcase the repository beautifully.

Display:

```text
REPOSITORY NAME

description

language
stars
forks
size

created
last activity

[ Open on GitHub ]
```

The planet remains rotating behind the information.

Show its moons and effects.

Provide:

```text
← Back to Universe
```

Return transition should fly back into the solar system.

---

# Future phase: repo city

Architect the project so we can later add:

```text
Enter Repository
```

Then:

```text
folders → districts
files → buildings
file size → building height
commits → city activity
contributors → moving satellites / ships
```

But DO NOT implement this in MVP.

Leave clean architecture so it can be added later.

---

# Camera system

Create a dedicated camera controller.

Suggested modes:

```ts
type CameraMode =
  | "landing"
  | "entering"
  | "universe"
  | "planet-focus"
  | "returning"
```

The camera controller should know which mode is active.

Do not spread camera animation logic throughout unrelated components.

Use GSAP or properly controlled R3F animation.

---

# Controls

Universe mode:

```text
drag → orbit
wheel → zoom
click planet → inspect
```

Set sensible boundaries.

Prevent:

* flying inside the sun
* zooming infinitely away
* getting lost
* flipping camera into unusable angles

Idle camera:

If user does nothing for several seconds, slowly rotate around the universe.

Stop idle movement immediately when interaction resumes.

---

# Planet rendering architecture

Suggested:

```text
/components/reporverse/

    UniverseCanvas.tsx
    UniverseScene.tsx

    camera/
        UniverseCamera.tsx
        CameraController.tsx

    celestial/
        UserStar.tsx
        RepositoryPlanet.tsx
        Moon.tsx
        Orbit.tsx

    planets/
        JavascriptPlanet.tsx
        TypescriptPlanet.tsx
        PythonPlanet.tsx
        RustPlanet.tsx
        GoPlanet.tsx
        GenericPlanet.tsx

    effects/
        Starfield.tsx
        Atmosphere.tsx
        PlanetParticles.tsx
        Bloom.tsx
        SpaceDust.tsx

    ui/
        UniverseHUD.tsx
        PlanetTooltip.tsx
        RepoDetails.tsx
```

This exact structure can change where better architecture exists.

Avoid:

```text
Universe.tsx
```

containing 2,000 lines of logic.

---

# Procedural planets

Do NOT download planet models.

Generate them procedurally.

Base:

```text
IcosahedronGeometry
```

or:

```text
SphereGeometry
```

Then introduce procedural deformation.

Potential techniques:

* simplex noise
* vertex displacement
* shader-based terrain
* layered materials
* atmosphere shell
* normal modulation

Each repository should feel unique.

Avoid perfect smooth spheres everywhere.

---

# Surface detail

Use several procedural planet families.

Examples:

```text
rocky
oceanic
volcanic
crystalline
technological
desert
ice
gas
organic
```

Language chooses the dominant family.

Repo seed modifies:

* noise scale
* noise strength
* roughness
* atmosphere
* feature density

---

# Atmosphere shader

Build a reusable atmosphere component.

It should support:

```ts
<Atmosphere
  intensity={}
  fresnelPower={}
  activity={}
  opacity={}
/>
```

Use Fresnel-style edge glow.

High activity increases subtle pulsing.

Avoid oversized neon halos.

---

# Planet rings

Some repositories can have rings.

Ring probability can depend on:

* high star count
* repository importance
* random seeded variation

Do not give every planet rings.

Rare features make the universe more interesting.

---

# Special planets

Allow very important repositories to receive rare visual traits.

For example:

```text
top repository
→ massive rings

very high stars
→ glowing orbital debris

old repository
→ cratered world

very active repo
→ lightning / energy

archived repo
→ frozen/dead

huge project
→ gas giant
```

This makes exploring large profiles interesting.

---

# Starfield

The background needs depth.

Use multiple layers:

1. distant stars
2. slightly larger stars
3. subtle dust
4. occasional nebula-like gradients

Do not create an overwhelming colorful galaxy.

Keep the universe dark so repositories remain the focus.

---

# Postprocessing

Use carefully:

* Bloom
* Vignette
* optional subtle noise
* optional depth effects

Do not make the scene blurry.

Bloom should mostly affect:

* user star
* atmosphere
* active repository lights

---

# Profile size handling

Profiles may have:

```text
1 repo
10 repos
100 repos
500 repos
```

The universe must remain usable.

MVP rule:

Show at most approximately:

```text
40–60 most relevant repositories
```

Rank repositories using something similar to:

```text
stars
+
recent activity
+
size
```

Allow the ranking formula to be configured.

If there are more repositories, show:

```text
Showing 50 of 183 repositories
```

Later we can add additional galaxies.

Do not render hundreds of complex planets simultaneously.

---

# Fork repositories

Forked repositories can optionally be excluded by default.

For MVP:

Prefer original repositories.

If the profile has very few original repos, include forks.

Future setting:

```text
Include forks
```

Not necessary for initial experience.

---

# Empty profiles

If a user has zero public repositories:

still create:

```text
central star
```

Then display:

```text
This universe hasn't formed any planets yet.
```

Provide search again.

Make it visually intentional rather than an error screen.

---

# GitHub API rate limits

The site should gracefully handle rate limits.

Use server-side caching.

Avoid fetching language/contributor endpoints for every repository during MVP.

Authentication can be added later for higher limits and private repository support; GitHub's documentation notes that authenticated requests can access additional functionality and higher API limits.

The MVP must NOT require users to authenticate.

---

# Cache strategy

Use sensible server-side caching.

Profiles should not require fresh GitHub requests every reload.

Approximate strategy:

```text
profile/repositories cache
→ few minutes
```

Do not over-engineer infrastructure.

A simple Next.js caching strategy is enough initially.

---

# Loading state

Don't use:

```text
Loading...
```

Instead use something thematic:

```text
Locating @torvalds...

Mapping repositories...

Igniting stars...

Forming planets...
```

Keep it brief.

Loading text should accompany the cinematic transition.

---

# Error UX

For nonexistent user:

```text
Couldn't find this universe.
```

Then:

```text
Check the GitHub username and try again.
```

For GitHub failure:

```text
The universe is temporarily unreachable.
```

Do not expose raw API errors.

Log useful development information server-side.

---

# Random discovery

Add:

```text
Explore
```

with a small curated list of visually interesting GitHub accounts.

Possible examples:

```text
torvalds
vercel
facebook
microsoft
openai
sindresorhus
```

Do not automatically hammer GitHub APIs on landing.

Only fetch one when selected.

---

# Shareable URLs

Profiles should be directly linkable.

Example:

```text
/u/torvalds
```

Opening the URL should directly load the correct universe.

Repo focus could eventually support:

```text
/u/torvalds/linux
```

but MVP can focus on profile routes.

---

# Mobile

Desktop is priority.

Still make mobile functional.

On mobile:

* reduce planet subdivisions
* reduce star count
* lower DPR
* simplify atmosphere
* reduce particles
* touch orbit
* keep labels readable

Consider limiting displayed repositories further on lower-performance devices.

---

# Performance

Target:

```text
smooth 60 FPS
```

on modern laptops for typical profiles.

Important:

* reuse geometries
* reuse materials where possible
* avoid huge textures
* use instancing for moons / particles
* limit shadow usage
* cap DPR
* memoize expensive procedural calculations
* avoid React rerenders every frame

Planet animations should primarily run inside Three.js/R3F frame logic without causing global React state updates.

---

# Do not rely on textures initially

The visual style should mostly come from:

* shaders
* noise
* geometry
* lighting
* materials
* particles

Avoid downloading dozens of planet textures.

This keeps universes procedural and unique.

---

# Development debug mode

Add a development-only debug UI.

Use Leva if useful.

Controls could include:

```text
planet radius multiplier
orbit spacing
orbit speed
star intensity
atmosphere intensity
noise strength
bloom
particle count
camera distance
```

Also allow selecting test datasets.

Debug UI must not appear in production.

---

# Test fixtures

Do not rely exclusively on GitHub API calls while developing graphics.

Create local fixtures:

```text
/lib/fixtures/
```

Examples:

```text
small-profile.ts
medium-profile.ts
huge-profile.ts
```

This allows visual development without hitting GitHub repeatedly.

Provide a development mechanism to load fixtures.

---

# Important visual test fixture

Create one fake account containing:

```text
12 repos

1 huge TypeScript repo
1 popular Rust repo
1 active Python repo
1 archived Java repo
several tiny repos
different fork counts
different activity dates
```

Use this to verify visual variety.

---

# MVP DEVELOPMENT PLAN

## Phase 1 — foundation

Build:

* Next.js project
* landing page
* username parsing
* GitHub API server client
* normalized GitHub universe types
* route `/u/[username]`
* loading/error states
* test fixtures

No complex visuals yet.

---

# Phase 2 — core universe

Build:

* R3F canvas
* central user star
* repository planets
* procedural orbit layout
* starfield
* basic controls
* deterministic seeds

The universe must already feel good at this stage.

---

# Phase 3 — visual language system

Implement at minimum:

```text
TypeScript
JavaScript
Python
Rust
Go
Java
generic
```

Each needs a visibly different procedural planet identity.

Do not just change colors.

---

# Phase 4 — cinematic interaction

Build:

* universe materialization
* camera intro
* hover
* planet selection
* camera flight
* repository detail mode
* return flight

This phase is extremely important.

---

# Phase 5 — polish

Add:

* atmosphere shaders
* moons
* rings
* activity visualization
* archived planet styling
* responsive behavior
* share routes
* performance optimization
* subtle postprocessing

---

# Hero demo target

Before expanding features, polish this journey:

```text
Landing

↓

enter:
torvalds

↓

universe appears

↓

Linux is clearly dominant

↓

hover Linux

↓

click Linux

↓

camera flies to Linux

↓

repo detail shown

↓

return to universe
```

This flow must look exceptional.

---

# Second demo target

Test:

```text
vercel
```

The resulting universe should visually differ significantly because its repository distribution and languages differ.

---

# Visual quality benchmark

The final experience should NOT resemble:

```text
Three.js tutorial
```

or:

```text
developer portfolio with spheres
```

It should feel like a deliberately art-directed product.

Spend time on:

* lighting
* camera
* scale
* atmosphere
* motion
* typography
* transitions

A polished 12-planet universe is better than a mediocre 100-planet universe.

---

# Critical design rule

The visual metaphor must remain understandable.

Do not add visual effects merely because they're possible.

Someone exploring their profile should gradually realize:

```text
"Oh — that huge planet is my biggest project."

"Those moons are forks."

"This dead planet is my archived repo."

"That one is glowing because I worked on it yesterday."
```

That discovery is the product.

---

# Landing copy

Keep copy extremely restrained.

Preferred:

```text
REPOVERSE

Your code has a universe.

[ GitHub username ]

ENTER
```

Possible alternative:

```text
Turn any GitHub profile
into a universe.
```

Do not add marketing paragraphs.

---

# README

Create a polished README containing:

* project concept
* screenshot placeholder
* architecture
* GitHub → universe mapping
* stack
* setup
* environment configuration if needed
* API notes
* development fixtures
* future roadmap

Explain clearly that this visualization is artistic and not intended as a scientific representation of repository quality.

---

# Future roadmap

Do not implement these yet, but design architecture with them in mind.

## Repository city

Fly through a planet atmosphere.

Then repository transforms into a city.

Mappings:

```text
directories
→ districts

files
→ buildings

file size
→ building size

language
→ architecture

commits
→ lights

contributors
→ moving ships
```

---

## Commit time travel

A timeline slider:

```text
2019 ─────●──────── 2026
```

Moving through time changes the universe.

Repositories:

* appear
* grow
* become active
* become dormant

This could eventually visualize an entire developer career.

---

## Compare universes

Example:

```text
torvalds
VS
gaearon
```

Two galaxies side by side.

---

## Organization galaxies

Organization:

```text
github.com/vercel
```

could become a galaxy.

Developers become stars.

Repositories orbit teams.

Do not build this yet.

---

# Code quality

Requirements:

* strict TypeScript
* no `any`
* avoid giant components
* no duplicated GitHub parsing logic
* modular procedural generation
* centralized API types
* meaningful naming
* clean camera state handling
* sensible error boundaries
* no unused code
* no broken TODO-heavy implementation
* lint passes
* production build passes

---

# Acceptance criteria

The MVP is ready when:

1. I can enter a public GitHub username.
2. GitHub profile/repo data loads.
3. The universe materializes cinematically.
4. The profile is represented by a central star.
5. Each relevant repository becomes a planet.
6. Planet size varies meaningfully.
7. Languages create visibly different planet styles.
8. Forks generate moons.
9. Activity affects planet energy.
10. Archived repos look dormant.
11. I can orbit/zoom smoothly.
12. Hovering a planet shows repo information.
13. Clicking a planet triggers a cinematic camera flight.
14. A beautiful repository detail view appears.
15. I can return to the universe.
16. `/u/{username}` is shareable.
17. Invalid profiles fail gracefully.
18. Large profiles remain performant.
19. Mobile remains usable.
20. Production build and lint pass.

---

# Start implementation

Read this document completely before making changes.

If the repository is empty, initialize the project.

Start with:

```text
Phase 1
+
Phase 2
```

Then build enough of Phase 3 to make several repositories visibly distinct.

Do NOT implement:

* repository cities
* commit timelines
* account comparison
* organizations
* GitHub authentication
* private repositories

yet.

Before expanding scope, make this single experience look exceptional:

```text
enter username
→ universe materializes
→ inspect planets
→ click a planet
→ cinematic fly-in
```

Use the document as the source of truth.

After implementation:

* run the app
* test with local fixtures
* test with real GitHub users
* fix TypeScript issues
* fix lint errors
* fix production build errors
* check console for runtime warnings
* verify route sharing
* verify performance

Visual quality is more important than feature count.
