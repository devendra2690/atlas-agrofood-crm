import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format, isBefore, isToday, addDays, startOfDay } from 'date-fns';

// Register a standard font
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Inter',
        backgroundColor: '#ffffff'
    },
    header: {
        marginBottom: 30,
        borderBottom: '1 solid #e5e7eb',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8
    },
    metaText: {
        fontSize: 10,
        color: '#6b7280'
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        backgroundColor: '#f3f4f6',
        padding: 5,
        color: '#374151'
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableHeaderRow: {
        backgroundColor: '#f9fafb'
    },
    tableCol1: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 0, borderTopWidth: 0 },
    tableCol2: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 0, borderTopWidth: 0 },
    tableCol3: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 0, borderTopWidth: 0 },
    tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 'bold', color: '#374151' },
    tableCell: { margin: 5, fontSize: 9, color: '#4b5563' },
    summary: { marginTop: 30, paddingTop: 10, borderTop: '1 solid #e5e7eb' },
    summaryText: { fontSize: 10, color: '#4b5563', marginBottom: 4 },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', fontSize: 8, borderTop: '1 solid #e5e7eb', paddingTop: 10 }
});

interface Task {
    id: string;
    content: string;
    dueDate: string | Date;
    assignedTo?: { name: string | null } | null;
}

interface TaskListPDFProps {
    tasks: Task[];
}

export function TaskListPDF({ tasks }: TaskListPDFProps) {
    const today = startOfDay(new Date());
    const nearDueThreshold = addDays(today, 3);

    const overdueTasks = tasks.filter(t => t.dueDate && isBefore(startOfDay(new Date(t.dueDate)), today));
    const todayTasks = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
    const nearDueTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = startOfDay(new Date(t.dueDate));
        return isBefore(today, dueDate) && (isBefore(dueDate, nearDueThreshold) || dueDate.getTime() === nearDueThreshold.getTime());
    });

    const renderTable = (taskGroup: Task[], title: string) => {
        if (taskGroup.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title} ({taskGroup.length})</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                        <View style={styles.tableCol1}><Text style={styles.tableCellHeader}>Task Description</Text></View>
                        <View style={styles.tableCol2}><Text style={styles.tableCellHeader}>Due Date</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCellHeader}>Assigned To</Text></View>
                    </View>
                    {taskGroup.map((task) => (
                        <View style={styles.tableRow} key={task.id}>
                            <View style={styles.tableCol1}>
                                <Text style={styles.tableCell}>{task.content.length > 80 ? `${task.content.substring(0, 80)}...` : task.content}</Text>
                            </View>
                            <View style={styles.tableCol2}>
                                <Text style={styles.tableCell}>{format(new Date(task.dueDate), "MMM d, yyyy")}</Text>
                            </View>
                            <View style={styles.tableCol3}>
                                <Text style={styles.tableCell}>{task.assignedTo?.name || "Unassigned"}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Pending Task Report</Text>
                    <Text style={styles.metaText}>Generated on: {format(new Date(), "PPp")}</Text>
                </View>

                {renderTable(overdueTasks, "Past Due Date")}
                {renderTable(todayTasks, "Due Today")}
                {renderTable(nearDueTasks, "Near Due (Next 3 Days)")}

                {overdueTasks.length === 0 && todayTasks.length === 0 && nearDueTasks.length === 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>No pending tasks in these categories.</Text>
                    </View>
                )}

                <View style={styles.summary}>
                    <Text style={styles.summaryText}>Total Overdue: {overdueTasks.length}</Text>
                    <Text style={styles.summaryText}>Total Due Today: {todayTasks.length}</Text>
                    <Text style={styles.summaryText}>Total Near Due: {nearDueTasks.length}</Text>
                </View>

                <View style={styles.footer}>
                    <Text>Atlas AgroFood CRM - Task Report - Page 1</Text>
                </View>
            </Page>
        </Document>
    );
}
