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

export interface ItemMovement {
    id: number;
    item: string;
    item_name: string;
    item_code: string;
    item_category_name: string;
    user : string;
    user_name: string;
    type: string;
    type_display: string;
    reason: string;
    reason_display: string;
    quantity: number;
    observations: string;
    date: string;
}

