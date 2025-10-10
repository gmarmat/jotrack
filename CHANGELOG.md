## v0.5-M6

### Features
- Attachments: Trash viewer with restore/purge functionality
- Multi-upload per zone with progress indicator
- Versions: visual drag-reorder (localStorage persistence)
- Stability: Playwright auto-start dev server for E2E tests
- Privacy-first AI Assist with gated architecture

### API Endpoints
- GET /api/jobs/[id]/attachments/trash - List trashed items
- POST /api/attachments/[id]/purge - Hard delete single item
- POST /api/jobs/[id]/attachments/trash/purge - Hard delete all trash
- POST /api/ai/dry-run - Stubbed AI analyzer (no external calls)

### Components
- TrashPanel: Side panel for viewing and managing deleted attachments
- UploadDropzone: Multi-file upload with drag-drop and progress
- VersionsPanel: Drag-reorder wrapper with visual persistence
- Settings page: AI feature gate and API key management (local only)

### Testing
- E2E tests for trash operations
- E2E tests for multi-upload and reorder (pending integration)
- Settings AI tests (4/4 passing)

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
