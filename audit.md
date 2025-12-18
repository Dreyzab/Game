Executive Summary (Key Risks & Issues)

FSD Layer Violations (Important): The project’s Feature-Sliced Design layering is inconsistent. Some domain logic and API calls bleed into the wrong layers (e.g. inventory “outbox” logic in entities instead of a higher layer)
GitHub
, risking tangled dependencies and harder maintenance. Enforcing strict layer boundaries is essential for clarity and scalability.

Typewriter Re-render Glitch (Important): The visual novel dialogue “typewriter” effect often restarts or “jerks” unexpectedly, due to redundant renders and effect resets. In development, React’s Strict Mode double-invocation caused duplicate lines
GitHub
. Even with StrictMode off, the current implementation resets on state changes, leading to a jarring UX that could break immersion.

Client-Side Trust & Cheating (Critical): The backend blindly trusts client payloads for VN progress. For example, the /vn/commit API merges whatever flags, XP, and items the client sends
GitHub
 without server-side validation. A malicious client could grant themselves XP or items (though item IDs are checked against templates
GitHub
GitHub
). This is a severe anti-cheat vulnerability – critical game progression data must be validated or generated server-side to prevent exploits.

Quest Sync Consistency (Important): The offline quest outbox system processes events sequentially but may partial-apply updates. If a mid-queue event fails (e.g. quest state conflict), later events won’t sync
GitHub
GitHub
. This ensures order but risks a stuck queue. There’s limited conflict resolution (e.g. auto-start quest if update hits “not active”
GitHub
), but no retry/backoff strategy for irrecoverable errors. A more atomic or resilient sync is needed to avoid progress loss.

Voice System Duplication (Important): The “Internal Parliament” voices data was duplicated in multiple places (parliament.ts, voices.ts, voiceDefinitions.ts)
GitHub
, which was addressed by unifying to one source. Some remnants like test scenes referencing non-existent voices (e.g. “cynicism”, “intuition” in advice list
GitHub
GitHub
 not in the canonical 18 voices
GitHub
) indicate lingering mismatches. Inconsistent voice definitions can confuse development and break the advice system – continued cleanup is important.

Drizzle Type Safety & Migrations (Important): The database schema uses any casts in a few spots (e.g. casting quest steps and reputation to any
GitHub
GitHub
), which bypasses type safety. Also, migration logs show errors like “schema index name reserved” – likely due to naming conflicts in generated SQL. Ensuring unique index names (e.g. avoid duplicates across tables) and updating Drizzle config can fix this. A runtime error “db.insert is not a function” suggests a mis-import or initialization issue with Drizzle (using the wrong client or missing ESM interop). Upgrading the Drizzle/Bun adapter and using the correct import (drizzle(...)) resolved this in similar cases.

Performance Inefficiencies (Important): Several quick-win optimizations are available. For example, the quest loader calls the DB in a loop for each quest
GitHub
, and could be batched or joined to reduce queries. Logging and dev-only checks (many console.log in production code
GitHub
GitHub
) may degrade performance and should be stripped or gated. The map and inventory systems should use indices (e.g. spatial indexes for location queries, index questProgress.questId) and possibly caching to handle scale. None of these are game-breaking now, but addressing them will improve frame-rate and load times as data grows.

Missing Error Handling & Checks (Critical): Certain flows lack robust error handling. For example, “Player not found” errors can occur if quest routes are called before a player profile exists
GitHub
. The quest API doesn’t call ensurePlayer, so new users might hit a 404. Also, the item awarding loop doesn’t rollback on partial failure – if one item fails, others still grant, potentially leaving inconsistent state
GitHub
. These issues can break progression or reward logic, so they must be resolved for reliability.

Inventory & Parliament Integration (Important): The inventory system (tetris grid, drag-drop) is currently self-contained but slated for refactor. Its state syncing (the stubbed inventoryOutbox
GitHub
) needs fleshing out similar to quests. Also, the “Internal Parliament” advice UI is integrated into VN without introducing major lag – but ensuring that 18 voice components always mounted (even if disabled) doesn’t regress render performance will be key. Properly separating parliament (skills/advice) domain logic into its own module (perhaps moving from entities to a new domain feature) is planned to maintain clean boundaries.

(⚠️ Critical issues potentially break game progress, data integrity, or allow cheating. Important issues affect performance or code maintainability but not immediately game-breaking.)

B) Architecture & FSD Compliance

Current Layer Structure: The project follows a Feature-Sliced Design (FSD) layout
GitHub
:

shared/ – Reusable utilities, base UI components, and global types (e.g. cn classNames, @/shared/ui library, route constants in navigation.ts
GitHub
). No business logic here.

entities/ – Self-contained business entities (e.g. player, quest, mapPoint, visual-novel line). Each provides domain types and basic UI or model for that concept (e.g. src/entities/visual-novel holds VN scenario data and UI like DialogueBox). Entities should contain pure business logic and primitive UI for that domain, without cross-feature knowledge.

features/ – Focused features that compose entities for specific functionality (e.g. features/map, features/inventory, features/visual-novel/consultation). Features implement interactive logic (state hooks, controllers) and possibly feature-specific UI, but remain independent units. They may depend on entities (for domain data) and shared code.

widgets/ – Complex UI components that combine features/entities into a section of a page (often feature-agnostic). For example, the VNScreen widget brings together VN dialogue, choices, and consultation voices into one composite UI
GitHub
GitHub
. Widgets can depend on features, entities, and shared, but contain minimal business logic themselves (mostly presentation).

pages/ – Top-level page components (often using layout) that assemble widgets and features to deliver a full user-facing page (e.g. InventoryPage wraps the inventory feature’s UI
GitHub
). Pages handle route-level concerns and can pull from any layer below (they are allowed to orchestrate all lower modules
GitHub
).

processes/ – Long-running processes or managers that span across features, often handling side-effects like synchronization or background tasks. For instance, processes/quests-sync contains the quest outbox sync logic (batching quest start/update events)
GitHub
GitHub
. Processes can coordinate multiple features and entities and are typically initiated at app startup.

Dependency Violations: A few files currently break the intended layer boundaries:

Entities depending on higher layers: The entities/item/model/outbox.ts is an example – it includes a comment to use the API client (client.inventory) for mutations
GitHub
, effectively reaching into network logic. This kind of fetching inside an entity is against FSD: entities should not directly call APIs (network calls belong in features or processes). The quest outbox is correctly placed in processes, whereas the inventory outbox remains in entities. Example: The inventory outbox state is defined at the entity level
GitHub
 but ideally should be moved to a processes/inventory-sync or similar, aligning with how quest syncing is handled.

Shared -> Features: The shared layer should not import from features, but one subtle case is route definitions. Routes in shared/lib/utils/navigation.ts defines paths for features like PVP, RES0NANCE, etc., but these are just strings. There’s no direct code import cycle here (it’s data), so it’s acceptable. We did not find explicit shared-code importing feature code (which would violate boundaries), so this risk appears low.

Feature coupling: Features generally shouldn’t import other features directly (to keep them modular). The ESLint rules enforce this
GitHub
 – e.g. a map feature shouldn’t directly depend on the inventory feature. Currently, the code respects this; no obvious cross-feature imports were found in the repo. One potential violation was previously the duplicate voice systems (multiple “voices” modules). If features had started referencing the wrong voice module across, that would have been a violation. Now unified, the consultation feature uses the canonical parliament data from entities/parliament
GitHub
 which is allowed (feature → entity is fine).

