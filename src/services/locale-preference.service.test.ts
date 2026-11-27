import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '@/services/api-client';
import { localePreferenceService } from './locale-preference.service';

vi.mock('@/services/api-client', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

const get = vi.mocked(apiClient.get);
const patch = vi.mocked(apiClient.patch);

describe('localePreferenceService (AR-039)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reads the effective locale from the AR-036 envelope', async () => {
        get.mockResolvedValueOnce({ data: { data: { locale: 'ar' } } } as never);

        await expect(localePreferenceService.get()).resolves.toBe('ar');
        expect(get).toHaveBeenCalledWith('/users/profile/preferences/locale');
    });

    it('rejects a malformed envelope instead of inventing a default', async () => {
        get.mockResolvedValueOnce({ data: { data: { locale: 'fr' } } } as never);

        await expect(localePreferenceService.get()).rejects.toThrow('Invalid locale preference');
    });

    it('PATCHes only the locale key and returns the effective value', async () => {
        patch.mockResolvedValueOnce({ data: { data: { locale: 'ar' } } } as never);

        await expect(localePreferenceService.update('ar')).resolves.toBe('ar');
        expect(patch).toHaveBeenCalledWith('/users/profile/preferences/locale', { locale: 'ar' });
    });

    it('surfaces a rejected PATCH to the caller', async () => {
        patch.mockRejectedValueOnce(new Error('network down'));

        await expect(localePreferenceService.update('en')).rejects.toThrow('network down');
    });
});
