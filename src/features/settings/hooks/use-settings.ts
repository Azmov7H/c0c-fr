import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { settingsService } from '../services/settings.service';
import { UpdateProfileDTO } from '../types';
import { toast } from '@/lib/toast';
import { toApiError } from '@/lib/api-error';
import {
    accountErrorMessage,
    mapAccountError,
} from '@/lib/account-error-map';

export const useProfile = () => {
    return useQuery({
        queryKey: ['user-profile'],
        queryFn: () => settingsService.getProfile(),
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('settings');

    return useMutation({
        mutationFn: (data: UpdateProfileDTO) => settingsService.updateProfile(data),
        onSuccess: () => {
            toast.success(t('toast.updated'));
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] }); // Sync with auth hook if any
        },
        onError: (error) => {
            // AR-028: the API's stable code picks the sentence; the API's own
            // English text only survives as an excerpt for unknown failures.
            const mapped = mapAccountError(
                toApiError(error, t('toast.updateFailed'))
            );
            // `accountErrorMessage` spans the keys both catalogs carry; this
            // surface's catalog does not define billing's `notConfigured`, but
            // it never requests it (no options are passed to the map).
            toast.error(
                accountErrorMessage(
                    t as unknown as Parameters<typeof accountErrorMessage>[0],
                    mapped
                )
            );
        },
    });
};
