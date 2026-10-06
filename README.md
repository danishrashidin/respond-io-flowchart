# Respond.io Flowchart App

This Vue 3 web app is a technical assessment project for Respond.io's Sr. Frontend Developer position.

## Technical Decisions

### Flow Chart

1. As per the instructions, nodes and flows are implemented with VueFlow library.

### Nodes & Edges

From the payload, each item of the array is a node. Each node has their own data, metadata and relationships with other nodes. Each node will have an ID as required by the VueFlow library. If a node has another node connected above/before itself, that node will contain a parent ID (parentId) metadata (which tells us on which other node this current node is connected to)

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## JavaScript component contracts

Application modules and Vue `<script setup>` blocks use modern JavaScript. Custom props use explicit runtime objects; form models retain their constructors, defaults, and update events. `jsconfig.json` provides the `@/` editor alias without JavaScript type checking. Generated UI copies use JavaScript; installed dependencies are managed by pnpm.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Run regression checks

```sh
pnpm test
```

The suite covers component props, models, event forwarding, and the repository migration boundary. Use `pnpm build-only` for the same production build, `pnpm preview` to serve it, and `pnpm format` to format source. Node.js must satisfy `^22.18.0 || >=24.12.0`.

Migration evidence and existing limitations are recorded in [the verification report](docs/superpowers/migration-results/2026-10-06-javascript-migration.md). This language migration preserves the current assessment feature coverage.
