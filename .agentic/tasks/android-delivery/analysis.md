# Analysis and boundaries

Repository main cloned after automatic workspace cleanup. Existing web CI and Playwright are green at baseline; Android project did not exist, only capacitor.config.json. daily_logic provides Flutter/KVM patterns, no deploy implementation. Adapt to Capacitor with Java instrumentation; do not copy Flutter commands.

Capabilities: local Node24/Java17 available; Java21/Android SDK/emulator not installed locally. GitHub connector supports tree, blob and main updates; CI can execute Android SDK/emulator. Play Console access, environment protections and credential setup unavailable. No actual Play upload authorized in this implementation turn; prepare workflow for operator.

User explicitly notes repository is PUBLIC. Code, APK artifacts and diagnostic reports are public. Upload key/service account private material must never enter commits/logs/artifacts. Release credential scope: environment google-play-internal, protected main-only deployment branch and optional human reviewers configured by owner BEFORE adding secrets. No pull_request_target/workflow_run executing untrusted artifacts; PR workflows get no signing credentials. Play workflow is manual with explicit publish and hardcoded internal track. Public signed AAB contains game code/certificate, not private signing key; documented short retention is not confidentiality.

Assumptions: existing com.kpok.threefold identity retained; first upload package identity must match Play app. Operator supplies unique increasing versionCode and uses existing upload key if package exists. Offline native v1 exposes AI/local modes, hides unavailable same-origin online. Web retains all modes. No Google Cloud owner/admin roles needed: service account only testing release permissions for this Play app.

Limits: debug APK functional instrumentation and same-source unsigned release AAB; not claiming signed Play APK on-device verification or store approval. Protecting environment outside workflow is a required owner setup step; YAML guards alone cannot stop a collaborator with repository write access from changing code.