Entities importing features: This should be disallowed (and ESLint boundaries rules do warn on it
GitHub
). A thorough search didn’t reveal a direct import like src/entities/… -> features/…, which is good. However, pay attention to any entity UI components that might call feature hooks. For example, if an entities/visual-novel/ui component invoked useConsultationMode (a feature hook), that would violate layering (the correct flow is the widget or page layer should combine them). Right now, VNScreen (widget) calls useConsultationMode
GitHub
, and passes entity UI (DialogueBox, etc.) as children – this is correct separation. We should continue to refactor any instances where an entity tries to manage feature logic or state.

Import Rules & ESLint Boundaries: We should solidify and slightly adjust the import boundaries (and enforce them at error level to prevent regressions). Currently configured rules
GitHub
 are:

Shared: no inward deps – can only import from shared itself or npm libs
GitHub
. (✔️ Enforced: e.g. no shared code should import features or entities.)

Entities: can import from entities (presumably other entities if needed) and shared
GitHub
. They should not depend on features, widgets, or processes. This keeps entities pure.

Features: can import from entities and shared
GitHub
. (The rules currently don’t list “features” in its own allow-list, meaning one feature shouldn’t deep-import another feature’s internals – they should communicate via public APIs or the app layer if necessary.) We might allow features to use other features’ public index if needed, but it’s best to minimize that to keep features decoupled.

Widgets: can import from features, entities, shared
GitHub
. They sit above features, composing UI. They should avoid directly calling processes (a process usually runs in the background, not through the UI).

Processes: can import from features, entities, shared
GitHub
. Processes can coordinate multiple features (e.g. quest sync uses quest feature’s API client and quest IDs) – that’s acceptable. Processes should not depend on pages or widgets (those are UI concerns).

Pages: can import from anywhere (*)
GitHub
, since they are the top integration layer, assembling everything for a route. They often import widgets and features and can even reach into entities for needed types or fallback UI. This is fine as they are essentially composition roots.

App: (the initialization layer, e.g. src/app or src/main.tsx) can import from anywhere
GitHub
 – it sets up providers, global styles, and routing.

We should add a couple of ESLint boundary rules to reinforce this:

No feature-internal deep imports: Already in place – features must import via their index.ts (the plugin rule
GitHub
 warns if someone does import ... from '@/features/abc/SomeComponent' instead of the public @/features/abc index). We’ll keep this and consider extending a similar rule to entities (encourage importing from an entity’s index barrel, not deep paths, to control exposure).

No backwards imports: e.g. if someone tries to import a feature hook inside an entity or shared module, that should be an error. The current config (“disallow” default with allowed lists) covers most of this; we should change the rule from “warn” to “error” for boundaries/element-types to prevent any violations from being ignored.

Processes usage: Ensure processes don’t import UI layers. If any special cases arise (e.g. a process needing to show a notification – better to use an event or state that a feature listens to, rather than process importing a widget). We likely don’t need an explicit rule for this now, as the existing allowed list already disallows processes -> pages/widgets.

By formalizing these boundaries (and adding any missing patterns, e.g. ensure src/app is categorized properly), we’ll maintain a clean FSD architecture. In practice, this means refactoring code that breaks the rules – e.g., move the inventory outbox logic from entities to a new processes/inventory-sync and have the feature use that process instead of reaching into entity state. ESLint will then catch if someone accidentally calls that wrong.

C) Visual Novel Audit – Typewriter & Rendering Issues

Double Render / Typewriter Reset Causes: The VN dialogue typewriter effect is implemented in DialogueBox.tsx with local state for visible character count and a useEffect timer that adds characters
GitHub
. When a new line’s text prop comes in, another effect resets the count and restarts typing
GitHub
. The core problem is that the DialogueBox component is being remounted or updated twice for the same line in some cases, resetting the effect prematurely. Contributing factors:

React Strict Mode in Dev: As noted, React’s StrictMode intentionally mounts components twice in development. Before the flag was disabled, this caused each dialogue line to render twice and thus print twice
GitHub
. This is resolved in dev by turning off StrictMode by default, but if StrictMode is enabled (or in any future concurrent rendering scenario), the effect would run twice.

State Cascade (ViewModel -> VNScreen -> DialogueBox): The chain SessionStore -> ViewModel -> VNScreen -> DialogueBox has multiple state triggers. For example: when advancing to a new line, the ViewModel sets a new currentLine state; VNScreen reacts with an effect that resets some local flags (isLineRevealed, etc.)
GitHub
; and DialogueBox gets a new key prop and new text prop
GitHub
. Specifically, VNScreen uses a key on the DialogueBox (key={"dialogue-"+currentLine.id})
GitHub
 to force remount on line change. This is intended to help AnimatePresence with transitions, but it also means each new line fully unmounts the old DialogueBox and mounts a fresh one, rerunning the typewriter from scratch (which is desired on line changes). However, any unnecessary state update during a single line could also cause a remount or re-render. For instance, toggling consultation mode replaces the DialogueBox with a different one (advice vs dialogue) and back, using different keys
GitHub
GitHub
. When the user exits consultation, the dialogue’s DialogueBox remounts (keyed by the same lineId as before) – and unfortunately, it restarts typing that line’s text from the beginning, even though it was already revealed prior to consultation. This is one source of the “jerkiness”: consulting a voice mid-dialogue causes the dialogue text to re-type upon returning.

Zustand Selector Updates: Another subtle cause can be if the zustand store triggers extra re-renders. In VisualNovelPage, the session store’s trackScene is called on each scene change via a useEffect
GitHub
. trackScene updates the visitedScenes state
GitHub
, but since no UI is directly bound to visitedScenes in VNScreen, it likely doesn’t affect DialogueBox. So this is less of an issue, as those updates don’t propagate to DialogueBox’s props. The main re-render triggers are the explicit props (currentLine, isPending, etc.) from the ViewModel. Ensuring those props only change when necessary (and using memoization where possible) will limit renders.

Triggers for Extra Re-renders: Summarizing the above, the known triggers are:

Strict Mode mount/dismount: caused duplicate effect invocation (no longer in effect unless Strict Mode is turned on).

Consultation mode toggle: entering/exiting consultation swaps DialogueBox content, causing the dialogue text box to unmount/remount. The key strategy in VNScreen treats the advice box and dialogue box as distinct components
GitHub
GitHub
. When consultation.isConsultationMode changes, AnimatePresence transitions out one and in the other, and the dialogue text box loses its internal state.

State changes during typing: If any prop passed to DialogueBox changes mid-typing (e.g. a parent sets forceShow=true or toggles isPending), the useEffect that controls typing might restart or finish early. For instance, VNScreen sets isPending prop to true while awaiting an auto-advance timeout
GitHub
. If that prop flips from false to true, DialogueBox’s isPending changes, but our effect dependencies (displayedText.length, isTyping) remain the same so it shouldn’t directly reset. However, if forceShowText were used, that triggers an effect to immediately reveal text
GitHub
. Currently forceShowText is set to false on new line and true only when user manually skips (handleAdvance)
GitHub
 or when consultation explicitly calls onAdvance to exit. It’s managed carefully, but any misuse could cause a jump.

Refactoring Plan (Typewriter): We can preserve the UI and overall logic, but restructure how the typewriter effect’s state is managed, to create a single source of truth and avoid unwanted resets:

Maintain typewriter state across re-renders: Instead of relying purely on component state that resets on remount, use a useRef to keep track of the current text index and the timer ID. For example, a typingRef = useRef({ idx: 0, timer: null }) that persists through remounts (if we can avoid unmount) or through multiple effects. We can initiate typing when a new line starts, but if the component is unmounted due to consultation, we could pause or preserve the current index. When resuming, if the line is the same, we simply restore the full text without retyping.

