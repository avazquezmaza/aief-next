# Changes

Every unit of work AIEF has done, one directory per Change. This index groups them by the release
that shipped them so you can tell current work from history at a glance.

- **Changes are never moved, renamed or edited after close.** Old Changes stay here, unedited, as
  the project's complete record (see [docs/history/](../docs/history/README.md)).
- **This file is a reading aid, not state.** `aief status` (and `status --graph`) read the Change
  directories themselves; nothing reads this index.
- **Decisions live in [knowledge/decisions.md](../knowledge/decisions.md)**, which is
  authoritative regardless of era.
- **ID 0122 is shared** by two Changes; refer to either by its full basename.
- Some links inside pre-0100 Changes point to docs that were later consolidated; they are left as
  written.

When adding a Change, append it to the last section.

## Pre-Core 3.0 (AIEF 1.x, validation, the 2.0 redesign study) — 0001–0042

Starter project, CLI MVP, first real-project validations, the AIEF 2.0 experience-redesign study
and the usability protocol. Superseded by Core 3.0; read for provenance.

- [0001](0001-bootstrap-readme/) bootstrap readme
- [0002](0002-starter-project/) starter project
- [0003](0003-executable-todo-example/) executable todo example
- [0004](0004-openspec-adapter/) openspec adapter
- [0005](0005-v1-release-candidate/) v1 release candidate
- [0006](0006-mental-model-and-tooling/) mental model and tooling
- [0007](0007-cli-mvp/) cli mvp
- [0008](0008-aief-navigator/) aief navigator
- [0009](0009-repo-polish/) repo polish
- [0010](0010-roadmap-alignment/) roadmap alignment
- [0011](0011-readme-cli-v2/) readme cli v2
- [0012](0012-adoption-engine-cli-ux/) adoption engine cli ux
- [0013](0013-analyze-current-architecture/) analyze current architecture
- [0014](0014-adoption-engine-hardening/) adoption engine hardening
- [0015](0015-public-readiness-and-ci/) public readiness and ci
- [0016](0016-real-project-validation/) real project validation
- [0017](0017-close-cycle-and-guided-ux/) close cycle and guided ux
- [0018](0018-standards-and-skills-context/) standards and skills context
- [0019](0019-workflow-clarity/) workflow clarity
- [0020](0020-product-validation-flux-portal/) product validation flux portal
- [0021](0021-adoption-ux-quick-wins/) adoption ux quick wins
- [0022](0022-visible-skills/) visible skills
- [0023](0023-gemini-prompt-ux/) gemini prompt ux
- [0024](0024-prompt-lifecycle-guardrails/) prompt lifecycle guardrails
- [0025](0025-bootstrap-experience/) bootstrap experience
- [0026](0026-product-identity-consolidation/) product identity consolidation
- [0027](0027-product-review-fixes/) product review fixes
- [0028](0028-developer-handoff-package/) developer handoff package
- [0030](0030-workflow-cohesion-requirement-sources/) workflow cohesion requirement sources
- [0031](0031-formalize-aief-domain-model/) formalize aief domain model
- [0032](0032-runtime-governance-open-questions/) runtime governance open questions
- [0033](0033-evaluate-external-harness-patterns/) evaluate external harness patterns
- [0034](0034-workflow-cohesion-change-selection/) workflow cohesion change selection
- [0035](0035-governance-conventions/) governance conventions
- [0036](0036-governance-signal-integrity/) governance signal integrity
- [0037](0037-aief-2-0-experience-redesign/) aief 2 0 experience redesign
- [0038](0038-framework-simplification-map/) framework simplification map
- [0039](0039-type-track-derivation-design/) type track derivation design
- [0040](0040-agents-md-canonical-source/) agents md canonical source
- [0041](0041-delete-review-package/) delete review package
- [0042](0042-usability-validation-protocol/) usability validation protocol

## AIEF Core 3.0 — 0043–0051

Change model, Workflow Engine, SDD Provider, Skills, Hooks, Verification Engine, documentation
architecture.

- [0043](0043-core3-change-foundation/) core3 change foundation
- [0044](0044-core3-workflow-engine/) core3 workflow engine
- [0045](0045-core3-sdd-provider/) core3 sdd provider
- [0046](0046-core3-user-workflow/) core3 user workflow
- [0047](0047-core3-skills-runtime/) core3 skills runtime
- [0048](0048-core3-hooks-runtime/) core3 hooks runtime
- [0049](0049-core3-verification-engine/) core3 verification engine
- [0050](0050-core3-documentation-architecture/) core3 documentation architecture
- [0051](0051-core3-documentation-rebuild/) core3 documentation rebuild

## 3.1.0 — 0052–0062

Released by Change 0062.

