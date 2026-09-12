import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';
import { UpdateProfileDTO } from '../types';
import { toast } from 'sonner';

interface RequestErrorShape {
    message?: string;
    response?: { data?: { error?: { message?: string } } };
}

function getErrorMessage(error: RequestErrorShape, fallback: string): string {
    return error?.message || error?.response?.data?.error?.message || fallback;
}

export const useProfile = () => {
    return useQuery({
        queryKey: ['user-profile'],
        queryFn: () => settingsService.getProfile(),
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileDTO) => settingsService.updateProfile(data),
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] }); // Sync with auth hook if any
        },
        onError: (error: RequestErrorShape) => {
            toast.error(getErrorMessage(error, 'Failed to update profile'));
        },
    });
};

// SEC-06: useUpdatePlan removed — plans are read-only in the UI.