Avoid full unmount on consultation toggle: Instead of conditionally rendering two separate DialogueBoxes with different keys, consider rendering a single DialogueBox that can show either normal dialogue or advice text. We could control this via props (e.g. pass text = consultation.isConsultationMode ? adviceText : currentLine.text). The DialogueBox component could then have logic to switch content without unmounting. This is tricky with AnimatePresence (we might animate the content swap differently), but it would prevent losing the state. Alternatively, if separate components are desirable for clarity, we can detect when returning to a dialogue line we’ve already fully revealed and immediately show it. For example, VNScreen knows isLineRevealed was true before entering consultation; upon exit, it could set a flag to skip retyping. Actually, forceShowText can be leveraged: when exiting consultation, set forceShowText=true for one render so that DialogueBox’s effect sees it and reveals the entire text immediately
GitHub
, then set it back false. This would prevent the text from animating a second time. Implementing this would eliminate the “restart” feel when toggling voices.

Use a stable effect with proper cleanup: The current effect clears its timeout on each re-run
GitHub
. Ensure that on component unmount (or line change) we always clear any pending timer to prevent overlaps. This is already done in the return cleanup of the effect and in the unmount cleanup in VNScreen for auto-advance
GitHub
. We should replicate a similar cleanup for the DialogueBox’s typing timer if the component unmounts mid-typing (to avoid a stray async state update). Using useRef to store the timeout ID (returned by setTimeout) will allow us to cancel outside the effect if needed (e.g. if user skips). Right now, calling setVisibleCount(fullLength) and setIsTyping(false) in handleAdvance effectively cancels by stopping the effect condition, but having an explicit clearTimeout there (using the ref) would be extra safe.

Reduce dependencies to avoid re-runs: The typing effect useEffect depends on [visibleCount, isTyping]. It runs every time a character is revealed (since visibleCount increments) until completion. That’s fine. But we should be cautious about adding other dependencies that could retrigger it. Currently displayedText.length and onRevealComplete are also deps
GitHub
. Those are stable per line, and onRevealComplete is a callback prop (likely stable from parent). We should ensure onRevealComplete is either memoized or passed as a stable function from parent to not trigger effect re-run unexpectedly. (In VNScreen, onRevealComplete={() => setLineRevealed(true)} is a new lambda each render
GitHub
 – we could optimize by wrapping that in useCallback so DialogueBox isn’t getting a new prop each time. That could be causing extra effect triggers; albeit the effect only resets on text change, it’s worth making props stable.)

By implementing the above, the DialogueBox will become more robust: it will start typing new text when a truly new line arrives, but not restart mid-way due to incidental re-renders. The user experience should be a smooth typewriter that can be interrupted by a click (skip to end) or by an internal voice consultation without glitching.

 

Identifying the Current Double-Render Source: Given StrictMode is off, the main issue users see is the consultation toggle causing the typewriter to replay a finished line. We will solve that by using the forceShow mechanism or preserving state. After refactoring, test by: go to a choice with advices, wait for line to fully type out, click a voice and then exit consultation – the line text should not type out again (it should either remain fully visible or at least instantly reveal). Also test multi-choice scenes in non-Strict Mode to confirm no duplicate lines appear (they shouldn’t after these fixes).

D) Effects & “Internal Parliament” Consultation System

Proposed Domain Model: The consultation/voices system introduces new domain concepts that should be clearly defined:

Advice (VisualNovelAdvice): Already modeled as an object with properties like characterId (voice), text, mood, and optional conditions
GitHub
. This is essentially a piece of advice a particular internal voice gives. It’s attached to a VN dialogue line via characterAdvices array
GitHub
GitHub
. This domain model is good – it captures everything needed (including conditional fields minSkillLevel, required/excluded flags for gating advice availability). We should ensure this interface lives in a shared location (currently in shared/types/visualNovel.ts
GitHub
) so both front and backend (if needed) understand it. No changes needed here, but we will maintain it as the single source of truth for advice structure.

Effect (VisualNovelChoiceEffect): This represents outcomes of choosing a dialogue option – e.g. flag changes, XP gain, item rewards
GitHub
. It’s defined as a union of types (flag, stat_modifier, xp, add_item, etc.). This is used in the VN session store to accumulate results
GitHub
GitHub
. The model is comprehensive. One improvement is to integrate an effect for triggering advice or internal voice checks, but that’s not needed – advice is handled outside of choice effects (they are more immediate game-state changes). We will keep ChoiceEffect as-is, but ensure any new effect types (like perhaps triggering a Parliament voice event) are added formally if needed.

Voice Definitions: The static definitions of the 18 internal voices (id, name, description, group, etc.) should reside in one place. Right now, src/shared/types/parliament.ts holds the canonical data (PARLIAMENT_VOICES with all attributes and mottos)
GitHub
GitHub
. On the frontend, voiceDefinitions.ts in the consultation feature re-exports and augments this with UI info (icons, colors)
GitHub
GitHub
. This is fine – we use the shared base and extend for UI needs. We just need to ensure that there is no second source of truth. The update checklist indicates voices.ts and parliament.ts were unified
GitHub
; we’ll delete any deprecated files to avoid confusion.

Where to Store Voice Data: The voiceDefinitions (names, categories, etc.) remain in the client for now. We will treat them like a content constant – since skills and voices are essentially part of game design, keeping them in the code (and in DB for player skill values) is acceptable. There is no immediate need to store voice definitions in the database unless we wanted dynamic updates. The important part is unification: use PARLIAMENT_VOICES for anything logic-related (even backend calculations if any) and use VOICE_DEFINITIONS for UI representation. The VoiceId enum and groups are shared – this ensures when the backend initializes a player’s skills object, it uses the same keys (the code uses STARTING_SKILLS with these ids
GitHub
). This consistency has been achieved.

 

Advice Availability Resolution: The consultation system currently filters available advice based on the player’s skill levels and story flags
GitHub
. This is done via filterAvailableAdvices(...)
GitHub
GitHub
 which checks each advice’s minSkillLevel, maxSkillLevel, required and excluded flags against the player’s state. This function is well-implemented – we will continue to use it as the central logic to determine which voices are active at a given choice. The result is a list of available advices and corresponding voiceIds
GitHub
; these populate the voice buttons. One tweak: ensure this filtering runs only when inputs change (it’s already in a useMemo in useConsultationMode
GitHub
 dependent on currentLine, skills, flags). The skills and flags come from the game progress (vnStateQuery.data.progress.skills and flags) passed into VNScreen
GitHub
GitHub
. Those ultimately come from the backend via /vn/state. This means the advice availability is authoritative to the backend state – which is correct. We might consider moving the filtering logic to backend for security (so the server could send down which voices should be available), but since advice is a client-only hint feature (doesn’t directly affect game state), keeping it client-side is fine.

 

Integrating Consultation Mode Smoothly: The consultation (“inner voices”) mode is a UI overlay that shouldn’t disrupt the underlying VN state flow. The current integration is clever: when choices are present, the voice cards are shown and clicking one doesn’t choose a game option but flips into consultation mode. The VN stays on the same line/choice, paused. Some considerations and improvements:

Non-intrusive state: We ensure that entering consultation mode does not mark the VN session as advanced. This is true now: useConsultationMode keeps its own state (isConsultationMode, activeVoiceId, viewedVoiceIds) separate from the VN session store. The VN session (choices, current line) remains untouched until the player actually picks a dialogue choice. This separation is good. We will maintain that – consultation is effectively a view-layer augmentation.

