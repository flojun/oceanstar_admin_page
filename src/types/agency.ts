export interface Agency {
    id: string;
    name: string;
    login_id: string;
    password?: string; // Omitted on client side for security typically
    created_at: string;
}

export type AgencyInsert = Omit<Agency, 'id' | 'created_at'>;
export type AgencyUpdate = Partial<AgencyInsert>;

export interface AgencyNotification {
    id: string;
    agency_id: string;
    reservation_id: string | null;
    action: 'CREATED' | 'UPDATED' | 'CANCELLED';
    message: string;
    is_read: boolean;
    created_at: string;
}

export type AgencyNotificationInsert = Omit<AgencyNotification, 'id' | 'created_at'>;
