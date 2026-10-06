# Respond.io Flowchart App

This Vue 3 web app is a technical assessment project for Respond.io's Sr. Frontend Developer position.

## Technical Design Decisions

### Flow Chart

- **Libraries used**: _VueFlow_ - for flow canvas and node layouts, _dagre_ - for graph node's positions

- Main flow state is stored as a **_Pinia_** state. Here is the state flow: @todo to create a simple flow diagram from data fetching to data mutation of the in-memory flow state

### Nodes & Edges

- Payload JSON remains the sole source of truth. Adapters are needed for **payload** --> **VueFlow** --> **payload** conversion.
  - Main reason is to ensure payload (or any backend implementations) remains the true structure of the flowchart (source of truth), hence changing frontends will only need to adapt to the data structure (no backend change means less regressions)

- Payload JSON represents few node types :-
  1. dateTime
  2. sendMessage
  3. addComment
  4. trigger

- Connectors are also introduced :-
  1. dateTimeConnector
     - Introduced as a node (due to having parentId), but adapted to be a branched-edge for **dateTime** nodes
     - Connectors are simplified into labeled edges by traversing through the payload list and find the nearest node upstream. This information is stored and passed when creating the edges.
     - Reasons with this approach is to ensure connector nodes are a part of the edge (or the 'connector' name itself) and not to be seen as a node/action. Hence, cleaner canvas, responsive positioning of the label
     - Drawbacks of this approach is extended complexity in adapting the data structure into VueFlow graph structure

### Forms

- There are two types of forms, a **Create Node** form and a **Node-related** form (which spans across 3 variants)
- Forms are being validated by _zod_ library. All schema, field errors and validation logic stays in their composables, i.e useCreateNodeForm.js and more
- Since Node Drawer is allowing users to update node data for each node type, their respective forms are made reusable to be used in Create Node form. Hence, a create node form also contains the node-related form after a node type is selected

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