Prevent re-renders explosion: When consultation mode state changes, only the VNScreen and its children should re-render. Right now, useConsultationMode is used inside VNScreen, and its state (consultation) is local to that component. Toggling consultation mode causes VNScreen to re-render (since consultation.isConsultationMode is used in the JSX conditions
GitHub
). That in turn re-renders DialogueBox and the voice card group. This is expected. Performance seems okay (these are relatively lightweight components), but we should avoid any higher-level re-renders. The page component doesn’t depend on consultation state, so it won’t re-render – good. If performance issues arise with 18 voice components mounting, we could consider memoizing VoiceCard components so that unchanged voice cards don’t re-render unnecessarily. Possibly sorting availableVoiceIds and only rendering those helps (the README suggests showing only available voices and maybe some grouping
GitHub
). We should verify that voices without advice are not rendered (characterAdvices is filtered, and voices with no advice are omitted, per README note
GitHub
). The code indeed does availableVoiceIds = filterAvailableAdvices(...).map(a=>a.characterId)
GitHub
, so only voices with advice at the moment appear. This prevents needless renders of all 18 every time (only those voices that have something to say given current conditions are listed). That’s optimal.

Skill/Flag dependency: The availability filtering uses the current skills and flags. These come from the gameProgress which is loaded when the VN scene started (and updated in memory as choices are made). If a choice sets a flag that could unlock a new voice advice within the same scene, we should consider if the advice system updates. Typically, advice is relevant at choice points and flags might change after a choice, by which time the scene moves on. So it’s likely a non-issue. If needed, we could refresh flags in consultation mode after each choice, but since consultation happens before making a choice, current flags are fine.

Voice consultation flow: The user can click multiple voices in one choice. The system tracks viewedVoiceIds (to mark which ones have been read, likely showing a checkmark)
GitHub
. This is handled by adding the voice to a Set on first view
GitHub
. That state resets on line change (see the effect that resets consultation on new line
GitHub
). This is correct. We should confirm that clicking outside or on the DialogueBox exits consultation (the code does this: clicking DialogueBox in consultation triggers exitConsultationMode via handleScreenClick in VNScreen
GitHub
). This ensures consultation doesn’t trap the user. Everything in the current model aligns with the Disco Elysium-style design well.

Logging and Analytics: Advice views are logged through the /vn/advice endpoint as soon as a voice is consulted (first time)
GitHub
GitHub
. The frontend collects sceneId, lineId, characterId (voice), choiceContext (IDs of current choices), skillLevel, viewOrder and sends it off via adviceMutation
GitHub
. The backend simply inserts a sceneLogs entry with this data (type advice_viewed)
GitHub
. This is a good analytics approach: it doesn’t interfere with game logic but records usage. To improve: we might include a timestamp (though backend sets startedAt/finishedAt to now) and perhaps a session or sequence ID if needed to correlate multiple advice reads in one choice. Currently, viewOrder is logged to indicate whether it was the 1st, 2nd, etc. voice consulted in that instance
GitHub
GitHub
. That, combined with timestamps, is enough for calculating metrics like “how many advice were read before making a decision.” The scene_logs table is indexed by player, and since advice logs are stored there along with normal scene commits, we might eventually separate them for easier analysis (a separate advice_logs table). But that’s optional. For now, the solution works: every consultation triggers a network call immediately. We might consider batching them (if network performance is a concern on mobile), but since it’s small JSON and not frequent, it’s fine. We do ensure that the log is only sent the first time a voice is viewed per choice (the code checks isFirstView and only calls onAdviceViewed when true
GitHub
). This prevents duplicate logs if a player toggles the same voice off and on.

 

Ensuring Non-Breakage of VN Flow: The consultation mode should be treated as a parallel overlay – it should never lock out core progression or introduce inconsistent state. After implementing the above improvements (particularly the typewriter continuity and any performance tweaks), we’ll test thoroughly: play through a VN segment, use internal voices whenever available, verify that all flags, XP, items from choices still apply correctly (they should, since advice doesn’t alter them). Also ensure that consultation mode respects disabling rules: the design says voices are clickable only when choices are on screen
GitHub
 – our VNScreen enforces that by only showing VoiceCardGroup when choices.length > 0 && isLineRevealed
GitHub
. Voices not applicable won’t show (filter handles that). So the flow is solid. Finally, toggling consultation should not consume any “advance” – currently it does not, the onAdvance is disabled when in consultation (actually, clicking DialogueBox calls exit instead of advance in that mode
GitHub
). Thus, players can safely ignore voices if they wish and just pick a choice. The system doesn’t force any extra steps.

 

Advice Content Source: Right now, advice texts are part of the scene scripts (e.g. in testSceneWithAdvices.ts we see multiple advice texts embedded in the scene data
GitHub
GitHub
). This is fine for now, but as content grows, consider externalizing them or at least keeping them organized. Possibly have a separate JSON for advice lines keyed by scene and choice, or integrate into a narrative design tool. But that’s beyond the code audit scope – just a note to keep the content manageable.

E) Backend (Bun/Elysia) & Drizzle Audit – Reliability & Security

Schema & Indexes: The database schema appears well-structured using Drizzle ORM. Most tables have primary keys and relevant indexes. For example, players has unique indexes on userId and deviceId
GitHub
, quest_progress indexes playerId
GitHub
, etc. One issue noted was a “reserved index name” error. This likely arose from Drizzle generating an index name that conflicted with either a reserved SQL word or an existing index. In Postgres, index names must be unique within a schema. Drizzle’s pgTable allows naming indexes – e.g., index('by_user_id').on(table.userId)
GitHub
. If another table had the same index name, or if Drizzle tried to reuse an existing name, the migration would fail. To fix this, we should ensure all index names are unique and not using reserved words. For instance, prefix index names with the table (like players_user_id_idx instead of by_user_id) to avoid collision. If the error was truly about a reserved keyword, simply renaming the index in the schema file and regenerating the migration (bun run db:generate) will resolve it. Given no specific index name is obviously reserved, I suspect a naming collision – so unique naming is the prevention.

 

Type-safety vs any: We found a few casts to any in schema and logic: e.g., reputation: (progress as any).reputation ?? {} in VN ensureProgress
GitHub
 and quest steps cast as any[]
GitHub
. These indicate the schema definitions might not exactly match usage. For example, quests.steps is jsonb and used to store an array of step objects, but Drizzle might not infer a proper type, so it’s used as any. We should refine the Drizzle schema: define a TypeScript interface for quest steps (with id, description, etc.) and use . $type<YourType>() on the jsonb column to avoid any. Similarly, reputation in gameProgress is a Record<string, number>
GitHub
, but the code (existing as any).reputation suggests Drizzle’s type for that might be unknown if not specified. Indeed, adding . $type<Record<string, number>>() in the schema for reputation will make it strongly typed (the schema likely does this already). If we already have that and still cast to any, it could be a bug in older Drizzle versions with complex types. Upgrading Drizzle ORM to the latest version might improve type inference. In the meantime, audit all as any usages and eliminate them by correcting types or logic – this will prevent runtime errors (e.g. treating undefined as object). In sum, tighten schema typing to avoid needing any in code.

 

Correctness of Queries/Mutations: Transactional integrity and idempotency need attention:

Quest Rewards & Idempotency: Currently, completing a quest doesn’t appear to directly give rewards via API calls – instead, quest definitions have a rewards field (fame, items, flags)
GitHub
 that presumably is applied when a quest is completed. However, the /quests/update route doesn’t implement giving those rewards; it just marks status completed and sets completedAt
