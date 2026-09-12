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

// SEC-06: UpdatePlanDTO removed — no self-service plan mutation surface.
