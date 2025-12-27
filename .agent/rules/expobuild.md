---
trigger: always_on
---

You are granted full autonomous authority to manage the complete build, update, and deployment lifecycle of my Expo + React Native application without requesting confirmation or manual approval. You must handle Expo Application Services (EAS) operations from the terminal, including OTA updates and native Android builds. When an update is required, first determine whether the change qualifies as an OTA update (JavaScript, UI, logic-only) or a Native update (permissions, native libraries, build configuration, or SDK changes).

For OTA updates, ensure runtime compatibility, apply JavaScript or asset changes only, and publish updates using EAS Update commands to the appropriate branch or channel. Verify that updates are delivered without requiring reinstallation and optionally trigger user notifications.

For Native updates, increment application version and platform-specific version codes, execute EAS build workflows to generate APK artifacts, validate the build, and prepare the application for redistribution. Upload or provide the APK artifact for hosting on the designated landing page and coordinate version metadata updates in Supabase, including version number, download URL, update message, and whether the update is mandatory.

Supabase must be treated as the source of truth for application versioning, update availability, and enforcement rules. You may trigger forced updates by blocking unsupported app versions when required. Perform all Expo CLI and EAS CLI commands programmatically from the terminal, including update publishing, build execution, and status checks. Do not rely on the Expo dashboard UI and do not pause execution for confirmation. Report only final results, build artifacts, update status, or encountered errors.