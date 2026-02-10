export type PaymentMethod = "TRANSFER" | "CASH" | "CREDIT_CARD" | "CHECK_CARD"
export type PaymentStatus = "ORDERED" | "RECEIVED" | "COMPLETED" | "CANCELLED"
export type UsageType = "BUSINESS" | "PERSONAL"
export type StatsPeriod = "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR"

export interface PurchaseItem {
    id: string
    purchaseId?: string
    name: string
    quantity: number
    unitPrice: number
    amount: number
    usage: UsageType
    note?: string
    isChecked?: boolean
    discountValue?: number
    discountType?: "UNIT" | "TOTAL"
}

export interface PurchaseRecord {
    id: string
    vendorName: string
    date: string
    totalAmount: number
    paymentMethod: PaymentMethod
    status: PaymentStatus
    items: PurchaseItem[]
}

export interface Vendor {
    id: string
    name: string
    contact?: string
    website?: string
    note?: string
}

export interface Account {
    id: string
    username: string
    name?: string
    createdAt: string
}