GitHub
. Possibly, the VN scene that finishes a quest will include an effect (flag or item) as part of the VN commit. If not, we should implement reward distribution on completion. In either case, ensure idempotency: if a quest completion is processed twice (perhaps via a race condition or repeated outbox event), we must avoid double-giving rewards. A common approach is to record in questProgress that rewards were granted (e.g. a boolean or timestamp) and check it. Or ensure the quest completion API returns an error “already completed” on second attempt (right now it would return error because status is already completed)
GitHub
, which it does. So as long as clients handle that properly, duplication is prevented. The VN commit is similar – it always updates the gameProgress, but if the same scene were committed twice, it would double-add items and XP. We can mitigate this by adding a scene commit idempotency key: for example, include a sessionId or use the combination of (playerId, sceneId, finishedAt) as a primary key in sceneLogs and reject duplicates. Right now, nothing stops a client from re-sending the same payload. A quick partial fix: check sceneLogs for an entry with that player and sceneId with type != 'advice_viewed'. If found, refuse the commit or ignore the reward parts. Implementing this would prevent item dupes from double submissions. Since this is critical for anti-cheat, we’ll plan to add such a check.

Atomicity of VN Commit: The /vn/commit handler performs multiple writes – update gameProgress, insert awarded items (loop), then insert sceneLogs
GitHub
GitHub
GitHub
. These are not in a transaction. If a failure occurs mid-way (e.g., DB error awarding an item), some parts might be saved (progress updated) and others not (log not written, or some items missing). This could lead to inconsistencies (progress says scene done but item not in inventory, etc.). We should wrap these operations in a transaction so that either all or none apply. Drizzle supports transactions; with Bun’s postgres.js, we can manage it. This is a safety improvement. Similarly, the quest outbox events are applied sequentially without an overarching transaction (since they span multiple distinct API calls by design, that’s fine). But within one /quests/update or /quests/start call, the operations are simple single queries, so they’re atomic enough.

Error Handling (Don’t Swallow Exceptions): Many routes do the pattern if (!user) return { error: "...", status: 401 }. This is fine for auth. But deeper, if a DB call throws, we should catch it and log properly. In Elysia, an unhandled exception will result in a 500 – which is OK, but in some cases we might want a custom message. For instance, awardItemsToPlayer catches errors per item and returns success/failure in the array
GitHub
. The VN commit doesn’t check the results array thoroughly; it logs a warning for each failure
GitHub
 but still returns success true to client regardless (since there’s no overall error handling around item failures). This means if an item fails to award (e.g., DB constraint), the client wouldn’t know – except maybe that item missing in the returned awardedItems. We should propagate a partial failure info to the client, or better, fail the whole commit (since item failure is probably due to something serious). At minimum, log these failures on the server and consider them when debugging. No catches are “swallowed” silently (we either handle or let 500 happen), but we should audit each route for proper responses. The “Player not found” case in quest routes returns a 404 error object
GitHub
 which is correct. The client outbox code looks for "already" in error message to avoid treating it as fatal
GitHub
 – slightly brittle, but it works.

Synchronization & Conflicts:

Quest Outbox Sequence: As mentioned, the quest outbox flush processes events by increasing seq and stops on first failure
GitHub
GitHub
. This ensures order (which is crucial, e.g., don’t apply quest completion before quest start). The conflict strategy implemented: if an update says “quest not active”, it tries to auto-send a start event just in time
GitHub
. That covers a scenario where perhaps the start event was lost and an update arrived – the code recovers by starting the quest then applying the update. This is good. For other conflicts (like trying to start a quest that’s already started on server due to a previous sync or duplicate tap), the server returns “already started”
GitHub
, and the client treats any "already" in error as non-fatal
GitHub
 (just skipping). This means the outbox won’t break if a quest was started elsewhere; it’ll skip that event. This design overall is solid. One improvement: implement a retry/backoff for transient failures (network down is already handled by waiting until online; but server errors that are not logic conflicts, e.g. a 500, currently break the loop and then retry on next interval). We could catch such errors and implement a limited retry before giving up on that event. Also, if an event consistently fails (maybe due to data mismatch), we might need a way to drop it or mark it handled to unblock others. Perhaps after N attempts or a certain time, flag it to skip. Currently, the code will keep trying every 30s and break each time – potentially stuck. This is more of an edge-case enhancement.

Inventory Sync / Anti-Cheat: There is mention of anti-cheat “client sent reward/progress” concerns. As discussed, validating VN commit payload is key. Also, the inventory API (/inventory routes) should ensure players can’t, say, spawn items or manipulate inventory arbitrarily. Checking the inventory.ts routes: e.g., likely there’s an /inventory/add or so, but since items are normally granted via server logic (quest rewards, VN outcomes), the main risk is VN commit’s items array. We already plan to validate that. Additionally, if there are routes for item removal (trading or using items), ensure they verify ownership. The removeItemsFromPlayer function checks that the item’s ownerId matches player and item isn’t equipped
GitHub
 – that’s good. We should also ensure that when awarding items, the templateId exists (we do check with hasItemTemplate
GitHub
) and that the item is created with a unique instanceId. The code uses a combination of timestamp and random uuid
GitHub
 – should be fine to avoid collisions. The only potential cheat would be if a client tried to call awardItemsToPlayer via an exposed route. We don’t have a direct route for clients to request items; they’d have to trick the VN commit. So focusing on commit validation covers inventory too.

Authorization & Permission Checks: The backend uses a Clerk middleware (auth in routes) to set ctx.user. All game routes ensure if (!user) return 401. This covers authentication. We assume user.id is properly verified by Clerk, so that part is secure. We do see that for quests and VN, they do ensurePlayer(user) which separates Clerk accounts vs guest device IDs
GitHub
GitHub
. That’s good. One thing: in inserting questProgress or sceneLogs, they always use player.id from DB and include userId and/or deviceId for backup. This is fine. There’s no explicit authorization check like “does this playerId belong to this user” because by construction they query by user->player. So it’s secure as long as that mapping is correct.

One gap: If the game were multi-player, you’d check that a user can’t update someone else’s quest by forging an ID. In our case, since playerId is looked up internally and not taken from client, we’re safe. E.g., the client just sends questId or sceneId, and server always resolves the player via user. That’s proper – no user input for playerId. Thus, no privilege escalation risk.

 

Security – Reward Validation: To explicitly protect against “client forged reward/progress”, we propose:

On /vn/commit, cross-verify the payload against the current state and scene definition. For example, if body.payload.xpDelta is, say, > 100 when we expect at most 50 from that scene, flag it. Since the server doesn’t actually know what each scene can give (scenes are in client code), a robust solution is to have a server-side representation of scenarios or at least of maximum allowed values. In absence of that, we might implement simpler checks: e.g., limit XP delta to a reasonable max (the game design likely has max XP per scene; we could say if >1000, ignore or clamp). Similarly, limit number of items in payload.items or only allow specific itemIds that make sense for that scene (perhaps using a whitelist of quest reward item IDs if tied to quests). This is imperfect, but adds friction to cheating. An ideal approach is to move determination of rewards to server: e.g., when a quest is completed, server knows from quests.rewards what to give and does so, ignoring any client suggestion. For VN scenes, maybe tie certain rewards to flags or sceneId on server. Implementing that fully might be a larger refactor – as a quick fix, adding sanity checks on payload data is advisable.

