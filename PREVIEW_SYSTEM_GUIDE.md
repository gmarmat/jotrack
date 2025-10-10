# File Preview System - Universal Implementation

## Architecture
```
Native browser APIs > External libraries
<object>/<embed> for PDF | <img> for images | <pre> for text | mammoth for DOCX
```

## Type Detection
```ts
getType(mime:string,filename:string):Type {
  ext = filename.split('.').pop().lower()
  // Priority: ext > mime (browsers send wrong/empty MIME)
  if(ext==='pdf'||mime==='application/pdf') return 'pdf'
  if(['png','jpg','jpeg','webp'].includes(ext)) return 'image'
  if(ext==='txt'||mime==='text/plain') return 'text'
  if(ext==='docx') return 'docx'
  if(ext==='rtf') return 'rtf'
  return 'unsupported'
}

canPreview(filename:string,size?:number):bool {
  ext = filename.split('.').pop().lower()
  ok = !size || size<=10MB
  if(['pdf','png','jpg','jpeg','webp','txt','md'].includes(ext)) return true
  if(['docx','rtf'].includes(ext) && ok) return true
  return false
}
```

## Components
```tsx
// PDF - native embed, no libraries
<object data={url} type="application/pdf" className="w-full h-full min-h-[600px]">
  <embed src={url} type="application/pdf"/>
</object>

// DOCX - mammoth conversion
const mammoth = await import('mammoth/mammoth.browser')
const {value:html} = await mammoth.convertToHtml({arrayBuffer})
<div dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(html)}}/>

// Images
<img src={url} className="max-w-full max-h-full"/>

// Text/Markdown
const text = await fetch(url).then(r=>r.text())
<pre className="whitespace-pre-wrap">{text}</pre>

// RTF - server-side strip or mammoth
fetch(`/api/convert/rtf?path=${path}`).then(r=>r.json()).then(j=>setHtml(j.html))
```

## Critical Bugs & Fixes

### Bug: Empty list despite data
**Cause**: `AttachmentFile` → `VersionInfo[]` type mismatch; missing `deletedAt:null`
**Check**: `if(ver.deletedAt!==null)` where `deletedAt` is undefined → skip row
**Fix**: Transform types explicitly with ALL required fields

### Bug: Preview button hidden
**Cause**: `isPreviewable(file.mime)` checks MIME string not extension
**Fix**: `isPreviewable(file.filename, file.size)` extract ext properly

### Bug: pdfjs worker errors
**Error**: `Object.defineProperty called on non-object`
**Cause**: pdfjs v5 breaking changes, worker bundling, SSR conflicts
**Fix**: Use `<object data={url} type="application/pdf"/>` (zero dependencies)

### Bug: API returns `{versions:[]}` but hook expects array
**Fix**: Standardize: API wraps `{data}`, hook unwraps `response.data||[]`

## Testing Pattern
```ts
test('format preview',async({page})=>{
  let dlCount=0; page.on('download',()=>dlCount++);
  
  await upload('file.ext')
  const btn = page.locator('[aria-label="Preview"]')
  await expect(btn).toBeVisible()
  await btn.click()
  
  await expect(page.locator('[data-testid="viewer-modal"]')).toBeVisible()
  await expect(page.locator('[data-testid="TYPE-canvas|html|pre"]'))
    .toBeVisible({timeout:10000})
  
  expect(dlCount).toBe(0)
  await page.keyboard.press('Escape')
})
```

## Test IDs Required
```
viewer-modal | pdf-canvas | docx-html | txt-pre | img-viewer | 
viewer-fallback | pdf-error | pdf-loading
```

## Dependencies
```json
{"dependencies":{"mammoth":"^1.11.0"},"devDependencies":{"canvas":"^2.x"}}
```
```ts
// types/mammoth.d.ts
declare module 'mammoth/mammoth.browser'{
  export function convertToHtml(o:{arrayBuffer:ArrayBuffer}):Promise<{value:string}>
}
```

## Checklist
- [ ] Extension-based detection (not MIME)
- [ ] Size limits for DOCX/RTF (10MB)
- [ ] Type transforms include ALL fields (`deletedAt:null`)
- [ ] Native `<object>` for PDF (not pdfjs canvas)
- [ ] Dynamic imports with `ssr:false`
- [ ] E2E tests: upload→preview→assert content→no downloads
- [ ] `npx tsc --noEmit` passes

## Success: 6/6 formats work, 0 manual testing needed

