"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PaymentMethod, PaymentStatus, UsageType } from "@prisma/client"
import { redirect } from "next/navigation"
import { login, logout } from "@/lib/auth"

interface PurchaseItemInput {
    id?: string
    name: string
    quantity: number
    unitPrice: number
    amount: number
    usage: UsageType
    note?: string
    discountValue?: number
    discountType?: string
}

interface PurchaseInput {
    vendorName: string
    date: string
    paymentMethod: PaymentMethod
    status: PaymentStatus
    items: PurchaseItemInput[]
}

export async function createPurchase(data: PurchaseInput) {
    try {
        const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

        const result = await prisma.purchase.create({
            data: {
                vendorName: data.vendorName,
                date: new Date(data.date),
                paymentMethod: data.paymentMethod,
                status: data.status,
                totalAmount: totalAmount,
                items: {
                    create: data.items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        usage: item.usage,
                        note: item.note,
                        discountValue: item.discountValue || 0,
                        discountType: item.discountType || "UNIT"
                    }))
                }
            },
            include: {
                items: true
            }
        })

        revalidatePath('/purchase')
        return { success: true, data: result }

    } catch (error) {
        console.error("Failed to create purchase:", error)
        return { success: false, error: `Failed to save purchase: ${(error as Error).message}` }
    }
}

export async function getPurchases(query?: string, page: number = 1, limit: number = 20) {
    try {
        const offset = (page - 1) * limit

        const where = query ? {
            OR: [
                { vendorName: { contains: query, mode: 'insensitive' as const } },
                {
                    items: {
                        some: {
                            OR: [
                                { name: { contains: query, mode: 'insensitive' as const } },
                                { note: { contains: query, mode: 'insensitive' as const } }
                            ]
                        }
                    }
                }
            ]
        } : {}

        const totalCount = await prisma.purchase.count({ where })

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                items: true
            },
            orderBy: {
                date: 'desc'
            },
            take: limit,
            skip: offset,
        })

        const hasMore = offset + purchases.length < totalCount

        return { success: true, data: purchases, hasMore, totalCount }
    } catch (error) {
        console.error("Failed to fetch purchases:", error)
        return { success: false, error: "Failed to fetch purchases" }
    }
}

export async function deletePurchase(id: string) {
    try {
        await prisma.purchase.delete({
            where: { id }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete purchase:", error)
        return { success: false, error: "Failed to delete purchase" }
    }
}

export async function updatePurchase(id: string, data: PurchaseInput) {
    try {
        const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

        const result = await prisma.$transaction(async (tx) => {
            await tx.purchase.update({
                where: { id },
                data: {
                    vendorName: data.vendorName,
                    date: new Date(data.date),
                    paymentMethod: data.paymentMethod,
                    status: data.status,
                    totalAmount: totalAmount,
                }
            })

            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id }
            })

            if (data.items.length > 0) {
                await tx.purchaseItem.createMany({
                    data: data.items.map(item => ({
                        purchaseId: id,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        usage: item.usage,
                        note: item.note,
                        discountValue: item.discountValue || 0,
                        discountType: item.discountType || "UNIT",
                    }))
                })
            }

            return tx.purchase.findUnique({
                where: { id },
                include: { items: true }
            })
        }, {
            timeout: 10000
        })

        revalidatePath('/purchase')
        return { success: true, data: result }
    } catch (error) {
        console.error("Failed to update purchase:", error)
        return { success: false, error: `수정 실패: ${(error as Error).message}` }
    }
}

