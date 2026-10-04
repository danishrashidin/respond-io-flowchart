# Flowchart App Project Requirements

This document defines the requirements for a flowchart application submitted as a senior engineer technical take-home assessment. It also records the current implementation, its design choices, and the remaining work needed to meet the supplied criteria.

Prepared on 4 October 2026. Requirements come from the six supplied assessment screenshots. The main requirements section defines the assessment criteria independently of the code. The final section records the current implementation and compares it with the work still needed.

## Objective and scope

Provide an interactive canvas that displays nodes from the supplied JSON payload and lets users drag them across the canvas. Users can create nodes, inspect their properties through a details drawer, edit supported content, and delete nodes. The application should demonstrate clear engineering decisions, smooth interactions, appropriate validation, maintainable code, and comprehensive unit tests.

The required user-created node types are Send Message, Add Comments, and Business Hours. Success and failure nodes associated with business hours are display-only canvas elements.

The screenshots do not define a workflow execution engine, authentication, collaboration, backend storage, connection editing, or deployment requirements. These should not be treated as assessment requirements without additional evidence. Node dragging is explicitly required; undo/redo for those movements remains optional.

## Requirement priorities

- **Required:** Features and engineering expectations stated in the Technology and Flow Chart Canvas, Create Node, Node View in Canvas, Node Details Drawer, and Key Details screenshots.
- **Preferred:** A custom implementation is appreciated. The screenshot explains this as avoiding source code from an open-source project; it does not describe this as a mandatory requirement.
- **Optional:** Undo/redo, keyboard accessibility for node selection and drawer access, and a CI/CD pipeline for tests.

Acceptance criteria below translate the screenshots into observable outcomes. Where the screenshots leave a decision open, this document identifies the gap rather than inventing an assessment rule.

## Technology requirements

The Technology screenshot specifies the following required stack. It also explicitly permits any UI frameworks or components.

| ID | Required technology | Acceptance evidence |
| --- | --- | --- |
| TR1 | JavaScript/ES6 | Application code uses the stated language. If TypeScript is used, document the choice and confirm whether it is accepted under this criterion. |
| TR2 | Vite | Vite provides the application's development and build tooling. |
| TR3 | Vue 3 | The application is built with Vue 3. |
| TR4 | Pinia | Pinia stores application data, consistent with QR5. |
| TR5 | Vue Router | Vue Router manages navigation, consistent with QR5. |
| TR6 | Vue Flow (`vue-flow`) | Vue Flow renders the flowchart canvas and its nodes. |
| TR7 | Query | Use the Query library referenced by the assessment. The screenshot shows a hyperlink labeled “Query” but does not expose its URL or exact package; confirm the intended library from the original assessment link. |

UI frameworks and components are allowed. This permission and the required Vue Flow library coexist with the preference for a custom implementation; the remaining question concerns reuse of project/example source code rather than permission to use these libraries.

## Functional requirements and acceptance criteria

### Flowchart canvas and node movement

**FR11 — Render the supplied JSON payload.** Use Vue Flow to display nodes from the assessment's `payload.json`.

Acceptance criteria:

- The canvas is populated from the supplied JSON payload rather than independently hard-coded node content.
- Each supported payload node is represented with the appropriate node type and data.
- Verify the data source against the original assessment payload. The screenshot contains a link labeled “this JSON” but does not expose the target URL.

**FR12 — Drag nodes.** Each node must be draggable so users can move it across the canvas.

Acceptance criteria:

- The user can drag each node to a different canvas position.
- Releasing the node leaves it at its updated position during the current session.
- Node dragging works alongside click-to-toggle details. Success and failure nodes remain display-only for details access; that restriction does not remove the separate dragging requirement.

### Node creation

**FR1 — Create New Node.** Provide a visible **Create New Node** button and a creation form containing a Title text field, a Description text field, and a Type of Node select field.

| Display label | Required selection value |
| --- | --- |
| Send Message | `sendMessage` |
| Add Comments | `addComment` |
| Business Hours | `businessHours` |

Acceptance criteria:

- The user can open the creation form from the page.
- The form exposes all three fields and all three node types.
- Submitting valid input creates a node with the entered title, description, and selected type, and makes it available on the canvas.
- Invalid input is handled according to the agreed validation rules. Exact required fields and length limits remain unspecified in the screenshots.

### Canvas node presentation

**FR2 — Node cards.** Each applicable node on the canvas must display an icon, a title, and a truncated description.

Acceptance criteria:

