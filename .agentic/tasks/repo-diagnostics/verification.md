# Manual repository diagnostics

Requirement: owner asks test workflow to diagnose Actions/Pages configuration after save errors/Actions unavailable. Baseline remote a955e63a58c2450c4f44c84f853778e31cfd6e77, tree e8a03364f7d4f4dddc75db3db920f03f78ac4cef (matches local checkout).

Plan independently PASS: three independent owner-only manual jobs; baseline without external actions; harmless official action/artifact smoke; isolated Jekyll fixture in workspace, no deployment. Built-in read-only token only, API visibility failures UNKNOWN. No admin permissions or settings changes. Full Jekyll action SHA checked from upstream v1 Git ref; transitive Docker tag explicitly disclosed.

Policy expands8→11 jobs, SHA list includes Jekyll. Existing security mutation tests retained. New report regression exercises actual inline Python with mocked HTTP200 disabled policy and403: preserves enabled=false, emits UNKNOWN, filters unreviewed fields and token. Local checks/code review pending. Connector has no dispatch capability; manual test remains owner-run. No live configuration result claimed.

Final independent review PASS. npm run check PASS (11 job definitions); npm test35/35 PASS including6 security tests, actual inlinePython response handling. git diff --check PASS. Manual live dispatch unperformed: owner must click Run workflow onmain; no dispatch tool available. Built-in token setting visibility remains unverified.