For quest outbox events, ensure the client isn’t manipulating quest progress arbitrarily. The quests/update endpoint allows setting progress and currentStep to arbitrary values
GitHub
GitHub
, as long as the quest is active. A malicious client could skip steps. We might not easily detect that without a known quest script on server. However, since quests are largely linear or structured, and outbox is mostly trustable (coming from client gameplay), this is a known trade-off. If this were high-stakes, we’d implement server-side quest logic or at least validate that currentStep being set is indeed one of the next steps (if quest steps were defined in quests.steps). Actually, since quests.steps is stored in DB (as JSON), the server could check: is the currentStep the ID of one of the defined steps for that quest? If not, reject. Similarly, if progress is numerical, ensure it’s within an expected range (e.g., 0-100%). This would prevent completely bogus updates.

Given time, we will implement these basic validations: check that any IDs and values the client sends correspond to something plausible in our DB definitions. It’s an extra safety net.

 

Logging & Monitoring: As a reliability measure, after these changes, we should increase logging around critical sections (without exposing to client, but to server logs). E.g., if an invalid VN commit payload is received, log it with level “warn” or “error” so we can investigate potential cheating attempts or bugs. The same for quest sync if an event fails repeatedly.

 

In summary, after refactoring:

The backend will enforce stricter rules on incoming data (idempotency and validation).

Use transactions for multi-step updates (VN commit).

No silent failures – every catch logs or returns an error that the client can act on.

These changes will significantly increase the robustness against both accidental inconsistencies and deliberate tampering.

F) Performance Optimizations

Below are the top 10 quick-win optimizations identified, each with expected benefits:

Batch Quest DB Queries: In GET /quests, the server currently fetches allProgress for a player, then inside a loop queries each quest definition
GitHub
. This can be optimized by performing a single join query or a batched lookup of all quest IDs in one go. Drizzle can do findMany on quests with an in(...) condition for all IDs. This would cut down N+1 queries to 2 queries (one for progress, one for quests), significantly reducing load time especially if a player has many quests. Expected effect: Faster quest list loading (likely ~50% reduction in latency if dozens of quests, plus lower DB load).

Use PostGIS / Spatial Index for Map: The map route filters available points and zones by distance (there’s a Haversine calculateDistance helper
GitHub
 and likely logic to find nearby points). If not already, adding a GIS index or at least a B-tree on coordinates can speed up location queries. Alternatively, calculate distances in SQL (Postgres earth_distance or PostGIS functions) to filter server-side instead of pulling all points and filtering in JS. The update plan even mentions spatial indices
GitHub
. Expected effect: As map data grows (many points), queries remain quick (ms range) instead of scaling linearly with number of points. This yields smoother map load and less CPU usage in Bun for distance math.

Memoize Heavy React Components: Identify components that re-render frequently with same props. For example, the VoiceCard components for internal voices – if the player doesn’t change skill levels mid-dialogue, those props (voice info, whether viewed) remain static during a consultation session. We can wrap VoiceCard and VoiceCardGroup in React.memo so they don’t re-render unless props change. Similarly, CharacterGroup in VNScreen (which shows character portraits) can be memoized if character states don’t change line-to-line (currently it likely re-renders each line even if the same characters). Expected effect: Reduction in unnecessary reconciliations, improving FPS on lower-end devices when the VN screen is active with multiple components. The UI will feel snappier especially during consultation when many voice cards mount.

Limit Logging in Production: The app liberally logs to console for debugging (prefixed with emojis like 🗂️, 🖼️, 💬, 📊)
GitHub
GitHub
. While invaluable during development, in production these logs (especially inside loops or intervals) can slow things down and flood the console (which in some environments is a performance bottleneck). We should wrap these in a debug flag check or strip them out in production builds. For instance, use an environment variable DEBUG_VN to enable the VN-related logs. Expected effect: Removing console I/O can improve performance during intense operations (typewriter, quest sync) by a noticeable margin, and avoids leaking internal info in prod consoles.

Avoid Re-render on Timer Ticks: The typewriter currently uses state for each character addition, re-rendering the DialogueBox for every character. This is usually fine (30ms intervals, small component), but if we wanted ultra-smoothness, we could consider using a ref to append text without full re-render, or batch updates (e.g. update every few characters). However, given React 19’s efficiency and that each update is small text diff, this is micro-optimization. The bigger win is ensuring it doesn’t render twice as discussed. Expected effect: Minor improvement to animation smoothness and CPU usage during typing.

Cache Expensive Calculations: If any expensive pure function is being recalculated often, cache it. For example, filterAvailableAdvices could be heavy if many advices, but it’s already memoized inside the hook
GitHub
. Another example: building the VN choice views (buildChoiceViews) likely checks flag requirements each time
GitHub
GitHub
. It’s memoized on [currentLine, flags]
GitHub
, which is fine. We should scan for any .map or .filter over large collections on each render. The inventory grid packing or map rendering might have such. If found, use useMemo to cache results until inputs change. Expected effect: Lower CPU spikes when those components update, improving responsiveness during inventory drag-drop or map moves.

Virtualize Long Lists: Not immediately apparent, but if there are any long lists (e.g. quest list, inventory items list), implementing virtualization (render only visible items) would be a win. The inventory grid might have many slots; if performance there lags, consider virtualization or canvas rendering for the grid. Similarly, if chat logs or quest logs become long, virtualize them. Expected effect: Constant time rendering for long lists, avoiding degradation as data grows.

Leverage Bun’s Performance: Bun is extremely fast at JS, but we should ensure we’re using Bun-specific optimizations: use Bun.write for file writes if any, use Bun’s built-in WebSocket and not fall back to Node polyfills, etc. In our context, one area is the static file serving or JSON serialization. Bun’s JSON is fast, but if we had any custom serialization, switching to Bun’s native might help. Also, ensure we run Bun with appropriate flags for production (e.g. bun --hot only in dev). Expected effect: Maximize throughput on the backend, potentially allowing more concurrent players or reducing response times by a few milliseconds each.

Database Connection Pooling: If not already, ensure the Bun Postgres client is using a pool of connections. The code postgres(connectionString) likely does internal pooling. If not, for high load, setting up a small pool (5-10 connections) will allow concurrent queries without waiting. Expected effect: Better backend scalability under concurrent load (no obvious effect in low concurrency conditions).

Optimize Image Assets Loading: The UI uses a lot of images (especially for the six groups of internal voices icons, backgrounds, etc.). We can ensure these are optimized (compressed) and perhaps preloaded. Using Next-Gen image formats or lazy-loading off-screen images (Tailwind or custom CSS for lazy load) could improve memory usage. Also, consider sprite-sheets or combining small icon images to reduce HTTP requests. Expected effect: Faster initial load and lower memory; on mobile this prevents jank when images appear (though Bun’s dev server and production build likely handle some optimizations already).

Each of these optimizations is relatively small individually, but together they enhance performance. The most significant in terms of user impact are batching DB queries (reducing potential lag spikes on quest/map loads) and fixing any re-render loops (like the double typewriter, which we addressed). We estimate overall, these changes could improve client frame rates by ~10-20% during heavy scenes and reduce backend response times on key endpoints by 50% or more in some cases (quest list, etc.), leading to a snappier gameplay experience.

G) Work Plan (Iterations)

We propose tackling these issues in 3 iterations, prioritizing critical fixes first and progressively refactoring for ideal architecture:

 

Iteration 1 – Minimum Viable Fixes (1-2 days)
Goals: Address game-breaking issues and easy improvements.

1. Security & Data Integrity (Critical): Implement idempotency checks on VN commit and validate payload. Files: server/src/api/routes/vn.ts (add check in POST /vn/commit for existing sceneLogs, limit xpDelta, etc.)
GitHub
GitHub
. Risk: Low-medium (mostly adding conditions, shouldn’t affect normal flows). Complexity: Moderate (must carefully choose validation criteria). Done when: Re-submitting the same VN commit (or altered payload) results in an error or sanitized outcome, and normal commits still succeed. Also, “Player not found” no longer occurs on quest usage (resolve by calling ensurePlayer in quests routes or by auto-invoking /vn/state on login).