- A user can identify a node by its icon and title.
- Long descriptions are truncated within the card rather than expanding it without bounds.
- The node's description is available in the details drawer for inspection and editing.

### Details drawer and routing

**FR3 — Node details access.** Each editable node must have a details drawer showing its properties and relevant attachments. The drawer must be accessible through a URL containing the node ID and toggle when the user clicks the node.

Acceptance criteria:

- Opening a supported node URL displays the drawer for that node.
- Clicking a node opens its details; clicking the same node again closes them.
- Selecting a different node displays that node's details.
- The drawer shows the selected node's properties and the controls appropriate to its type.

**FR4 — Edit common properties.** The drawer must allow editing Title and Description.

Acceptance criteria:

- Existing values populate editable fields.
- Accepted edits update the selected node's properties and corresponding canvas presentation.
- Invalid edits follow the agreed validation rules.

**FR5 — Delete a node.** Provide a delete option in the details drawer.

Acceptance criteria:

- The selected node can be deleted through the drawer.
- The deleted node is removed from the canvas.

### Send Message content

**FR6 — Attachments.** Display existing attachments as tile or box previews and allow new attachments to be uploaded.

Acceptance criteria:

- Existing attachments appear as identifiable tiles or boxes in the selected node's drawer.
- The user can select a new attachment and associate it with the node.
- The drawer reflects the updated attachments.

**FR7 — Message text.** Display existing message text in an input field and allow the user to update or remove it.

Acceptance criteria:

- Existing text is editable in the drawer.
- Changes are retained in the selected node's data.
- Removing text removes the corresponding content from the node.

### Add Comments content

**FR8 — Comment editing.** Display the existing comment in an input field and allow it to be updated or removed.

Acceptance criteria:

- The selected node's comment populates an editable field.
- Updating or removing the comment updates that node's data.

### Business Hours content

**FR9 — Schedule editing.** Display existing business hours and use a Date Time Picker to update them.

Acceptance criteria:

- The drawer displays the node's existing business hours.
- A picker allows the user to change those hours and retain the changes in the node's data.

**FR10 — Display-only outcomes.** Success and failure nodes must be visible on the canvas but must not provide access to a details drawer.

Acceptance criteria:

- Success and failure remain visible as business-hours outcomes.
- Clicking either outcome does not open node details.
- A URL referring to either outcome does not expose an editable details drawer.

## Engineering and quality requirements

| ID | Assessment requirement | Acceptance evidence |
| --- | --- | --- |
| QR1 | Smooth transitions between canvas and nodes | Demonstrate responsive canvas interactions and smooth transitions when opening or closing node details. The screenshots set no numerical performance target. |
| QR2 | Necessary validation for all input fields | Document the validation rules, enforce them during creation and editing, and communicate invalid input to the user. Exact limits are unspecified. |
| QR3 | Well-written code, optimized renders, and utilities extracted into separate files | Keep responsibilities clear, separate reusable logic, and review or measure rendering behavior to support optimization claims. |
| QR4 | Comprehensive unit tests for components and relevant logic | Provide a runnable suite covering components and meaningful node, validation, and data logic, including failure cases. |
| QR5 | Pinia for storing data and Vue Router for routing | Use Pinia for application state and Vue Router for navigation, including access to node details by URL. |
| QR6 | Clear, well-documented README | Explain setup, design decisions, and how to run the project. |

**Preferred custom implementation.** The assessment appreciates a custom implementation and describes this as avoiding source code from an open-source project. The Technology screenshot requires Vue Flow and explicitly permits UI frameworks/components. Document any reuse of open-source project or example source code against the custom-implementation preference.

## Optional enhancements

| ID | Enhancement | Acceptance criteria if included |
| --- | --- | --- |
| OP1 | Undo/redo for node moves and edits | The user can undo and redo completed node movements and property edits. |
| OP2 | Keyboard node selection and drawer access | The user can select a node and open its details without a pointer. |
| OP3 | CI/CD pipeline for tests | The pipeline runs the project's test suite and reports failures. |

These enhancements remain separate from required completion criteria.

## Open decisions

The following details are unspecified in the assessment images and must be documented as implementation choices before acceptance testing:

