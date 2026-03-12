import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';
import { UpdateProfileDTO, UpdatePlanDTO } from '../types';
import { toast } from 'sonner';

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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
};

export const useUpdatePlan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdatePlanDTO) => settingsService.updatePlan(data),
        onSuccess: (data) => {
            toast.success(`Successfully upgraded to ${data.plan.toUpperCase()}!`);
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Payment processing failed');
        },
    });
};