- [0052](0052-v31-bootstrap-experience/) v31 bootstrap experience
- [0053](0053-lidr-integration/) lidr integration
- [0054](0054-lidr-skill-recommendations/) lidr skill recommendations
- [0055](0055-lidr-standards-integration/) lidr standards integration
- [0056](0056-harness-hooks-visibility/) harness hooks visibility
- [0057](0057-loop-verify-feedback-retry/) loop verify feedback retry
- [0058](0058-change-graph-dependency-model/) change graph dependency model
- [0059](0059-smart-workflow-next-change-selection/) smart workflow next change selection
- [0060](0060-v3-1-release-readiness-and-documentation/) v3 1 release readiness and documentation
- [0061](0061-smart-assistant-resolution/) smart assistant resolution
- [0062](0062-bump-version-3-1-0/) bump version 3 1 0

## 3.2.0 — 0063–0088

Released by Change 0088.

- [0063](0063-findings-status-tracking/) findings status tracking
- [0064](0064-graphify-ast-graph-recommendation/) graphify ast graph recommendation
- [0065](0065-platform-support-documentation/) platform support documentation
- [0066](0066-cheat-sheet-and-glossary/) cheat sheet and glossary
- [0067](0067-status-surfaces-next-recommendation/) status surfaces next recommendation
- [0068](0068-bootstrap-interactive-wizard/) bootstrap interactive wizard
- [0069](0069-prompt-skills-ai-specs-aware/) prompt skills ai specs aware
- [0070](0070-shared-process-utils-openspec-consolidation/) shared process utils openspec consolidation
- [0071](0071-evidence-capture-from-junit-report/) evidence capture from junit report
- [0072](0072-skill-recommendation-confidence/) skill recommendation confidence
- [0073](0073-ensure-all-cli-tests-run-in-ci/) ensure all cli tests run in ci
- [0074](0074-contain-jira-file-paths-within-project/) contain jira file paths within project
- [0075](0075-support-standard-markdown-task-bullets/) support standard markdown task bullets
- [0076](0076-clarify-lifecycle-and-trust-boundaries/) clarify lifecycle and trust boundaries
- [0077](0077-reject-unknown-cli-options/) reject unknown cli options
- [0078](0078-prevent-accidental-nested-bootstrap/) prevent accidental nested bootstrap
- [0079](0079-add-definition-change-type/) add definition change type
- [0080](0080-project-maturity-detection-and-analyze-routing/) project maturity detection and analyze routing
- [0081](0081-definition-enrichment-workflow/) definition enrichment workflow
- [0082](0082-maturity-aware-standards/) maturity aware standards
- [0083](0083-verify-strict-completeness/) verify strict completeness
- [0084](0084-end-to-end-pre-implementation-initialization/) end to end pre implementation initialization
- [0085](0085-recognize-docs-directory-for-definition-maturity-signal/) recognize docs directory for definition maturity signal
- [0086](0086-close-must-not-bypass-an-unresolved-definition-decision/) close must not bypass an unresolved definition decision
- [0087](0087-aief-3-2-0-release-readiness-and-documentation/) aief 3 2 0 release readiness and documentation
- [0088](0088-bump-version-to-3-2-0/) bump version to 3 2 0

## 3.3.0 — 0089–0103

Released by Change 0103.

- [0089](0089-aief-3-2-0-visual-documentation-and-repository-hygiene/) aief 3 2 0 visual documentation and repository hygiene
- [0090](0090-expose-definition-enrichment-in-skill-context/) expose definition enrichment in skill context
- [0091](0091-add-architecture-definition-skill-pilot/) add architecture definition skill pilot
- [0092](0092-validate-architecture-definition-skill-on-realistic-projects/) validate architecture definition skill on realistic projects
- [0093](0093-durable-knowledge-expert-skill-context-review/) durable knowledge expert skill context review
- [0094](0094-add-data-definition-skill-pilot-and-validate-coexistence/) add data definition skill pilot and validate coexistence
- [0095](0095-manifest-status-change-md-discrepancy-lint/) manifest status change md discrepancy lint
- [0096](0096-run-usability-validation-study/) run usability validation study
- [0097](0097-thaw-remainder-of-adr-015/) thaw remainder of adr 015
- [0098](0098-expand-skills-catalog-with-more-stack-detectors/) expand skills catalog with more stack detectors
- [0099](0099-make-three-cli-error-messages-actionable/) make three cli error messages actionable
- [0100](0100-specialize-the-python-detector-into-django-flask-and-fastapi/) specialize the python detector into django flask and fastapi
- [0101](0101-fix-dangling-references-to-deleted-docs/) fix dangling references to deleted docs
- [0102](0102-aief-3-3-0-release-readiness-and-documentation/) aief 3 3 0 release readiness and documentation
- [0103](0103-bump-version-to-3-3-0/) bump version to 3 3 0

## 3.4.0 — 0104–0147

Released by Change 0147.

