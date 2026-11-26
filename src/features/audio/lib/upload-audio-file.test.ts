// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-error';

const mocks = vi.hoisted(() => ({
    signUpload: vi.fn(),
}));

vi.mock('../services/audio.service', () => ({
    audioService: { signUpload: mocks.signUpload },
}));

import { audioFormatOf, uploadAudioFile } from './upload-audio-file';

const signed = {
    cloudName: 'demo-cloud',
    apiKey: 'key-1',
    timestamp: 1_700_000_000,
    signature: 'signature-1',
    folder: 'c0c/p1/soundmail',
    resourceType: 'video' as const,
};

const durableUrl =
    'https://res.cloudinary.com/demo-cloud/video/upload/v1/c0c/p1/soundmail/message.wav';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUpload.mockResolvedValue(signed);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('signed durable audio upload', () => {
    it('uploads real bytes and returns the stored HTTPS asset payload', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ secure_url: durableUrl }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const file = new File(['real-bytes'], 'message.wav', { type: 'audio/wav' });
        const result = await uploadAudioFile({ projectId: 'p1', file });

        expect(result).toEqual({
            projectId: 'p1',
            assetType: 'soundmail',
            fileUrl: durableUrl,
            fileSize: file.size,
            format: 'wav',
            source: 'uploaded',
        });

        const [endpoint, init] = fetchMock.mock.calls[0] as [string, { body: FormData }];
        expect(endpoint).toBe('https://api.cloudinary.com/v1_1/demo-cloud/video/upload');
        expect(init.body.get('signature')).toBe(signed.signature);
        expect(init.body.get('folder')).toBe(signed.folder);
        expect(init.body.get('resource_type')).toBe('video');
        // FormData clones the File, so compare its durable payload metadata.
        expect(init.body.get('file')).toMatchObject({
            name: 'message.wav',
            size: file.size,
        });
    });

    it('maps the file MIME type to a stored audio format', () => {
        expect(audioFormatOf('audio/wav')).toBe('wav');
        expect(audioFormatOf('audio/ogg')).toBe('ogg');
        expect(audioFormatOf('audio/mp4')).toBe('m4a');
        expect(audioFormatOf('audio/mpeg')).toBe('mp3');
    });

    it('refuses an invalid storage response instead of persisting a fake URL', async () => {
        mocks.signUpload.mockResolvedValue({ ...signed, cloudName: 'not/a/host' });
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await expect(
            uploadAudioFile({ projectId: 'p1', file: new File(['x'], 'a.mp3', { type: 'audio/mpeg' }) })
        ).rejects.toMatchObject({ code: 'STORAGE_INVALID_RESPONSE' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces Cloudinary failures as typed API errors', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({ error: { message: 'Invalid signature' } }),
            })
        );

        const error = await uploadAudioFile({
            projectId: 'p1',
            file: new File(['x'], 'a.mp3', { type: 'audio/mpeg' }),
        }).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ code: 'AUDIO_UPLOAD_FAILED', status: 400 });
        expect((error as Error).message).toBe('Invalid signature');
    });
});
