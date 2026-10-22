export interface Item {
    id: number;
    code: string;
    code_prefix: string;
    name: string;
    category: string;
    category_name: string;
    qty: number;
    minimum_qty: number;
    barcode: string;
    status: string;
    item_type: 'TOOL' | 'CONSUMABLE' | 'MATERIAL';
    brand?: string;
    expiration?: string;
    dimensions?: string;
}

export interface CurrentUser {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'Admin' | 'Membro';
    is_fixed_admin: boolean;
    can_register_items: boolean;
    can_view_logs: boolean;
    can_manage_users: boolean;
}

export interface ItemMovement {
    id: number;
    item: string;
    item_name: string;
    item_code: string;
    item_category_name: string;
    user : string;
    user_name: string;
    action: string;
    action_display: string;
    reason: string;
    reason_display: string;
    quantity: number;
    available_qty: number;
    observations: string;
    date: string;
}

