import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, CheckCircle, AlertCircle, X, RefreshCw, FileVideo, Play } from 'lucide-react';
import { examService } from '../../../api/examService';
import { IMAGE_BASE_URL } from '../../../api/config';

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    const base = IMAGE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
};

const StepContent = ({ data, updateData }) => {
    const fileInputRef = useRef(null);

    // Determine initial mode based on existing data
    const isExistingUploadedVideo = data.videoMetadata?.sourceType === 'upload' ||
        (data.patternSourceUrl && !data.patternSourceUrl.includes('youtube') && !data.patternSourceUrl.includes('youtu.be') &&
            (/\.(mp4|webm|ogg|mov)($|\?)/i.test(data.patternSourceUrl) || data.patternSourceUrl.includes('/exam_videos/') || data.patternSourceUrl.includes('/video/upload/')));

    const [videoMode, setVideoMode] = useState(isExistingUploadedVideo ? 'upload' : 'url');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);

    const handleChange = (e) => {
        updateData(e.target.name, e.target.value);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError('');
        setUploadSuccess(false);

        // Validate extension
        const lowerName = file.name.toLowerCase();
        const hasValidExt = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
        if (!hasValidExt && !file.type.startsWith('video/')) {
            setUploadError('Unsupported format. Please select an MP4, WebM, OGG, or MOV video file.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validate size
        if (file.size > MAX_VIDEO_SIZE_BYTES) {
            setUploadError(`File size (${formatFileSize(file.size)}) exceeds the 100MB limit. Please compress the video before uploading.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const handleUploadVideo = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadError('');
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);

            const result = await examService.uploadExamVideo(formData, (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            if (result.success && result.videoUrl) {
                updateData('patternSourceUrl', result.videoUrl);
                updateData('videoMetadata', result.metadata || {
                    sourceType: 'upload',
                    originalFileName: selectedFile.name,
                    publicId: result.publicId || '',
                    format: result.format || 'mp4',
                    sizeBytes: selectedFile.size,
                    storageProvider: result.storageProvider || 'cloudinary'
                });
                setUploadSuccess(true);
                setSelectedFile(null);
                setIsReplacing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setUploadError(result.message || 'Video upload failed. Please try again.');
            }
        } catch (err) {
            console.error('Video upload error:', err);
            let errorMsg = 'Failed to upload video.';
            if (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'))) {
                errorMsg = 'Upload timed out. The video file is large or the network connection is slow. Please try again or compress the video before uploading.';
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            }
            setUploadError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleClearSelectedFile = () => {
        setSelectedFile(null);
        setUploadError('');
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveCurrentVideo = () => {
        updateData('patternSourceUrl', '');
        updateData('videoMetadata', null);
        setIsReplacing(false);
        setSelectedFile(null);
        setUploadError('');
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderVideoConfig = () => {
        // Only consider it an existing uploaded video if it's actually an uploaded video, NOT a YouTube URL
        const hasUploadedVideo = isExistingUploadedVideo;
        const resolvedVideoUrl = resolveMediaUrl(data.patternSourceUrl);

        return (
            <div className="space-y-4">
                {/* Method Selector: Crystal-clear choice between YouTube URL and Upload Video File */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Video Source Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            id="video-source-youtube-btn"
                            onClick={() => {
                                setVideoMode('url');
                                setUploadError('');
                            }}
                            className={`p-3.5 rounded-lg border-2 flex items-center justify-center gap-2.5 font-semibold text-sm transition-all ${
                                videoMode === 'url'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-opacity-20 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <LinkIcon size={18} className={videoMode === 'url' ? 'text-blue-600' : 'text-gray-400'} />
                            YouTube URL
                        </button>
                        <button
                            type="button"
                            id="video-source-upload-btn"
                            onClick={() => {
                                setVideoMode('upload');
                                setUploadError('');
                            }}
                            className={`p-3.5 rounded-lg border-2 flex items-center justify-center gap-2.5 font-semibold text-sm transition-all ${
                                videoMode === 'upload'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-opacity-20 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Upload size={18} className={videoMode === 'upload' ? 'text-blue-600' : 'text-gray-400'} />
                            Upload video file
                        </button>
                    </div>
                </div>

                {/* OPTION A: YouTube Video Option */}
                {videoMode === 'url' && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700">
                            YouTube Video URL / ID
                        </label>
                        <input
                            type="text"
                            name="patternSourceUrl"
                            id="youtube-video-url-input"
                            value={hasUploadedVideo ? '' : (data.patternSourceUrl || '')}
                            onChange={(e) => {
                                handleChange(e);
                                updateData('videoMetadata', {
                                    sourceType: 'url',
                                    originalFileName: '',
                                    publicId: '',
                                    format: '',
                                    sizeBytes: 0,
                                    storageProvider: 'external'
                                });
                            }}
                            placeholder="https://youtube.com/watch?v=..."
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border bg-white"
                        />
                        <p className="text-xs text-gray-500">
                            Enter a YouTube video URL or ID. Students will view this video in Exam Player.
                        </p>

                        {hasUploadedVideo && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                Note: An uploaded video file is currently stored. Entering a YouTube URL here will switch this exam to YouTube reference content.
                            </p>
                        )}

                        {/* YouTube Preview Badge */}
                        {data.patternSourceUrl && !hasUploadedVideo && (
                            <div className="mt-3">
                                <span className="text-xs font-semibold text-gray-600 block mb-1">Preview:</span>
                                <div className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded border border-blue-200">
                                    YouTube URL detected: will be securely embedded for students in Exam Player.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* OPTION B: Local Video File Upload Option */}
                {videoMode === 'upload' && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {/* Success message */}
                        {uploadSuccess && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                                <CheckCircle size={16} className="shrink-0" />
                                <span>Video uploaded successfully! Playable preview is ready below.</span>
                            </div>
                        )}

                        {/* Error message */}
                        {uploadError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span className="flex-1">{uploadError}</span>
                                <button
                                    type="button"
                                    onClick={() => setUploadError('')}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* State 1: An uploaded video file is already saved and not replacing */}
                        {hasUploadedVideo && !isReplacing ? (
                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                        <FileVideo size={18} className="text-blue-600" />
                                        <span>
                                            {data.videoMetadata?.originalFileName || 'Attached Video File'}
                                        </span>
                                        {data.videoMetadata?.sizeBytes > 0 && (
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                {formatFileSize(data.videoMetadata.sizeBytes)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsReplacing(true)}
                                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 font-medium"
                                        >
                                            <RefreshCw size={12} />
                                            Replace Video
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveCurrentVideo}
                                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 rounded text-red-600 bg-red-50 hover:bg-red-100 font-medium"
                                        >
                                            <X size={12} />
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Playable preview */}
                                <div className="mt-2">
                                    <span className="text-xs font-semibold text-gray-600 block mb-1">Playable Preview:</span>
                                    <video
                                        controls
                                        playsInline
                                        src={resolvedVideoUrl}
                                        className="w-full max-h-60 rounded-md bg-black"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        ) : (
                            /* State 2: No video uploaded yet OR user clicked Replace Video */
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Upload Video File
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Supported format: MP4 (H.264 / AAC recommended). Maximum file size: 100 MB.
                                    </p>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-white">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                                            onChange={handleFileSelect}
                                            disabled={uploading}
                                            className="hidden"
                                            id="video-file-upload-input"
                                        />
                                        <label
                                            htmlFor="video-file-upload-input"
                                            className={`cursor-pointer inline-flex flex-col items-center justify-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                                Click to browse video file
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                MP4 video up to 100 MB
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Selected File Details */}
                                {selectedFile && (
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileVideo size={20} className="text-blue-600 shrink-0" />
                                            <div className="truncate text-sm">
                                                <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                id="start-upload-video-btn"
                                                onClick={handleUploadVideo}
                                                disabled={uploading}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <RefreshCw size={14} className="animate-spin" />
                                                        {uploadProgress >= 100 ? 'Processing Video...' : `Uploading (${uploadProgress}%)`}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={14} />
                                                        Start Upload
                                                    </>
                                                )}
                                            </button>
                                            {!uploading && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelectedFile}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                                    title="Cancel selection"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Upload Progress Bar */}
                                {uploading && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>
                                                {uploadProgress >= 100
                                                    ? 'Processing & cloud-storing video... Please wait...'
                                                    : 'Uploading video...'}
                                            </span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                                    uploadProgress >= 100 ? 'bg-indigo-600 animate-pulse' : 'bg-blue-600'
                                                }`}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 italic">
                                            {uploadProgress >= 100
                                                ? 'File transferred to server. Finalizing cloud encoding and generating playable preview...'
                                                : 'Please do not close this page or submit the form until upload completes.'}
                                        </p>
                                    </div>
                                )}

                                {/* Cancel Replace button if user was replacing an existing video */}
                                {isReplacing && hasUploadedVideo && !uploading && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsReplacing(false);
                                                handleClearSelectedFile();
                                            }}
                                            className="text-xs text-gray-600 hover:text-gray-900 underline"
                                        >
                                            Cancel and keep existing video
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderContentInputs = () => {
        const type = String(data.patternType);

        // 1: Video + MCQ
        if (type === '1') {
            return renderVideoConfig();
        }

        // 2: Story + MCQ
        if (type === '2') {
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Story Text</label>
                    <textarea
                        name="patternSourceUrl"
                        value={data.patternSourceUrl || ''}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Enter the story here..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            );
        }

        // 3: Image + MCQ
        if (type === '3') {
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                        type="text"
                        name="patternSourceUrl"
                        value={data.patternSourceUrl || ''}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Direct upload not integrated yet. Please use hosted URL.</p>
                </div>
            );
        }

        // 4: Direct MCQ, 5: Fill Blanks, 6: Written
        return (
            <div className="text-gray-500 italic">
                No reference content required for this pattern type.
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Reference Content</h3>
            {renderContentInputs()}
        </div>
    );
};

export default StepContent;