- **Validation:** Which fields are mandatory, whitespace handling, maximum lengths, and user-visible error behavior.
- **Message content:** Whether multiple text entries must be preserved, how empty text is represented, attachment types and sizes, and whether uploads require remote storage or a browser-only demonstration.
- **Schedule semantics:** Whether a calendar date picker is required, allowed start/end combinations, overnight schedules, unset weekdays, and timezone behavior.
- **Editing lifecycle:** Immediate updates versus explicit Save/Cancel, and handling unsaved changes when changing routes.
- **Deletion:** Incident edge cleanup, ownership of success/failure connectors, optional confirmation, and navigation after deletion.
- **Canvas behavior:** Placement of newly created nodes, preservation of dragged positions, and whether users can create or edit connections.
- **Routing and persistence:** Invalid or deleted node IDs, availability of newly created nodes after reload, and hosting fallback for direct URLs when using HTML5 history routing.
- **Technology interpretation:** Confirm whether TypeScript is accepted for JavaScript/ES6 and resolve the exact library behind the assessment's Query hyperlink.
- **Source references:** Obtain the original JSON hyperlink to verify that the chosen payload matches the supplied assessment data.
- **Example-code reuse:** Explain reuse of example source code against the custom-implementation preference; Vue Flow and UI frameworks/components are explicitly permitted.

## Verification plan and submission criteria

Required verification should cover outcomes rather than only component internals:

1. Create each of the three node types and verify title, description, type mapping, and retained type-specific content.
2. Open existing editable nodes by click and direct URL; verify toggling, switching nodes, property population, and invalid-ID behavior.
3. Edit title and description and verify that the correct node updates. Delete a node and verify the documented relationship cleanup behavior.
4. Verify message edits/removal, existing attachment tiles, and newly selected attachment retention.
5. Verify comment updates/removal and schedule initialization/updates, including the chosen validation rules.
6. Verify that success/failure nodes remain visible and cannot open details through clicks or URLs.
7. Unit-test payload adaptation, unique edges, creation/update/deletion logic, validation, type-specific forms, and route-to-drawer behavior. Add history tests if undo/redo is implemented.
8. Verify the required stack and the supplied JSON source, drag every node type, and confirm positions remain after release. Check that dragging does not accidentally toggle details. Check canvas interaction and drawer transitions manually, and verify the chosen screen-size support. Measure rendering only where needed to substantiate optimization claims.
9. Run type checking, production build, and the test suite. If CI is included, verify those tests run in the pipeline.

The required scope is complete when the required acceptance criteria are demonstrated, comprehensive unit tests pass, validation decisions are documented and implemented, and the README explains setup, execution, design choices, and known limitations. Optional features should be reported separately.

## Assessment sources

Assessment screenshots supplied by the user:

| Screenshot | Requirement source |
| --- | --- |
| Screenshot 2026-10-04 at 1.04.57 PM.png | Create Node |
| Screenshot 2026-10-04 at 1.05.02 PM.png | Node View in Canvas |
| Screenshot 2026-10-04 at 1.05.10 PM.png | Node Details Drawer |
| Screenshot 2026-10-04 at 1.05.17 PM.png | Key Details To Keep In Mind |
| Screenshot 2026-10-04 at 1.05.22 PM.png | Nice To Have |
| Screenshot 2026-10-04 at 3.22.11 PM.png | Technology requirements and Flow Chart Canvas |

## Current implementation and pending requirements

This section describes the local source and README reviewed on 4 October 2026. Findings are based on source inspection; the application, build, and tests were not executed for this document. “Present in source” does not mean runtime acceptance has been verified. Partial or missing behavior is compared directly with the requirement IDs above.

### Technology requirement comparison

| Requirement | Current state | Work needed to fulfill the requirement |
| --- | --- | --- |
| TR1 — JavaScript/ES6 | The project uses TypeScript in application modules and Vue script blocks. | Confirm TypeScript is accepted under the stated JavaScript/ES6 requirement and document that decision. Compiling to JavaScript alone does not establish assessor acceptance. |
| TR2 — Vite | Present in the package, configuration, and development/build scripts. | Verify development and production builds. |
| TR3 — Vue 3 | Vue 3 is declared and used by the application. | Verify runtime behavior and the production build. |
| TR4 — Pinia | Registered and used for graph state. | Verify state integration, consistent with QR5. |
| TR5 — Vue Router | Registered and used for canvas/drawer navigation. | Complete and verify details routing, consistent with QR5 and FR3. |
| TR6 — Vue Flow | `@vue-flow/core` is declared and renders the canvas. | Verify JSON rendering and node dragging under FR11 and FR12. |
| TR7 — Query | `@tanstack/vue-query` is registered and used for fixture loading and a declared mutation. | Verify that TanStack Vue Query is the library intended by the assessment's Query hyperlink. |

### Required feature comparison

