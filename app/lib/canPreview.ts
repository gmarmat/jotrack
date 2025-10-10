export function canPreview(ext: string, mime: string, size: number) {
  const sOk = size <= 10 * 1024 * 1024; // 10MB limit for docx/rtf
  const e = ext.toLowerCase();
  if (["pdf", "png", "jpg", "jpeg", "webp", "txt", "md"].includes(e)) return true;
  if (e === "docx" && sOk) return true;
  if (e === "rtf" && sOk) return true;
  return false; // .doc not supported (use Convert button)
}

