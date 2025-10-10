## v0.4-M4

### Features
- Job quick-actions: Duplicate, Open Posting, Open All Docs, Copy Summary
- In-app file preview: PDF (native embed), DOCX (mammoth), RTF, TXT, images
- Versions auto-refresh with SWR-based hooks and optimistic updates
- Full-width attachments layout restored
- Reload Data button for stale cache recovery

### Bug Fixes
- Fixed AttachmentFile→VersionInfo type mismatch causing empty versions list
- Fixed isPreviewable() to check file extension properly (not mime string)
- Fixed status select dropdown width (min-w-140px)
- Fixed PDF preview using native browser rendering (no pdfjs worker issues)
- Fixed database migration multi-statement parsing

### Testing
- 20+ comprehensive E2E tests for preview, versions, layout
- All core formats validated: PDF✓ DOCX✓ RTF✓ TXT✓ IMG✓

### Documentation
- UI_DESIGN_SPEC.md: Prevent arbitrary UI changes
- PREVIEW_SYSTEM_GUIDE.md: Universal file preview implementation

### Technical
- Upgraded to SWR for data fetching
- Added useVersions, useJobsSearch, useTabWake hooks
- Database schema: version, isActive, deletedAt fields
- API endpoints: /jobs/duplicate, /jobs/search, /files/stream, /convert/*