| Requirement | Current state | Work needed to fulfill the requirement |
| --- | --- | --- |
| FR1 — Create nodes | Partial: button, fields, options, and store insertion exist. | Validate the agreed rules and verify each type creates a usable node with the entered common properties. If retaining the extra type-specific creation inputs, save their contents correctly. |
| FR2 — Canvas cards | Partial: icons, titles, and truncation styles exist; card bodies show type-specific content instead of the entered description. | Render the common description consistently and verify long content truncates correctly. |
| FR3 — Details drawer | Partial: ID route and click toggle exist; drawer renders only the ID. | Look up the selected node, display its properties and type-specific controls, and verify direct URLs and node switching. Define invalid-ID behavior. |
| FR4 — Edit title and description | Missing from details. | Populate editable common fields, validate edits, update the correct node, and reflect changes on the canvas. |
| FR5 — Delete node | Missing. | Add a drawer action that removes the selected node. Implement and document edge/connector cleanup and navigation after deletion. |
| FR6 — Attachment previews and uploads | Creation form scaffolding exists; existing attachments are not loaded into details and selected files are discarded on creation. | Adapt existing payload attachments for preview, connect the controls to the selected node, and retain new attachments using the chosen storage approach. |
| FR7 — Update or remove message text | Creation textarea exists; its content is discarded and details editing is absent. | Load existing text, save updates to the node payload, and implement removal semantics. Preserve multiple text entries if that is the agreed model. |
| FR8 — Update or remove comment | Creation saves a comment; details editing is absent. | Connect the comment field to the selected node and support update/removal without inserting fallback content when removal is intended. |
| FR9 — Display and update business hours | Weekly time inputs and timezone selection exist for creation only. | Load the existing schedule into details and save edits. Resolve whether native time inputs satisfy the requested Date Time Picker. |
| FR10 — Display-only success/failure | Outcome badges exist; click handling permits details navigation. | Block drawer access in both canvas interaction and direct route handling while retaining the badges. |
| FR11 — JSON canvas rendering | Local `src/lib/payload.json` is loaded through an adapter, mapped into graph state, and rendered with Vue Flow. Edge construction can append duplicates. | Confirm the fixture matches the assessment's linked JSON, correct edge construction, and verify accurate rendering of all supplied node types/data. |
| FR12 — Draggable nodes | The graph is bound to Vue Flow and no explicit dragging disablement was found in the reviewed canvas code; drag behavior was not tested. | Verify dragging for every node type, retained positions after release, and separation of drag interactions from click-to-toggle details. Ensure automatic layout does not undo user movement unexpectedly. |

### Engineering requirement comparison

| Requirement | Current state | Work needed to fulfill the requirement |
| --- | --- | --- |
| QR1 — Smooth interactions | VueFlow canvas and 200 ms drawer transitions exist; smoothness is unverified. | Exercise canvas movement and drawer transitions with representative data and address visible lag or layout disruption. |
| QR2 — Validation | Creation uses Zod string/type checks; empty strings pass and errors only reach the console. | Implement agreed common-field, message, attachment, and schedule rules with visible errors. Apply the same rules to edits. |
| QR3 — Code quality and rendering | Components, utilities, and a layout composable are separated. Edge conversion repeatedly appends earlier edges inside the payload loop. | Correct duplicate edge construction, review update/render behavior, and substantiate optimization claims. Verify layout does not unexpectedly reset user positions. |
| QR4 — Unit tests | Vitest is declared; no tests, test script, or test configuration were found. | Establish a runnable suite and cover the verification plan, including error and removal cases. |
| QR5 — Pinia and Vue Router | Present in source: both are registered and used for graph state and drawer routes. | Verify integration and route-driven access after the details controls are completed. |
| QR6 — README | Setup and run/build commands exist; technical decisions are incomplete. | Explain architecture, tradeoffs, tests, validation choices, dependency reuse, and known limitations. |

### Optional enhancement comparison

| Enhancement | Current state | Work needed if included |
| --- | --- | --- |
| OP1 — Undo/redo | Deep node and edge histories exist; no user controls or coordinated undo operation are connected. | Define history boundaries for moves/edits, expose controls, coordinate related node/edge changes, and test undo/redo. |
| OP2 — Keyboard access | Shared sidebar shortcut exists; application-level node selection and drawer opening were not found. | Implement or verify keyboard node selection and opening/closing details, including focus behavior. |
| OP3 — CI/CD tests | No CI workflow was found. | Provide a test command and configure the pipeline to execute the suite. |

### Preferred custom implementation comparison