2. Typewriter Glitch Fix (Important): Prevent dialogue text from retyping after consultation or due to double renders. Files: src/widgets/visual-novel/VNScreen.tsx (adjust how DialogueBox is keyed or set forceShow on consultation exit)
GitHub
, src/entities/visual-novel/ui/DialogueBox.tsx (useRef for timeout, enhance handleAdvance)
GitHub
GitHub
. Risk: Low (UI-only, can be tested in isolation). Complexity: Low. Done when: Exiting a voice consultation doesn’t replay the text; no “jumpiness” in typewriter during normal scene progression.

3. Critical Bug Patches (Critical): Fix any known crashes or blockers. E.g., if “db.insert is not a function” was encountered in some environment, ensure Drizzle is properly initialized. Possibly update Bun to latest and Drizzle to match (this might be just a local environment fix). Files: server/src/db/index.ts (verify initialization)
GitHub
. Risk: Low. Complexity: Low. Done when: The backend starts without errors and can run a migration and seed without the mentioned errors.

4. ESLint Boundaries Enforcement (Important): Adjust settings to turn boundary warnings into errors, and remove any current violations. This includes moving the inventory outbox to processes or at least clearly separating concerns. Files: eslint.config.js (change boundaries/element-types rule to error)
GitHub
; possibly create src/processes/inventory-sync/... and move logic from entities/item/outbox.ts there, then adjust imports. Risk: Low (dev-only). Complexity: Moderate (small refactor). Done when: npm run lint passes with no boundary warnings and layering looks clean (inventory feature uses the new process or directly uses client, but entity no longer suggests doing so).

Criteria: Iteration 1 is complete when the game runs without major exploits (no item duping via double commit), the dialogue UX is smooth, and the codebase passes stricter lint rules – all without regressing any gameplay. This iteration is primarily about stabilizing.

 

Iteration 2 – Standard Improvements (2 days)
Goals: Improve performance and code quality in key systems (VN, quests, map).

5. Optimize Quest Loading & Sync (Important): Refactor GET /quests to batch queries and include prerequisites check more efficiently. Also add better handling in quest outbox for persistent failures (maybe count retries or mark events). Files: server/src/api/routes/quests.ts (replace loop with batch query using in(...))
GitHub
, src/processes/quests-sync/useQuestOutboxSync.ts (implement simple retry or skip logic in flushQuestOutbox)
GitHub
GitHub
. Risk: Low. Complexity: Moderate (writing a slightly complex query). Done when: Fetching quests returns correct data with 1-2 queries (verify via logs or timing), and quest sync no longer gets “stuck” infinitely on one bad event (simulate by introducing a fake error and ensure it skips or retries then skips).

