# Project persistence verification

Date: 2026-11-10
Implementation checkpoint: 168882b
Environment: Ubuntu VM, Vite development server, Chrome on macOS.
Origin: http://127.0.0.1:5173

## Verified manually

| Check | Observed result |
| --- | --- |
| Save and refresh | Test project retained its details and Active status. |
| Sequential saves from two tabs | The older tab's save was blocked; its form edits remained available. |
| Visible conflict feedback | Warning appeared immediately above Save and Cancel. |
| Unreadable stored JSON | After reload, sample projects appeared and saving was blocked. |
| Preserve unreadable data | The stored value remained broken-json after the attempted save. |

The unreadable-data check used disposable Incognito storage.

## Limits

- The stale-tab check does not guarantee protection against simultaneous writes.
- Browser storage is specific to the browser profile and origin.
- Cross-device synchronization and backup/restore are not implemented.
- Storage quota exhaustion and denied storage access have not been verified.