The app uses VueFlow and shared UI components built around Reka UI/shadcn-vue. `useLayout.ts` explicitly credits a VueFlow simple-layout example. Disclose this reuse and explain its fit with the custom-implementation preference. The additional Technology screenshot confirms that Vue Flow is required and UI frameworks/components are permitted. Library use itself is consistent with that instruction; the credited layout example should still be disclosed against the preference concerning open-source source code.

### Suggested completion order

This order is a recommendation based on the current dependencies, not an additional assessment requirement.

1. Confirm the language and Query interpretation and the payload source. Define validation, editing, attachment, schedule, and deletion semantics; correct payload adaptation and verify rendering, dragging, and reliable node updates.
2. Complete node lookup and common controls in the details drawer, including deletion and display-only access restrictions.
3. Connect the message, attachment, comment, and schedule forms to existing-node data; retain their inputs and align canvas descriptions.
4. Complete meaningful unit tests, verify interactions and build behavior, and finish the README.
5. Add optional undo/redo, keyboard access, and CI/CD if time permits.

### Architecture and design decisions

The decisions below distinguish explicit repository rationale from rationale inferred from the structure. Inferred rationale describes a likely benefit and does not claim to reproduce the author's original intent.

| Decision | Implementation and rationale | Tradeoff or limitation |
| --- | --- | --- |
| Vue 3 with TypeScript and Vite | Single-file components and typed graph models form the application. Inferred rationale: keep UI logic and domain types explicit while supporting local development and production builds. | TypeScript cannot replace validation of imported or user-entered data. |
| VueFlow canvas | VueFlow renders nodes and edges, with a background and custom node slots. The README records this choice, and the Technology screenshot requires Vue Flow. | Rendering and dragging still need runtime verification. Credited example-source reuse should be disclosed separately. |
| Pinia graph state | `nodes` and `edges` are shared reactive collections bound directly to VueFlow. Inferred rationale: keep creation and canvas rendering aligned through one store. | Mutations are distributed; there are no common store actions for validated edits and deletion. |
| Route-driven drawer | Nested routes render creation or node details inside the canvas view. Inferred rationale: support node URLs while preserving canvas context. | Route IDs need validation, and display-only types need access restrictions. Mobile drawer visibility uses a separate `openMobile` state that is not driven by the route. |
| Payload adaptation | A local JSON fixture is mapped to graph nodes; IDs become strings and `parentId` relationships become directed smoothstep edges. | The edge map is converted to edges inside the per-node loop, repeatedly appending earlier edges. This can produce duplicate edge IDs and unnecessary work. |
| Dagre layout | `useLayout.ts` computes a top-to-bottom graph using measured node dimensions and 80-unit rank/node spacing, then the canvas fits the view. | Reinitialization can overwrite manual positions. Preservation of user movement needs verification. The composable credits example code. |
| Shared node cards and specialized forms | `BaseNode.vue` handles shared visuals; separate components handle message, comment, and schedule inputs. Inferred rationale: reduce repetition and isolate type-specific behavior. | Those forms are not yet reused in the details component. Canvas descriptions differ from the common description field. |
| TanStack Vue Query over a local data adapter | A query initializes graph data from `src/lib/api/payload.ts`. Focus refetch is disabled and data is configured as indefinitely fresh. Inferred rationale: preserve a query/mutation boundary for data access. | The adapter is module memory backed by a bundled fixture, not a remote API. A mutation is declared but not connected to changes; edits are not durably saved. |
| Weekly schedule with timezone names | Day.js produces weekday labels; `Intl` supplies timezone options and current offsets. | Time ordering, overnight hours, disabled days, and daylight-saving behavior have no explicit rules. |
| Separate history collections | Node and edge snapshots are tracked deeply and cleared after loading data. | Separate histories do not yet define one atomic undo step for operations affecting both collections. |

The existing module-memory adapter, sidebar cookie, and query cache do not provide durable graph persistence. Refreshing the application reinitializes it from the bundled fixture. Persistence across reloads is not a requirement stated in the screenshots, but this limitation should be documented in the submission.

### Detailed implementation observations

#### Node creation

**Current implementation — partial.** `src/pages/Flow.vue` opens `/nodes/new`. `src/components/forms/CreateNewNode.vue` provides the required fields and options, defaults the type to Add Comments, appends a node to the Pinia store, and returns to `/`. It also exposes type-specific inputs during creation, which is an implementation extension beyond the screenshot's three-field creation requirement.