6. Consultation & Voices Refactor (Important): Finalize the internal voices integration as a first-class feature. This involves removing any leftover duplicate voice data (ensure only shared/types/parliament.ts and consultation’s voiceDefinitions.ts exist for voices). Also update src/entities/parliament/README.md with the latest design (if not already) and ensure “cynicism” or “intuition” are either added to the official list or removed from scenes. Possibly update the test scene to use existing voices (or add those voices officially if needed). Files: src/entities/visual-novel/scenarios/*.ts (find “intuition” etc. and replace or drop)
GitHub
GitHub
, remove parliament.ts duplicate if any (the update said voices.ts vs parliament.ts – likely one can be deleted). Risk: Low (content changes). Complexity: Low. Done when: The voice definitions are singular and consistent – no runtime warnings about missing voices, and all advice characterIds correspond to a defined VoiceId (we can add a runtime check in dev to log if an undefined voiceId is used in advices).

7. Performance Tweaks (Important): Implement the quick-wins like memoization and log removal. Memoize VoiceCard component (to avoid re-rendering all voice cards on each consultation state change) and possibly DialogueBox (though DialogueBox state changes frequently, memo wouldn’t help much). Remove or guard console.log statements for production as discussed. Add missing DB indexes if analysis found any (for example, if scene_logs is frequently queried by player, index playerId). Files: src/features/visual-novel/consultation/ui/VoiceCard.tsx (export with React.memo), src/shared/lib/utils/cn.ts (ensure it’s efficient, probably fine), server/src/db/schema/*.ts (add index on sceneLogs.playerId or questProgress.questId if needed). Risk: Low. Complexity: Low. Done when: Profiling in browser shows fewer unnecessary renders (we can measure renders via React DevTools, expecting VoiceCard not to re-render when another voice is clicked), and server logs/console are quiet in production mode.

8. Transactional VN Commit (Critical): Upgrade /vn/commit to use a transaction to group its operations. Use Bun’s postgres transaction (e.g. await db.transaction(async tx => { ... }) if supported). Files: server/src/api/routes/vn.ts (wrap the update, item inserts, and sceneLogs insert in one transaction). Risk: Medium (changing how DB ops execute; need to ensure returning logic still works). Complexity: Moderate. Done when: Testing a simulated failure mid-commit (e.g. make awardItemsToPlayer throw for one item) results in no changes to progress or partial inserts – either all succeed or all fail and an error is returned. This ensures consistency.

Criteria: Iteration 2 is done when the game runs more efficiently (less CPU/db usage) and internal data structures (voices, logs) are cleaned up. Key features like quest listing and VN commit should be faster and robust. No user-facing differences except possibly slight performance and the absence of prior bugs.

 

Iteration 3 – Ideal Cleanup and Future-Proofing (2+ days)
Goals: Implement deeper architectural alignment and polish based on FSD and planned extensions.

9. Inventory/Parliament Domain Relocation (Important): Restructure the code to place the “Internal Parliament” and “Inventory” domains in the correct layer. Likely, Parliament (the voices/skills system) deserves its own feature or even entity: it’s currently partly in entities/parliament and partly in features/visual-novel/consultation. We might create src/features/parliament for any interactive aspects (e.g. perhaps leveling up voices or toggling them on Character page) and keep static data in entities/parliament. Ensure no feature-specific logic remains in entities. For Inventory, possibly create features/inventory/model for the outbox and any API calls (currently, entities/item/outbox and entities/item/store hold some logic). The plan could be to move useOutboxMutation and any fetching to features/inventory and let entities/item only hold item types and maybe simple local state (like selection, which slot is highlighted, etc.). Files: This is a broader refactor: move files, update imports across the app (e.g. wherever inventoryOutbox was used, use the new location). Risk: Medium (refactoring storage logic can introduce bugs if not careful). Complexity: High (multiple moving pieces). Done when: The project structure reflects clear boundaries – e.g., entities/item contains no references to API or zustand (other than basic item state), and features/inventory contains the state management for syncing. The “Internal Parliament” voices consultation is largely contained in one place (likely the consultation feature), and any future expansion (like using voices in combat) would go through a well-defined interface (possibly the parliament entity providing voice data and a parliament feature managing any UI or interactions like skill checks). One concrete check: no import from entities/parliament directly in far-flung features; instead, features use the unified voice definitions from either shared or a central module.

10. Comprehensive Testing & Hardening (Critical & Important): After all changes, do a thorough test and add automated checks where possible. Write unit tests for critical functions like mergeFlags, awardXPAndLevelUp, filterAvailableAdvices to ensure they work with edge cases. Add an integration test (could be a script or just manual test plan) for the VN flow: start a new game, go through the prologue, make a few choices, use internal voices, complete a quest, and ensure the database state (players, gameProgress, questProgress, items, sceneLogs) is correct and consistent at each step. Also test abnormal scenarios: what if two /vn/commit calls are made quickly? (Should reject second), what if quest sync tries to start an already completed quest? (Should skip). Possibly incorporate these into E2E tests using Playwright or similar (manual for now if needed). Files: tests would be new, or we use existing testing setup. Risk: Low (tests don’t affect production). Complexity: Moderate to write tests, but necessary. Done when: We have a checklist of scenarios (see section H) all passing. Any new bug found is fixed. This task is ongoing during iteration 3 as we polish.

We break iteration 3 into these sub-tasks because it’s about refinement and ensuring the architecture is future-proof. At the end of iteration 3, the codebase should be cleanly divided, with no known boundary violations or critical bugs, and prepared for planned features (combat integration with voices, etc.).

 

Throughout these iterations, we will label any risky changes as “critical” or “important” as above. For example, moving domain logic (inventory sync) across layers is important for code health but must be done carefully to not break syncing (which could be considered critical if it fails). We’ll mitigate risk by performing these moves with ample testing in iteration 3, when most critical fixes are already out of the way.

H) Testing Checklist After Changes

After implementing the above improvements, we will conduct thorough unit, integration, and manual tests. Key items to verify:

Basic Game Flow: Start a fresh game (no player in DB). Complete the prologue VN scene. Expectation: a new players row and game_progress created (from ensurePlayer/ensureProgress) – verify these exist. No errors in console or network. The prologue quest (“Chance for a newbie” etc.) should be started if designed so, and the map should unlock. No duplicate dialogue lines should appear during VN.

Typewriter & Consultation: During a VN scene with choices and internal voices (use the test_consultation_scene or similar):

Ensure the dialogue text types out character by character at the set speed (30ms per char).

Click a voice advice mid-choice. The advice text should type out similarly. Close the advice (click the dialogue box or outside) – the main dialogue text should still be fully visible (not retyped).

If you click another voice, the previous one should get marked as viewed (e.g. checkmark on its card) and new advice types out. After viewing multiple, exit consultation and choose an option.

Edge: Try clicking to skip while text is typing – one click should instantly reveal the full line (DialogueBox’s skip), and a subsequent click should advance to the next line
GitHub
. Ensure this double-click doesn’t accidentally jump two lines or skip a choice.

Verify that once a line is fully revealed (isLineRevealed==true), the choice buttons appear and voice cards (if any advice) appear. No further typing occurs in background.

Ensure the mood labels and stage directions display correctly and consistently (not duplicating “undefined” – the sanitize function removed those
GitHub
).

Session Store & Commit: At a scene end, ensure the VN session payload is properly built. Check that SessionStore.consumePayload returns expected data (test via console logging the payload). Then trigger the commit (either by clicking “Finish” on scene complete or navigating away which triggers auto-commit on unmount
GitHub
).

The commit API call should return success. Verify in DB: the game_progress for the player should have updated fields (flags added, xp increased if xpDelta, etc.). If items were awarded, check items table for new entries belonging to the player
GitHub
GitHub
.

If a commit is sent twice (simulate by calling the endpoint again manually with the same payload), verify the second response is an error or no duplicate effects: game_progress shouldn’t double increment XP, no duplicate item should appear. This tests the idempotency fix.

Check that a corresponding sceneLogs entry was written for the commit with correct data (choices, flags, etc.)
GitHub
.

Advice Logging: After using a few internal voices, verify that /vn/advice calls were made for each unique advice viewed. Check the scene_logs table for those entries (payload.type = 'advice_viewed')
GitHub
. They should have the right voice IDs and viewOrder starting at 1. If you viewed three voices in one choice, there should be three logs with viewOrder 1,2,3. No duplicates for re-viewing the same voice in one choice.

Quest System:

Start a quest via gameplay (e.g. an NPC triggers quest start). Or manually call POST /quests/start with a questId. Ensure it returns started:true and the DB has a new quest_progress entry. If called again for the same quest, it should return an error "already started"
GitHub
 (and outbox should treat it gracefully).

Progress a quest: call POST /quests/update with questId, some progress or currentStep. If quest not started, should 404 "Quest not active"
GitHub
 (and our outbox should then do a start then update). Mark a quest as completed via update (status:'completed'). Then try sending another update after completion – it should ideally error or ignore (since quest is completed).

If quest rewards are supposed to be granted on completion, check that they are (this might be done via VN commit or placeholder now). If not implemented, add a test to ensure planned reward logic (like awarding fame or items) either happens or is noted to implement.

Test outbox: simulate offline by dispatching events to outbox without network, then call sync. This is hard to do manually, but we can unit test flushQuestOutbox: feed it a sequence of events (start, update, complete out of order) and see that it calls the server in correct order. For manual: perhaps trigger two quest actions quickly and see if outbox batches them (though currently it syncs immediately on online by useEffect
GitHub
). Ensure after sync, outbox is cleared (outbox.events should be empty and lastSyncedSeq updated).

Inventory:

Pick up an item via VN (if any scene awards one) or seed some items (using bun run db:seed or an admin action). Ensure the item appears in the inventory UI grid with correct name/stats. Move it around in the UI (drag-drop) to ensure that frontend state works (not directly part of this audit, but regression test).

If the outbox for inventory was implemented, test that using/dropping an item enqueues an event and (when online) syncs it. If it’s still a stub, verify that nothing crashes and the stub function does nothing (no side effects). That’s acceptable for now.

Map & Location:

Load the map page. Ensure that only relevant points show (based on phase and flags). Pan/zoom to see performance – it should be reasonable. Trigger a point discovery (maybe via scanning a QR code if supported by simulating GET /map/scan?qr=<some> if such exists). Ensure the player’s pointDiscoveries DB table updates and UI reflects new point unlocked.

Check safeZones/dangerZones toggling if applicable (they had data in DB). Those should load quickly. If there was an issue with selectedPoint vs selectedPointId conflict (from update.md
GitHub
), ensure that selecting a map marker consistently works (no mis-sync between what's highlighted vs what info is shown). That issue might not be fully addressed yet, but at least it should not crash.

Regression Checks:

Multiple Device/Users: Create a Clerk user and a Guest, ensure both flows create separate player profiles and do not mix up (user with Clerk ID should not reuse a guest’s data, etc.). The ensurePlayer logic should handle that (userId vs deviceId)
GitHub
.

Multiplayer placeholders: If any coop/PvP features are partially implemented (saw routes for coop, resonance, etc.), just smoke-test that calling those endpoints doesn’t break anything, even if they return unimplemented errors. We mainly ensure our changes didn’t inadvertently affect those.

Error Handling: Intentionally cause some errors to see responses: e.g., call /vn/commit without authentication – should get 401. Call with an invalid sceneId – ideally should either 400 or just treat as new scene (our ensureProgress sets unknown scene as default). No 500s should occur for bad input; they should be gracefully handled where possible.

Performance metrics: Using dev tools, record the performance during a complex VN scene. Ensure frame drops are minimal during normal text rendering and consultation toggling. Network requests for advice logging should be asynchronous and not stall UI (they are small fetches, they shouldn’t). On backend, monitor CPU/memory if possible when running a series of quest sync and VN commits to ensure no memory leaks (Bun is quite stable, likely fine).

This checklist, when all points pass, will give high confidence that our fixes and improvements are successful. We’ll particularly re-test any critical scenarios (commit idempotency with double submit, quest outbox with edge errors, etc.) as those are where data loss/duplication could occur. Only once those tests are green, we consider the audit tasks completed and the game ready for the next phase of development.