import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting retrospective GST update...');

    // 1. Update all Invoices
    const invoices = await prisma.invoice.findMany({
        where: {
            // Prisma expects this for string fields to assert they exist
            salesOrderId: { not: "" }
        }
    });

    console.log(`Found ${invoices.length} invoices to check...`);

    let updatedInvoicesCount = 0;
    for (const invoice of invoices) {
        // Find the original sales order to get its pre-tax base amount
        const so = await prisma.salesOrder.findUnique({
            where: { id: invoice.salesOrderId! }
        });

        if (so) {
            // Check if the invoice total exactly matches the base pre-tax amount
            // If it does, it means GST was not originally applied when saving to the DB
            if (invoice.totalAmount.equals(so.totalAmount)) {
                // Apply 5% GST
                const amountWithGST = new Prisma.Decimal(so.totalAmount.toNumber() * 1.05);

                const newPending = invoice.status === 'PAID'
                    ? new Prisma.Decimal(0)
                    : amountWithGST.minus(invoice.totalAmount.minus(invoice.pendingAmount)); // Retain amount already paid

                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        totalAmount: amountWithGST,
                        pendingAmount: newPending.lt(0) ? new Prisma.Decimal(0) : newPending
                    }
                });
                console.log(`Updated Invoice ${invoice.id}: ${invoice.totalAmount} -> ${amountWithGST}`);
                updatedInvoicesCount++;
            }
        }
    }

    // 2. Update Transactions linked to Invoices
    const transactions = await prisma.transaction.findMany({
        where: {
            invoiceId: { not: null },
            type: 'CREDIT' // Only update revenue receipts
        },
        include: { invoice: true }
    });

    console.log(`Found ${transactions.length} transactions to check...`);
    let updatedTxCount = 0;

    for (const tx of transactions) {
        if (tx.invoice && tx.invoice.salesOrderId) {
            const so = await prisma.salesOrder.findUnique({
                where: { id: tx.invoice.salesOrderId }
            });

            if (so) {
                // If the transaction amount exactly equals the pre-tax base amount
                // it means the payment was recorded before the GST logic existed
                if (tx.amount.equals(so.totalAmount)) {
                    const amountWithGST = new Prisma.Decimal(so.totalAmount.toNumber() * 1.05);
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { amount: amountWithGST }
                    });
                    console.log(`Updated Transaction ${tx.id}: ${tx.amount} -> ${amountWithGST}`);
                    updatedTxCount++;
                }
            }
        }
    }

    console.log(`\nFinished: Updated ${updatedInvoicesCount} invoices and ${updatedTxCount} transactions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