Business Hours is mapped from the form value `businessHours` to the internal graph type `dateTime`. New nodes begin at `{ x: 0, y: 0 }`; the canvas layout runs when nodes are initialized. Creation does not add a relationship or edge. The node ID is generated with Vue's `useId()`; uniqueness across repeated creation sessions and imported IDs needs verification.

#### Canvas node presentation

**Current implementation — partial.** `BaseNode.vue` supplies a shared card with icon and description slots, a title, and truncation styles. Custom renderers provide type-specific icons. However, the body content does not consistently display the entered description: Send Message displays message payload content, Add Comments displays its comment, and Business Hours displays a timezone summary. Trigger content is fixed. Success/failure connectors render as badges rather than full cards. The display-only connector rule is explicit in the screenshots; the exact visual treatment of those connectors is unspecified.

#### Details drawer and routing

**Current implementation — partial.** Vue Router defines `/nodes/:nodeId`, rendered inside a right-side drawer while the canvas remains mounted. The node click handler navigates to the selected ID or returns to `/` when the same node is clicked again. The desktop drawer is 384 px wide. `NodeDetails.vue` currently displays only the route parameter; it does not load or render the selected node's data. Unknown node IDs have no explicit handling.

#### Common property editing

**Current implementation — missing.** Common fields exist in the creation form, but the details component has no editing controls or update logic. Save-on-change versus explicit Save/Cancel behavior is not specified by the screenshots.

#### Node deletion

**Current implementation — missing.** No node deletion action is connected. Associated edge cleanup, connector cleanup, confirmation behavior, and the resulting route need an explicit implementation decision; the screenshots do not prescribe them.

#### Send Message content

**Current implementation — form scaffolding only.** `SendMessage.vue` has a message textarea and a native file input. `Attachment.vue` renders a generic file icon and filename, with a removal action shown on hover. Files remain browser `File` objects; no upload service is connected.

The form is used during creation but is not connected to the details drawer. More significantly, the creation handler saves `payload: []` regardless of the entered message and selected files, so those inputs are discarded. Existing payload attachments are represented as strings, while the form expects `File[]`; an adapter is needed to support existing attachments. Attachment removal currently filters by filename, which can remove more than one file when names match. Attachment removal is an existing implementation extension, not an explicit screenshot requirement.

#### Add Comments content

**Current implementation — partial.** `AddComments.vue` supplies a textarea used during creation. Creation saves the comment, substituting `No comment added` for an empty value. Existing-node editing and removal are not connected to the drawer. That fallback is an implementation choice and should be reconsidered when implementing removal semantics.

#### Business Hours content

**Current implementation — partial.** `BusinessHours.vue` provides start and end inputs for seven weekdays using native `type="time"` controls, plus a timezone select. Creation stores the schedule and timezone. Existing-node editing is not connected. The implementation models a recurring weekly schedule; it does not provide a calendar date picker. Whether time-only controls satisfy the screenshot's “Date Time Picker” wording requires clarification.

#### Display-only outcomes

**Current implementation — missing access restriction.** `DtConnectorNode.vue` renders outcome badges, but the shared canvas click handler routes every node to `/nodes/:nodeId` without excluding connectors. There is also no route-level restriction.

### Current setup and implementation references

The existing README documents `pnpm install`, `pnpm dev`, and `pnpm build`. The package also provides `pnpm type-check` and `pnpm build-only`. There is currently no test command; one must be provided with the test suite. The declared Node.js engine range is `^22.18.0 || >=24.12.0`.

Primary implementation references, relative to the project root:

- `README.md`, `package.json`, `src/main.ts`, and `vite.config.ts` — setup, dependencies, registration, and documented decisions.
- `src/pages/Flow.vue`, `src/router/routes.ts`, and `src/router/index.ts` — canvas, click handling, and drawer routes.
- `src/stores/flow.ts`, `src/lib/api/payload.ts`, and `src/lib/payload.json` — graph state, data adaptation, history, and fixture data.
- `src/components/forms/CreateNewNode.vue` and the Send Message, Add Comments, and Business Hours form components — creation and type-specific controls.
- `src/components/node/NodeDetails.vue`, `BaseNode.vue`, and `custom/` components — details placeholder and node presentation.
- `src/lib/types.ts`, `src/lib/node.ts`, `src/lib/time.ts`, `src/lib/utils.ts`, and `src/composables/useLayout.ts` — models, utilities, and layout.
- `src/components/ui/sidebar/Sidebar.vue` and `SidebarProvider.vue` — drawer transitions, desktop/mobile state, and shared shortcut.
