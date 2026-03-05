export type MeAddress = {
    country?: string | null;
    cityState?: string | null;
    postalCode?: string | null;
    taxId?: string | null;
};

export type MeSocial = {
    facebook?: string | null;
    x?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
};

export type MeResult = {
    id: string;
    email: string;
    role: string;

    fullName?: string;
    isActive?: boolean;
    avatarUrl?: string | null;

    phone?: string | null;
    bio?: string | null;

    address?: MeAddress;
    social?: MeSocial;
};