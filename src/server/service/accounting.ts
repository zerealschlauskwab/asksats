import { AskKind, PrismaClient } from '@prisma/client'
import { differenceInSeconds, sub } from 'date-fns'
import {
    BUMP_PUBLIC_MIN_BUMP_FACTOR,
    GLOBAL_MIN_BUMP_SATS,
    INVOICE_LIMIT,
    MSATS_UNIT_FACTOR,
    TRANSACTION_FREQUENCY_SECONDS_LIMIT,
    TRANSACTION_MAX_AGE,
} from '~/server/service/constants'
import { ACTIVE_SELECT, PENDING_ACCEPTANCE_SELECT, SETTLED_SELECT } from '~/server/service/selects'

const THE_BANK = 0.1
const PAYOUT_FACTOR = 1 - THE_BANK

export const userBalance = async (prisma: PrismaClient, userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { transaction: { where: { transactionStatus: 'SETTLED' } } },
    })

    const settledBumpsToPay = await prisma.bump.findMany({
        where: {
            AND: [
                { bidder: { id: userId } },
                {
                    ask: SETTLED_SELECT,
                },
            ],
        },
        include: { ask: true },
    })

    const settledOffersToReceive = await prisma.offer.findMany({
        where: {
            AND: [
                { author: { id: userId } },
                {
                    ask: SETTLED_SELECT,
                },
            ],
        },
        include: { ask: { include: { bumps: true } } },
    })

    const lockedBumpsToPay = await prisma.bump.findMany({
        where: {
            AND: [
                { bidder: { id: userId } },
                {
                    OR: [{ ask: PENDING_ACCEPTANCE_SELECT }, { ask: ACTIVE_SELECT }],
                },
            ],
        },
        include: { ask: { include: { bumps: true } } },
    })

    const settledBumpsToPaySum = settledBumpsToPay.reduce((acc, bump) => acc + bump.amount, 0)

    const settledOffersToReceiveSum =
        settledOffersToReceive.reduce((acc, offer) => {
            const awardedAsk = offer.ask
            const sum = awardedAsk?.bumps.reduce((accBump, bump) => accBump + bump.amount, 0)
            return acc + (sum ?? 0)
        }, 0) * PAYOUT_FACTOR

    const lockedBumpsToPaySum = lockedBumpsToPay.reduce((acc, bump) => acc + bump.amount, 0)

    const transactionSum =
        user?.transaction.reduce((acc, cur) => {
            if (cur.mSatsSettled) {
                const transactionValue = {
                    INVOICE: cur.mSatsSettled,
                    WITHDRAWAL: -cur.mSatsSettled,
                }[cur.transactionKind]
                return acc + transactionValue / MSATS_UNIT_FACTOR
            }
            return acc
        }, 0) ?? 0

    return {
        availableBalance: transactionSum + settledOffersToReceiveSum - settledBumpsToPaySum - lockedBumpsToPaySum,
        lockedBalance: lockedBumpsToPaySum,
    }
}

export const belowInvoiceLimit = async (prisma: PrismaClient, userId: string) => {
    const count = await prisma.transaction.count({
        where: {
            userId,
            transactionKind: 'INVOICE',
            transactionStatus: { not: 'SETTLED' },
            createdAt: { gt: sub(new Date(), { seconds: TRANSACTION_MAX_AGE }) },
        },
    })

    return count < INVOICE_LIMIT
}

export const recentSettledTransaction = async (
    prisma: PrismaClient,
    userId: string,
    transactionKind: 'INVOICE' | 'WITHDRAWAL',
) => {
    return prisma.transaction
        .findMany({
            where: {
                userId,
                transactionKind: transactionKind,
                transactionStatus: 'SETTLED',
            },
            orderBy: {
                createdAt: 'desc',
            },
        })
        .then((transactions) => {
            const lastTransaction = transactions[0]
            return lastTransaction
                ? differenceInSeconds(lastTransaction.updatedAt, new Date()) < TRANSACTION_FREQUENCY_SECONDS_LIMIT
                : false
        })
}

export const minBumpForAsk = (sum: number, askKind: AskKind) => {
    return {
        PUBLIC: GLOBAL_MIN_BUMP_SATS,
        PRIVATE: GLOBAL_MIN_BUMP_SATS,
        BUMP_PUBLIC: sum * BUMP_PUBLIC_MIN_BUMP_FACTOR,
    }[askKind]
}