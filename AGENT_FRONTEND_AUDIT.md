# Agent frontend audit — 24 September 2026

## Completed in this pass

- Chat file picker works on mobile and desktop. It accepts multiple text, Markdown, HTML, CSV, JSON, XML, and YAML files, shows removable chips, validates the 25 MB backend limit, uploads each file under the agent, then sends the filenames in the prompt. The backend indexes text artifacts in the agent's searchable collection.
- The Agent Knowledge `file` source can load a local text file into the existing 50,000 character knowledge entry contract.
- Chat streaming now reports non-2xx API errors and an empty response body rather than silently ending the turn.
- Kept the existing Incognito, Skill, voice, Advanced, and Subagent UI while documenting which controls still lack backend behavior.
- Fixed agent builder node catalog type errors: nullable descriptions and built-in/custom connector metadata.

## Backend contract and remaining product gaps

- Chat's message endpoint accepts a `message` string only. Files are stored as agent artifacts, so they remain available to that agent beyond one chat session. True per-message attachment scoping requires backend message/stream request and persistence changes.
- The artifact search index reads text-compatible MIME types. PDF, Office documents, and images can be stored by the artifact API but are not searchable through this chat attachment path. Extraction or multimodal support needs backend work.
- Voice input and subagent delegation have no working endpoint or persisted settings in the current agent API. Their existing UI remains visible by product preference.
- The agent builder includes a number of API-backed panels (tools, workflows, skills, triggers, sessions, runs, analytics, knowledge, memory, evaluations, versions, reflections). Each still needs browser-level verification against a running backend and seeded workspace; this pass verified their source contracts only.
- The repository-wide frontend build currently fails in unrelated examples, workflow editor, and other existing modules. The touched agent files pass TypeScript checking when build diagnostics are filtered to those paths.

## Mobile UX P0 pass

- Chat selection and New Chat close the mobile sidebar. Session changes are disabled while a turn is in progress, so a streaming reply cannot land in another chat.
- Recent chat rename/delete actions stay visible on touch screens and use 44px targets. The rename save action handles pointer input.
- Chat viewport follows `visualViewport` height, the composer grows with text, uses a 16px mobile font to avoid iOS focus zoom, and hides the secondary help link while the keyboard is open.
- Selected file chips are bounded and removable. Upload progress shows completed/total files, and successful files are cached across a retry of the same unsent turn.
- A failure before the chat turn starts restores the draft and keeps selected files. A failed streamed turn shows a visible Retry response action; stopping during upload prevents the chat request from starting after the upload completes.

Physical iOS and Android browser QA remains necessary for viewport and keyboard behavior. The frontend bundle compiles with `vite build`; repository-wide `tsc -b` still reports errors outside the touched agent paths.

## Mobile UX P1 pass

- Chat follows new replies only when the reader is near the bottom. A visible Latest message button returns to the live reply.
- Switching to a saved chat shows a loading state, and a failed load has a Retry action instead of showing the previous chat's transcript.
- Settings tabs scroll horizontally on narrow screens and keep the selected tab in view. Settings and Add Tool dialogs trap keyboard focus and restore focus when closed.
- Browser Back and Escape close the topmost agent drawer first; in-drawer close buttons use the same history behavior.
- Message actions have larger touch targets and a visible mobile actions affordance. Settings and Add Tool close/save controls have larger mobile tap areas.
- A failed agent save keeps the Settings drawer open.

Per-message Skill and Incognito behavior needs explicit backend contracts before mobile/desktop controls can be made consistent without presenting a false state. Physical device and authenticated backend QA remains outstanding.

## Mobile UX P2 pass

- Long prose, links, inline code, and user messages wrap within the chat bubble. Code blocks and Markdown tables scroll horizontally inside the message. Artifact cards stay within the message width and have a larger download target.
- Share, message copy, and webhook copy now confirm success only after the clipboard write succeeds; failures show an error toast.
- The chat header derives its label from the available state: Draft, Ready, Responding, or Archived chat. The API does not provide a live agent availability status.

The production Vite bundle builds, and TypeScript reports no diagnostics for the touched Build page. Physical iOS/Android and authenticated backend QA are still outstanding.

## Mobile UX P3 pass

- The empty-chat icon row now has accessible labels and 44px targets. Every shortcut fills an editable draft and focuses the composer; the file and image icons describe requests rather than claiming an unsupported direct download or image-generation action.
- The welcome icon explicitly says it shows the welcome message again.

The production Vite bundle builds after this pass. Authenticated browser and physical device checks remain outstanding.

## Mobile UX P4 pass

- Mobile Enter now inserts a newline, while the visible Send button sends the draft. Ctrl/Cmd+Enter remains available for hardware keyboards.
- Mobile and desktop composers ignore Enter while an IME is composing, avoiding accidental sends for languages that use composition.
- Send/Stop controls expose an accessible action label in both layouts.

## Browser QA status

- Local Vite development server starts and the app loads in the in-app browser.
- The app redirects to `/login` before any agent screen is rendered. Authenticated agent-screen browser QA therefore needs a signed-in local test session.
- Physical iOS and Android device testing has not been performed.

## Mobile UX P5 pass

- The Get started cards now open the actual Trigger setup and Add Tool drawer. Tapping a card no longer sends an unreviewed chat message.
- Card descriptions match the actions they open, and failures to prepare either panel show an error toast.

The Vite production bundle builds after this pass. Live verification of these panels still requires an authenticated browser session.

## Mobile UX P6 pass

- Trigger creation validates required schedule/event fields, shows a pending state, and keeps the form open with its values on API failure. It closes only after a successful create.
- Trigger actions, type selectors, form controls, and Add Tool controls have larger mobile tap targets. Mobile text inputs use a 16px font to avoid iOS focus zoom.
- Add Tool buttons and trigger actions have specific accessible labels. Tool rows allow long names and descriptions to shrink without pushing the Add button offscreen.

The Vite production bundle builds after this pass; `git diff --check` is clean.

## Mobile UX P7 pass

- Trigger enable/disable and Fire now show success feedback and prevent repeat taps while their request is pending. API errors continue through the app's central mutation error handler.
- Trigger deletion has an inline Cancel/Delete confirmation with a pending state. The confirmation resets when the settings drawer closes.
- Removed duplicate error toasts from the new trigger and Get started flows; their failed mutations already report errors centrally.

## Mobile UX P8 pass

- Add Tool search and the Nodes/Workflows switch stack on narrow screens, keeping the search usable at phone widths. The switch exposes its selected state to assistive technology.
- The drawer waits for available and attached tool data before showing results. Loading, failed load with Retry, no match, empty workspace, and all attached states have distinct messages.

The Vite production bundle builds, `git diff --check` is clean, and TypeScript reports no diagnostics for the touched Build page. Authenticated mobile browser QA remains outstanding.
