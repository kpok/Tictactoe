# Owner-only Actions

Baseline remote942d0e95c220b963b2cdfd3bcb2574206ca5c1a0; reference kpok/cartoon_ai current main observed2026-10-27.

AC1: Every existing job checks exact repository kpok/Tictactoe, repository ID969630128, owner/actor ID10676481, actor/triggering_actor kpok, main branch, allowed caller event. No bot exception. Disable pull_request trigger. Owner main push and manual main CI remain usable; reusable CI preserves caller context and versionCode.
AC2: No workflow-level concurrency before authorization. Per-job bounded concurrency never cancels trusted work. Minimal per-job permissions, no default token, immutable action SHAs and SHA checkout without stored credentials. Preserve emulator, Playwright, signing boundary and default publish=false.
AC3: Automated policy check parses real YAML, evaluates actual authorization expressions against owner/adversarial scenarios, rejects new unreviewed workflows/jobs/triggers and unsafe credentials/pins. Mutation tests prove fail-closed properties. Integrate npm run check and npm test.
AC4: CODEOWNERS and Polish admin instructions cover required fork approval, collaborators/main protection, historical definitions, GitHub-generated Pages workflow limitation and Google Play environment. No admin/settings claim without access.
AC5: Independent plan/code review, local policy/unit/build checks and actual authorized main CI.

Repository has three editable workflows and separate GitHub-generated Pages build runs. Connector supports repository writes but not administration. YAML guards cannot govern malicious changed workflows, old definitions or GitHub-generated Pages; admin steps are mandatory for complete account-level policy. Fork owners retain control of copies on their own resources. No API keys introduced or publishing enabled.

Implementation: adapt reference job gates/pins; preserve relative reusable call gated by caller plus every callee job. Add policy parser/checker and focused mutation tests. Document admin residual work. Repair budget max3 rounds. Relevant local checks then push main (standing user authorization); await full CI. No full architecture council needed for applying established policy.