- [0104](0104-write-release-notes-for-v3-3-0/) write release notes for v3 3 0
- [0105](0105-jira-sourceid-path-traversal/) jira sourceid path traversal
- [0106](0106-bootstrap-missing-standards-for-detectors/) bootstrap missing standards for detectors
- [0107](0107-minor-consistency-fixes/) minor consistency fixes
- [0108](0108-catalog-driven-standards/) catalog driven standards
- [0109](0109-strict-acceptance-criteria-bullet-gap/) strict acceptance criteria bullet gap
- [0110](0110-ai-specs-skill-frontmatter-and-content-pointer/) ai specs skill frontmatter and content pointer
- [0111](0111-operational-guardrails-standard/) operational guardrails standard
- [0112](0112-kiro-native-assistant-target/) kiro native assistant target
- [0113](0113-skill-no-open-change-path/) skill no open change path
- [0114](0114-auto-branch-on-new-change/) auto branch on new change
- [0115](0115-strict-human-task-bullet-tolerance/) strict human task bullet tolerance
- [0116](0116-jira-provider-malformed-json-handling/) jira provider malformed json handling
- [0117](0117-branch-isolation-followup-for-enrich-analyze-propose/) branch isolation followup for enrich analyze propose
- [0118](0118-bootstrap-agents-template-reuse/) bootstrap agents template reuse
- [0119](0119-ci-lint-and-node-matrix-coverage/) ci lint and node matrix coverage
- [0120](0120-fix-strict-verify-todo-tbd-false-positive-in-historical-changes/) fix strict verify todo tbd false positive in historical changes
- [0121](0121-assistant-parity-and-audit-hardening/) assistant parity and audit hardening
- [0122](0122-ci-apt-chrome-mirror-flakiness/) ci apt chrome mirror flakiness
- [0122](0122-multi-agent-runtime-open-questions/) multi agent runtime open questions
- [0123](0123-fix-graph-cycle-membership/) fix graph cycle membership
- [0124](0124-workflow-gate-authority/) workflow gate authority
- [0125](0125-implement-workflow-gate-authority/) implement workflow gate authority
- [0126](0126-node-22-ci-and-docs-drift-housekeeping/) node 22 ci and docs drift housekeeping
- [0127](0127-scope-complete-stop-directive/) scope complete stop directive
- [0128](0128-architecture-fitness-functions-for-layer-boundaries/) architecture fitness functions for layer boundaries
- [0129](0129-evidence-provenance-for-captured-verification/) evidence provenance for captured verification
- [0130](0130-codex-external-audit/) codex external audit
- [0131](0131-manifest-close-persistence/) manifest close persistence
- [0132](0132-threat-model-and-trust-boundaries/) threat model and trust boundaries
- [0133](0133-supply-chain-hardening/) supply chain hardening
- [0134](0134-resolve-codex-audit-doc-findings/) resolve codex audit doc findings
- [0135](0135-detect-duplicate-change-id-collisions/) detect duplicate change id collisions
- [0136](0136-fix-qs-vulnerability-in-study-fixtures-and-enable-secret-scanning/) fix qs vulnerability in study fixtures and enable secret scanning
- [0137](0137-surface-change-id-collisions-in-status-overview/) surface change id collisions in status overview
- [0138](0138-stable-json-output-for-verify/) stable json output for verify
- [0139](0139-stop-bootstrap-generating-github-workflow/) stop bootstrap generating github workflow
- [0140](0140-detect-java-quarkus-camel-and-deployment-tooling/) detect java quarkus camel and deployment tooling
- [0141](0141-airoadmap-false-positive-from-assistant-files/) airoadmap false positive from assistant files
- [0142](0142-fix-readme-drift-and-node-version/) fix readme drift and node version
- [0143](0143-analyze-laya-integration/) analyze laya integration
- [0144](0144-laya-triage-skill/) laya triage skill
- [0145](0145-laya-domain-model/) laya domain model
- [0146](0146-aief-3-4-0-release-readiness/) aief 3 4 0 release readiness
- [0147](0147-bump-version-to-3-4-0/) bump version to 3 4 0

## 3.5.0 — 0148–0153

Released by Change 0153.

- [0148](0148-security-model-id-collision-gap/) security model id collision gap
- [0149](0149-human-approval-identity/) human approval identity
- [0150](0150-harden-approval-labels/) harden approval labels
- [0151](0151-protocol-security-skill/) protocol security skill
- [0152](0152-repo-cleanup-and-history-index/) repo cleanup and history index
- [0153](0153-aief-3-5-0-release/) aief 3 5 0 release

## 4.0.0 — 0154–0157

Released by Change 0157.

- [0154](0154-pre-release-simplification/) pre release simplification
- [0155](0155-detection-and-spec-approvals/) detection and spec approvals
- [0156](0156-define-4-0-simplification/) define 4 0 simplification
- [0157](0157-implement-4-0-simplification/) implement 4 0 simplification

## Unreleased (after 4.0.0) — 0158+

Merged on `main`, not yet in a tagged release. None yet.
