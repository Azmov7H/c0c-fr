export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    plan: 'starter' | 'pro' | 'studio';
    role: 'user' | 'admin';
    createdAt: string;
}

export interface UpdateProfileDTO {
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface UpdatePlanDTO {
    plan: 'starter' | 'pro' | 'studio';
}
