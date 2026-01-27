import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233', // Dark slate
    },
    invoiceTitle: {
        fontSize: 20,
        textTransform: 'uppercase',
        color: '#64748b',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        color: '#1e293b',
    },
    billTo: {
        marginTop: 20,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
    },
    table: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 8,
    },
    colDescription: { width: '50%' },
    colQty: { width: '15%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    totalSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: '40%',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    grandTotal: {
        borderTopWidth: 2,
        borderTopColor: '#112233',
        marginTop: 4,
        paddingTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    }
});

interface InvoicePDFProps {
    invoice: {
        id: string;
        createdAt: Date;
        dueDate: Date | null;
        totalAmount: number;
        status: string;
        salesOrder: {
            client: {
                name: string;
                email?: string;
                address?: string; // Assuming we might have this
            };
            opportunity: {
                productName: string;
                quantity: number | null;
                targetPrice: number | null;
            };
        };
    };
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
    const invoiceDate = format(new Date(invoice.createdAt), 'dd MMM yyyy');
    const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : 'N/A';
    const shortId = invoice.id.slice(0, 8).toUpperCase();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>AtlasAgro</Text>
                        <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Premium Agricultural Trading</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={{ fontSize: 10, marginTop: 4 }}>#{shortId}</Text>
                        <Text style={{ fontSize: 10, marginTop: 2, color: invoice.status === 'PAID' ? '#10b981' : '#f43f5e' }}>
                            {invoice.status}
                        </Text>
                    </View>
                </View>

                {/* Dates */}
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Invoice Date</Text>
                        <Text style={styles.value}>{invoiceDate}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Due Date</Text>
                        <Text style={styles.value}>{dueDate}</Text>
                    </View>
                </View>

                {/* Bill To */}
                <View style={styles.billTo}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>Bill To:</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{invoice.salesOrder.client.name}</Text>
                    {invoice.salesOrder.client.email && (
                        <Text style={styles.value}>{invoice.salesOrder.client.email}</Text>
                    )}
                </View>

                {/* Line Items */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.label, styles.colDescription]}>Description</Text>
                        <Text style={[styles.label, styles.colQty]}>Qty</Text>
                        <Text style={[styles.label, styles.colPrice]}>Price</Text>
                        <Text style={[styles.label, styles.colTotal]}>Amount</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={[styles.value, styles.colDescription]}>
                            {invoice.salesOrder.opportunity.productName}
                        </Text>
                        <Text style={[styles.value, styles.colQty]}>
                            {invoice.salesOrder.opportunity.quantity || 1}
                        </Text>
                        <Text style={[styles.value, styles.colPrice]}>
                            {invoice.salesOrder.opportunity.targetPrice?.toLocaleString() || '-'}
                        </Text>
                        <Text style={[styles.value, styles.colTotal]}>
                            {invoice.totalAmount.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalSection}>
                    <View style={{ width: '100%' }}>
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Subtotal</Text>
                            <Text style={styles.value}>{invoice.totalAmount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Tax (0%)</Text>
                            <Text style={styles.value}>0</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={[styles.value, { fontWeight: 'bold' }]}>Total</Text>
                            <Text style={[styles.value, { fontWeight: 'bold', fontSize: 14 }]}>
                                ₹{invoice.totalAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Thank you for your business. Please make checks payable to Atlas Agrofood.
                </Text>
            </Page>
        </Document>
    );
}
