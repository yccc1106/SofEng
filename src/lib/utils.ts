import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
}

export function formatResponse(success: boolean, message: string, data?: any) {
    return {
        success,
        message,
        data,
    };
}
