export interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
    created: string;
    updated: string;
}

export interface Message {
    id: string;
    text: string;
    user: string;
    expand?: {
        user?: User;
        'reactions(message)'?: any[];
    };
    created: string;
    updated: string;
}
