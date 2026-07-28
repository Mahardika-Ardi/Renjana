export declare const capitalize: (str: string) => string;
export declare const slugify: (str: string) => string;
export declare const formatDate: (date: Date | string, locale?: string) => string;
export declare const getISOWeek: (date: Date) => {
    week: number;
    year: number;
};
export declare const daysBetween: (a: Date, b: Date) => number;
export declare const isValidEmail: (email: string) => boolean;
export declare const isStrongPassword: (password: string) => boolean;
export declare const clamp: (value: number, min: number, max: number) => number;
export declare const average: (numbers: number[]) => number;
export declare const percentage: (value: number, total: number) => number;
export declare const generateInviteToken: () => string;