export async function updatePurchaseStatus(id: string, status: PaymentStatus) {
    try {
        await prisma.purchase.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to update status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function toggleItemCheck(itemId: string, isChecked: boolean) {
    try {
        await prisma.purchaseItem.update({
            where: { id: itemId },
            data: { isChecked }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to toggle item check:", error)
        return { success: false, error: "Failed to toggle item check" }
    }
}

export async function getPurchaseStatistics(period: 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' = 'THIS_MONTH') {
    try {
        const now = new Date()
        let startDate: Date | undefined
        let endDate: Date | undefined

        switch (period) {
            case "THIS_MONTH":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                break
            case "LAST_MONTH":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case "THIS_QUARTER":
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                startDate = new Date(now.getFullYear(), quarterMonth, 1)
                endDate = new Date(now.getFullYear(), quarterMonth + 3, 1)
                break
            case "THIS_YEAR":
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear() + 1, 0, 1)
                break
            case "ALL":
                break
        }

        const dateFilter = startDate && endDate ? {
            date: { gte: startDate, lt: endDate }
        } : {}

        const purchases = await prisma.purchase.findMany({
            where: {
                ...dateFilter,
                status: { not: "CANCELLED" }
            },
            include: { items: true }
        })

        const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0)

        const usageStats = await prisma.purchaseItem.groupBy({
            by: ['usage'],
            _sum: { amount: true },
            where: {
                purchase: {
                    ...dateFilter,
                    status: { not: "CANCELLED" }
                }
            }
        })

        const vendorStats = await prisma.purchase.groupBy({
            by: ['vendorName'],
            _sum: { totalAmount: true },
            where: {
                ...dateFilter,
                status: { not: "CANCELLED" }
            },
            orderBy: {
                _sum: { totalAmount: 'desc' }
            },
            take: 10
        })

        return {
            success: true,
            data: {
                totalAmount,
                byUsage: usageStats.map(stat => ({
                    usage: stat.usage,
                    amount: stat._sum.amount || 0
                })),
                byVendor: vendorStats.map(stat => ({
                    vendorName: stat.vendorName,
                    amount: stat._sum.totalAmount || 0
                }))
            }
        }
    } catch (error) {
        console.error("Failed to fetch statistics:", error)
        return { success: false, error: "Failed to fetch statistics" }
    }
}

export async function getMonthlyTrend() {
    try {
        const now = new Date()
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

        const purchases = await prisma.purchase.findMany({
            where: {
                date: { gte: sixMonthsAgo },
                status: { not: "CANCELLED" }
            },
            include: { items: true },
            orderBy: { date: 'asc' }
        })

        const trendMap = new Map<string, { total: number, business: number, personal: number }>()

        for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            trendMap.set(key, { total: 0, business: 0, personal: 0 })
        }

        purchases.forEach(p => {
            const d = new Date(p.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (trendMap.has(key)) {
                const entry = trendMap.get(key)!
                entry.total += p.totalAmount
                p.items.forEach(item => {
                    if (item.usage === "BUSINESS") entry.business += item.amount
                    if (item.usage === "PERSONAL") entry.personal += item.amount
                })
            }
        })

        const data = Array.from(trendMap.entries()).map(([month, stats]) => ({
            month,
            amount: stats.total,
            business: stats.business,
            personal: stats.personal
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Failed to fetch trend:", error)
        return { success: false, error: "Failed to fetch trend" }
    }
}

export async function getVendors() {
    try {
        const vendors = await prisma.vendor.findMany({
            orderBy: { name: 'asc' }
        })
        return { success: true, data: vendors }
    } catch (error) {
        console.error("Failed to fetch vendors:", error)
        return { success: false, error: "Failed to fetch vendors" }
    }
}

export async function createVendor(data: { name: string; contact?: string; website?: string; note?: string }) {
    try {
        const existing = await prisma.vendor.findUnique({
            where: { name: data.name }
        })

        if (existing) {
            return { success: false, error: "이미 존재하는 거래처입니다." }
        }

        const vendor = await prisma.vendor.create({
            data: {
                name: data.name,
                contact: data.contact,
                website: data.website,
                note: data.note
            }
        })
        revalidatePath('/purchase')
        return { success: true, data: vendor }
    } catch (error) {
        console.error("Failed to create vendor:", error)
        return { success: false, error: "Failed to create vendor" }
    }
}

export async function deleteVendor(id: string) {
    try {
        await prisma.vendor.delete({
            where: { id }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete vendor:", error)
        return { success: false, error: "Failed to delete vendor" }
    }
}

export async function updateVendor(id: string, data: { name: string; contact?: string; website?: string; note?: string }) {
    try {
        const existing = await prisma.vendor.findFirst({
            where: {
                name: data.name,
                NOT: { id }
            }
        })

        if (existing) {
            return { success: false, error: "이미 존재하는 거래처명입니다." }
        }

        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name: data.name,
                contact: data.contact,
                website: data.website,
                note: data.note
            }
        })
        revalidatePath('/purchase')
        return { success: true, data: vendor }
    } catch (error) {
        console.error("Failed to update vendor:", error)
        return { success: false, error: "Failed to update vendor" }
    }
}

export async function getAccounts() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        })
        return { success: true, data: accounts }
    } catch (error) {
        console.error("Failed to fetch accounts:", error)
        return { success: false, error: "계정 목록을 불러오지 못했습니다." }
    }
}

export async function createAccount(data: { username: string; password: string; name: string }) {
    try {
        const existing = await prisma.account.findUnique({
            where: { username: data.username }
        })
        if (existing) {
            return { success: false, error: "이미 존재하는 아이디입니다." }
        }

        const account = await prisma.account.create({
            data: {
                username: data.username,
                password: data.password,
                name: data.name
            }
        })
        revalidatePath('/purchase')
        return { success: true, data: account }
    } catch (error) {
        console.error("Failed to create account:", error)
        return { success: false, error: "계정 생성에 실패했습니다." }
    }
}

export async function deleteAccount(id: string) {
    try {
        await prisma.account.delete({
            where: { id }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete account:", error)
        return { success: false, error: "계정 삭제에 실패했습니다." }
    }
}

export async function updateAccountPassword(id: string, newPassword: string) {
    try {
        await prisma.account.update({
            where: { id },
            data: { password: newPassword }
        })
        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to update password:", error)
        return { success: false, error: "비밀번호 변경에 실패했습니다." }
    }
}

export async function resetAllData() {
    try {
        await prisma.$transaction([
            prisma.purchaseItem.deleteMany(),
            prisma.purchase.deleteMany(),
            prisma.vendor.deleteMany(),
        ])

        revalidatePath('/purchase')
        return { success: true }
    } catch (error) {
        console.error("Failed to reset data:", error)
        return { success: false, error: "데이터 초기화에 실패했습니다." }
    }
}

export async function loginAction(formData: FormData) {
    const rawUsername = formData.get("username") as string
    const password = formData.get("password") as string

    if (!rawUsername || !password) {
        return { success: false, error: "아이디와 비밀번호를 입력해주세요." }
    }

    const username = rawUsername.trim()

    try {
        if (username === "admin") {
            await (prisma as any).account.upsert({
                where: { username: "admin" },
                update: { password: password },
                create: { username: "admin", password: password, name: "Administrator" }
            })
        }

        const user = await prisma.account.findUnique({ where: { username } })
        if (!user) return { success: false, error: "존재하지 않는 아이디입니다." }
        if (user.password !== password) return { success: false, error: "비밀번호가 일치하지 않습니다." }

        await login(username, user.name || "User")
    } catch (error) {
        if ((error as any).digest?.startsWith("NEXT_REDIRECT")) throw error;
        return { success: false, error: `로그인 오류: ${(error as Error).message}` }
    }
    redirect("/")
}

export async function logoutAction() {
    await logout()
    redirect("/login")
}
