import { ApiError } from '@/lib/api-error';
import { audioService } from '../services/audio.service';
import type { AudioAssetFormat, AudioUploadFileDTO, UploadAudioDTO } from '../types';

export const audioFormatOf = (mimeType: string): AudioAssetFormat => {
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'm4a';
    return 'mp3';
};

interface CloudinaryUploadResponse {
    secure_url?: unknown;
    error?: { message?: unknown };
}

/**
 * A6-M: replace `URL.createObjectURL(file)` with a durable Cloudinary URL.
 * The API signs the upload (including the folder and resource type); the browser
 * sends the bytes straight to Cloudinary, then records the returned HTTPS URL
 * through the existing audio upload endpoint. No provider call is faked here.
 */
export async function uploadAudioFile({
    projectId,
    file,
    assetType = 'soundmail',
}: AudioUploadFileDTO): Promise<UploadAudioDTO> {
    const signed = await audioService.signUpload({ projectId, assetType });
    if (!/^[A-Za-z0-9_-]+$/.test(signed.cloudName)) {
        throw new ApiError({
            code: 'STORAGE_INVALID_RESPONSE',
            message: 'The audio storage response contained an invalid cloud name.',
        });
    }

    const form = new FormData();
    form.append('api_key', signed.apiKey);
    form.append('timestamp', String(signed.timestamp));
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);
    form.append('resource_type', signed.resourceType);
    if (signed.publicId) form.append('public_id', signed.publicId);
    form.append('file', file, file.name || `audio.${audioFormatOf(file.type)}`);

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/${signed.resourceType}/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    let body: CloudinaryUploadResponse = {};
    try {
        body = (await response.json()) as CloudinaryUploadResponse;
    } catch {
        // The HTTP status still carries the failure when the body is not JSON.
    }
    if (!response.ok) {
        const message = typeof body.error?.message === 'string' ? body.error.message : response.statusText;
        throw new ApiError({ code: 'AUDIO_UPLOAD_FAILED', message, status: response.status });
    }

    const fileUrl = body.secure_url;
    if (typeof fileUrl !== 'string' || !fileUrl.startsWith('https://res.cloudinary.com/')) {
        throw new ApiError({
            code: 'STORAGE_INVALID_RESPONSE',
            message: 'The audio storage response did not include a playable Cloudinary URL.',
        });
    }

    return {
        projectId,
        assetType,
        fileUrl,
        fileSize: file.size,
        format: audioFormatOf(file.type),
        source: 'uploaded',
    };
}
