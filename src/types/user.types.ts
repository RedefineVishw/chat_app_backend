export interface RegisterInput {
    email: string;
    password: string;
    userName: string;
    displayName: string;
}


export interface UpdateUserProfile {
    userName?: string;
    displayName?: string;
    about?: string | null;
}

export interface SearchUsersParams {
    query: string;
    page: number;
    limit: number;
    excludeUserId: string;
}