import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- Running StepContent Video UI Regression Test ---');

const filePath = path.resolve('src/components/exams/ExamWizard/StepContent.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// Test 1: Verify presence of both video source options (YouTube URL & Upload video file)
assert(content.includes('id="video-source-youtube-btn"'), 'Test 1.1 Failed: YouTube option button missing');
assert(content.includes('YouTube URL'), 'Test 1.2 Failed: YouTube URL label missing');
assert(content.includes('id="video-source-upload-btn"'), 'Test 1.3 Failed: Upload option button missing');
assert(content.includes('Upload video file'), 'Test 1.4 Failed: Upload video file label missing');
console.log('✓ Test 1 Passed: Both YouTube URL and Upload video file selection buttons are prominently defined');

// Test 2: Verify Option A retains "YouTube Video URL / ID"
assert(content.includes('YouTube Video URL / ID'), 'Test 2.1 Failed: "YouTube Video URL / ID" label missing');
assert(content.includes('id="youtube-video-url-input"'), 'Test 2.2 Failed: YouTube input element missing');
assert(content.includes('placeholder="https://youtube.com/watch?v=..."'), 'Test 2.3 Failed: YouTube placeholder missing');
console.log('✓ Test 2 Passed: Option A retains "YouTube Video URL / ID" label, input, and YouTube placeholder');

// Test 3: Verify Option B file picker and 100 MB limits
assert(content.includes('id="video-file-upload-input"'), 'Test 3.1 Failed: Video file input missing');
assert(content.includes('MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024'), 'Test 3.2 Failed: 100 MB size limit missing');
assert(content.includes('accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"'), 'Test 3.3 Failed: Accept attribute missing formats');
assert(content.includes('Supported format: MP4 (H.264 / AAC recommended). Maximum file size: 100 MB.'), 'Test 3.4 Failed: 100 MB description missing');
console.log('✓ Test 3 Passed: Option B file picker, accept formats, and 100 MB limits correctly configured');

// Test 4: Verify start upload button and duplicate submission guard
assert(content.includes('id="start-upload-video-btn"'), 'Test 4.1 Failed: Start upload button missing');
assert(content.includes('disabled={uploading}'), 'Test 4.2 Failed: Button not disabled during upload');
console.log('✓ Test 4 Passed: Start upload button is guarded against duplicate submission during upload');

// Test 5: Verify upload progress and cloud-processing message
assert(content.includes('uploadProgress >= 100'), 'Test 5.1 Failed: Upload progress >= 100 check missing');
assert(content.includes('Processing & cloud-storing video... Please wait...'), 'Test 5.2 Failed: Processing cloud-storing message missing');
assert(content.includes('File transferred to server. Finalizing cloud encoding and generating playable preview...'), 'Test 5.3 Failed: Cloud encoding subtext missing');
console.log('✓ Test 5 Passed: Cloud processing and encoding feedback messages properly displayed at 100% progress');

// Test 6: Verify error handling and timeout messaging
assert(content.includes('ECONNABORTED'), 'Test 6.1 Failed: ECONNABORTED handling missing');
assert(content.includes('Upload timed out. The video file is large or the network connection is slow.'), 'Test 6.2 Failed: Timeout message missing');
console.log('✓ Test 6 Passed: Actionable timeout error message is in place');

// Test 7: Verify fix for YouTube URL not colliding with uploaded video state
assert(content.includes('const hasUploadedVideo = isExistingUploadedVideo;'), 'Test 7.1 Failed: hasUploadedVideo must derive from isExistingUploadedVideo');
assert(!content.includes('const hasExistingVideo = Boolean(data.patternSourceUrl);'), 'Test 7.2 Failed: Fragile hasExistingVideo = Boolean(...) must not be used');
console.log('✓ Test 7 Passed: YouTube URLs cleanly separated from uploaded video file state');

console.log('\n--- ALL STEPCONTENT VIDEO UI REGRESSION TESTS PASSED ---');
