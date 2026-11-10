# Workspace backup verification

## Manually verified

- Export downloaded a JSON backup containing three projects and two tasks.
- Preview displayed the project count and correct task associations.
- Restore into an empty browser workspace recovered the projects and tasks.
- PulseForge and Forge displayed their respective tasks after restoration.
- Restore into an existing workspace was refused.
- A backup with version 99 was rejected without a restore preview.

## Current limitations

- Restore requires empty workspace storage; merging and replacement are unsupported.
- Appearance preferences and unsaved form edits are excluded.
- Backups are downloaded files, not automatic cross-device synchronization.
- Storage write failures, interrupted restores, and simultaneous writes remain unverified.
