import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('File Streaming Endpoint', () => {
  test('should stream file with full response', async ({ request }) => {
    // Create a test file directly in the attachments directory
    const testJobId = 'test-stream-job';
    const testDir = path.join(process.cwd(), 'data', 'attachments', testJobId);
    const testFile = path.join(testDir, 'stream-test.pdf');
    const testContent = '%PDF-1.4 test content for streaming';

    // Setup: create test file
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, testContent);

    try {
      // Test full file streaming
      const streamRes = await request.get(`/api/files/stream?path=${encodeURIComponent(`${testJobId}/stream-test.pdf`)}`);
      
      expect(streamRes.ok()).toBe(true);
      expect(streamRes.headers()['content-type']).toContain('application/pdf');
      expect(streamRes.headers()['accept-ranges']).toBe('bytes');
      expect(streamRes.headers()['content-disposition']).toContain('inline');
      expect(streamRes.headers()['content-disposition']).toContain('stream-test.pdf');
      
      const content = await streamRes.text();
      expect(content).toBe(testContent);
    } finally {
      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should support Range requests for partial content', async ({ request }) => {
    // Create a test file directly
    const testJobId = 'test-range-job';
    const testDir = path.join(process.cwd(), 'data', 'attachments', testJobId);
    const testFile = path.join(testDir, 'range-test.txt');
    const content = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Setup
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, content);

    try {
      // Test Range request (first 10 bytes)
      const rangeRes = await request.get(`/api/files/stream?path=${encodeURIComponent(`${testJobId}/range-test.txt`)}`, {
        headers: {
          'Range': 'bytes=0-9'
        }
      });

      expect(rangeRes.status()).toBe(206); // Partial Content
      expect(rangeRes.headers()['content-range']).toMatch(/bytes 0-9\/\d+/);
      expect(rangeRes.headers()['content-length']).toBe('10');
      expect(rangeRes.headers()['accept-ranges']).toBe('bytes');
      
      const partialContent = await rangeRes.text();
      expect(partialContent).toBe('ABCDEFGHIJ');

      // Test another range (middle 10 bytes)
      const midRangeRes = await request.get(`/api/files/stream?path=${encodeURIComponent(`${testJobId}/range-test.txt`)}`, {
        headers: {
          'Range': 'bytes=10-19'
        }
      });

      expect(midRangeRes.status()).toBe(206);
      const midContent = await midRangeRes.text();
      expect(midContent).toBe('KLMNOPQRST');
    } finally {
      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should reject path traversal attempts', async ({ request }) => {
    // Try to access files outside the attachments directory
    const traversalPaths = [
      '../../etc/passwd',
      '../../../db/jotrack.db',
      'jobId/../../../etc/passwd',
      '../../../package.json',
    ];

    for (const badPath of traversalPaths) {
      const res = await request.get(`/api/files/stream?path=${encodeURIComponent(badPath)}`);
      // Should return either 400 (invalid path) or 404 (path safe but file doesn't exist)
      // As long as we don't get 200 or the actual file content, security is working
      expect([400, 404]).toContain(res.status());
      const data = await res.json();
      expect(data.error).toBeTruthy();
      
      // If it's 400, should say "Invalid path"
      if (res.status() === 400) {
        expect(data.error).toBe('Invalid path');
      }
    }
  });

  test('should return 404 for non-existent files', async ({ request }) => {
    const res = await request.get(`/api/files/stream?path=${encodeURIComponent('nonexistent-job/nonexistent-file.pdf')}`);
    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('File not found');
  });

  test('should return 400 for missing path parameter', async ({ request }) => {
    const res = await request.get('/api/files/stream');
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing path parameter');
  });

  test('should set correct MIME types', async ({ request }) => {
    const testJobId = 'test-mime-job';
    const testDir = path.join(process.cwd(), 'data', 'attachments', testJobId);
    fs.mkdirSync(testDir, { recursive: true });

    const testFiles = [
      { name: 'test.pdf', mime: 'application/pdf', content: '%PDF-1.4' },
      { name: 'test.txt', mime: 'text/plain', content: 'plain text' },
      { name: 'test.png', mime: 'image/png', content: 'fake png' },
      { name: 'test.jpg', mime: 'image/jpeg', content: 'fake jpg' },
    ];

    try {
      for (const { name, mime, content } of testFiles) {
        fs.writeFileSync(path.join(testDir, name), content);
        const res = await request.get(`/api/files/stream?path=${encodeURIComponent(`${testJobId}/${name}`)}`);
        expect(res.ok()).toBe(true);
        expect(res.headers()['content-type']).toBe(mime);
      }
    } finally {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
});
