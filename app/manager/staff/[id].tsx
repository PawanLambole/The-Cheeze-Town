import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, CheckCircle, DollarSign, Wallet, CreditCard, Plus, X } from 'lucide-react-native';

interface SalaryRecord {
    id: string;
    date: string;
    amount: number;
    type: 'salary' | 'advance';
    method: 'cash' | 'online';
    note?: string;
}

interface StaffMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: 'approved' | 'pending';
    joinDate: string;
}

// Mock data - in production, this would come from a database/API
const mockStaffData: Record<string, StaffMember & {
    address?: string;
    emergencyContact?: string;
    salary?: string;
    shifts?: { day: string; time: string }[];
    salaryHistory?: SalaryRecord[];
}> = {
    '1': {
        id: '1',
        name: 'John Doe',
        email: 'john@cheezetown.com',
        phone: '+91 98765 43210',
        role: 'manager',
        status: 'approved',
        joinDate: 'Jan 2024',
        address: '123 Main Street, Mumbai, Maharashtra',
        emergencyContact: '+91 98765 00000',
        salary: '₹45,000/month',
        shifts: [
            { day: 'Mon-Fri', time: '9:00 AM - 6:00 PM' },
            { day: 'Sat', time: '10:00 AM - 4:00 PM' },
        ],
        salaryHistory: [
            { id: '1', date: '2025-12-01', amount: 45000, type: 'salary', method: 'online', note: 'November Salary' },
            { id: '2', date: '2025-12-15', amount: 5000, type: 'advance', method: 'cash', note: 'Emergency advance' },
        ],
    },
    '2': {
        id: '2',
        name: 'Sarah Wilson',
        email: 'sarah@cheezetown.com',
        phone: '+91 98765 43211',
        role: 'chef',
        status: 'approved',
        joinDate: 'Feb 2024',
        address: '456 Park Avenue, Mumbai, Maharashtra',
        emergencyContact: '+91 98765 11111',
        salary: '₹35,000/month',
        shifts: [
            { day: 'Mon-Sat', time: '11:00 AM - 8:00 PM' },
        ],
    },
    '3': {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@cheezetown.com',
        phone: '+91 98765 43212',
        role: 'waiter',
        status: 'approved',
        joinDate: 'Mar 2024',
        address: '789 Lake Road, Mumbai, Maharashtra',
        emergencyContact: '+91 98765 22222',
        salary: '₹25,000/month',
        shifts: [
            { day: 'Mon-Sun', time: '12:00 PM - 9:00 PM' },
        ],
    },
    '4': {
        id: '4',
        name: 'Emily Brown',
        email: 'emily@cheezetown.com',
        phone: '+91 98765 43213',
        role: 'cashier',
        status: 'approved',
        joinDate: 'Mar 2024',
        address: '321 Beach Street, Mumbai, Maharashtra',
        emergencyContact: '+91 98765 33333',
        salary: '₹28,000/month',
        shifts: [
            { day: 'Tue-Sun', time: '10:00 AM - 7:00 PM' },
        ],
    },
};

interface StaffDetailsScreenProps {
    isOwner?: boolean;
}

export default function StaffDetailsScreen({ isOwner }: StaffDetailsScreenProps) {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isOwnerView = isOwner ?? false;
    const staff = mockStaffData[id || '1'];

    // State for salary management
    const [records, setRecords] = useState<SalaryRecord[]>(staff?.salaryHistory || []);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'salary' | 'advance'>('salary');
    const [method, setMethod] = useState<'cash' | 'online'>('cash');
    const [note, setNote] = useState('');

    // Calculate financial summary
    const parseSalary = (salaryStr?: string) => {
        if (!salaryStr) return 0;
        // Remove non-numeric characters except decimal point
        const numStr = salaryStr.replace(/[^0-9.]/g, '');
        return parseFloat(numStr) || 0;
    };

    const baseSalary = parseSalary(staff?.salary);
    const totalAdvance = records
        .filter(r => r.type === 'advance')
        .reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = records
        .filter(r => r.type === 'salary')
        .reduce((sum, r) => sum + r.amount, 0);

    // Remaining is Base - Advance. 
    // Note: If full salary is paid, it should handle that logic. 
    // For now: Remaining = Base - Advance - Paid (if paid as 'salary')
    const remainingPayable = Math.max(0, baseSalary - totalAdvance - totalPaid);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.push(isOwnerView ? '/owner' : '/manager/staff');
        }
    };

    const handleAddPayment = () => {
        if (!amount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        const newRecord: SalaryRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            amount: parseFloat(amount),
            type,
            method,
            note,
        };

        setRecords([newRecord, ...records]);
        setShowPaymentModal(false);
        setAmount('');
        setNote('');
        Alert.alert('Success', 'Payment recorded successfully');
    };

    if (!staff) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack}>
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Staff Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Staff member not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'manager': return '#3B82F6';
            case 'chef': return '#F59E0B';
            case 'waiter': return '#10B981';
            case 'cashier': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'salary'>('overview');

    // ... (existing helper functions)

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Staff Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Compact Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarContainer}>
                            <User size={32} color="#FFFFFF" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{staff.name}</Text>
                            <View style={styles.roleContainer}>
                                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(staff.role) }]}>
                                    <Text style={styles.roleText}>{staff.role.toUpperCase()}</Text>
                                </View>
                                <View style={[styles.statusDot, { backgroundColor: staff.status === 'approved' ? '#10B981' : '#F59E0B' }]} />
                                <Text style={styles.statusText}>{staff.status === 'approved' ? 'Active' : 'Pending'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tab Navigation - Only visible if Owner */}
                {isOwnerView && (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
                            onPress={() => setActiveTab('overview')}
                        >
                            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'salary' && styles.tabButtonActive]}
                            onPress={() => setActiveTab('salary')}
                        >
                            <Text style={[styles.tabText, activeTab === 'salary' && styles.tabTextActive]}>Salary & Payments</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Overview Tab Content */}
                {(activeTab === 'overview' || !isOwnerView) && (
                    <>
                        {/* Contact Information */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact Information</Text>
                            <View style={styles.infoCard}>
                                <View style={styles.infoRow}>
                                    <Mail size={20} color="#6B7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{staff.email}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Phone size={20} color="#6B7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Phone</Text>
                                        <Text style={styles.infoValue}>{staff.phone}</Text>
                                    </View>
                                </View>
                                {staff.address && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <User size={20} color="#6B7280" />
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Address</Text>
                                                <Text style={styles.infoValue}>{staff.address}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                                {staff.emergencyContact && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <Phone size={20} color="#6B7280" />
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Emergency Contact</Text>
                                                <Text style={styles.infoValue}>{staff.emergencyContact}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Employment Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Employment Details</Text>
                            <View style={styles.infoCard}>
                                <View style={styles.infoRow}>
                                    <Calendar size={20} color="#6B7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Join Date</Text>
                                        <Text style={styles.infoValue}>Joined {staff.joinDate}</Text>
                                    </View>
                                </View>
                                {staff.salary && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <Calendar size={20} color="#6B7280" />
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Salary</Text>
                                                <Text style={styles.infoValue}>{staff.salary}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                                {staff.shifts && staff.shifts.length > 0 && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <Clock size={20} color="#6B7280" />
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Work Schedule</Text>
                                                {staff.shifts.map((shift, index) => (
                                                    <Text key={index} style={styles.infoValue}>
                                                        {shift.day}: {shift.time}
                                                    </Text>
                                                ))}
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </>
                )}

                {/* Salary & Payments Section - Owner Only */}
                {isOwnerView && activeTab === 'salary' && (
                    <View style={styles.section}>
                        {/* Salary Summary Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Base Salary</Text>
                                    <Text style={styles.summaryValue}>₹{baseSalary.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>This Month</Text>
                                    <Text style={styles.summaryLight}>{new Date().toLocaleString('default', { month: 'long' })}</Text>
                                </View>
                            </View>
                            <View style={styles.dividerLight} />
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Advance Given</Text>
                                    <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>₹{totalAdvance.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Payable</Text>
                                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>₹{remainingPayable.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Transaction History</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowPaymentModal(true)}
                            >
                                <Plus size={16} color="#FFFFFF" />
                                <Text style={styles.addButtonText}>Record Pay</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoCard}>
                            {records.length === 0 ? (
                                <Text style={styles.emptyText}>No payment records found.</Text>
                            ) : (
                                records.map((record) => (
                                    <View key={record.id}>
                                        <View style={styles.paymentRow}>
                                            <View style={styles.paymentIcon}>
                                                {record.type === 'salary' ? (
                                                    <Wallet size={20} color="#16A34A" />
                                                ) : (
                                                    <CreditCard size={20} color="#F59E0B" />
                                                )}
                                            </View>
                                            <View style={styles.paymentDetails}>
                                                <Text style={styles.paymentAmount}>₹{record.amount.toLocaleString()}</Text>
                                                <Text style={styles.paymentMeta}>
                                                    {record.type === 'salary' ? 'Salary Payment' : 'Advance Given'} • {record.date}
                                                </Text>
                                                {record.note ? <Text style={styles.paymentNote}>{record.note}</Text> : null}
                                            </View>
                                            <View style={[
                                                styles.methodBadge,
                                                record.method === 'online' ? styles.methodOnline : styles.methodCash
                                            ]}>
                                                <Text style={[
                                                    styles.methodText,
                                                    record.method === 'online' ? styles.methodTextOnline : styles.methodTextCash
                                                ]}>
                                                    {record.method.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.divider} />
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Record Payment</Text>
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                                <X size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Text style={styles.inputLabel}>Payment Type</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'salary' && styles.typeButtonActive]}
                                onPress={() => setType('salary')}
                            >
                                <Text style={[styles.typeText, type === 'salary' && styles.typeTextActive]}>Salary</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'advance' && styles.typeButtonActive]}
                                onPress={() => setType('advance')}
                            >
                                <Text style={[styles.typeText, type === 'advance' && styles.typeTextActive]}>Advance</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Payment Method</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[styles.typeButton, method === 'cash' && styles.typeButtonActive]}
                                onPress={() => setMethod('cash')}
                            >
                                <Text style={[styles.typeText, method === 'cash' && styles.typeTextActive]}>Cash</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, method === 'online' && styles.typeButtonActive]}
                                onPress={() => setMethod('online')}
                            >
                                <Text style={[styles.typeText, method === 'online' && styles.typeTextActive]}>Online</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Note (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add a note..."
                            multiline
                            numberOfLines={3}
                            value={note}
                            onChangeText={setNote}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleAddPayment}>
                            <Text style={styles.saveButtonText}>Save Record</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
    },
    profileSection: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatarLarge: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FDB813',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    staffNameLarge: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    roleBadgeLarge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    roleBadgeTextLarge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    statusApproved: {
        backgroundColor: '#D1FAE5',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
    },
    statusTextLarge: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FDB813',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 12,
        marginBottom: 24,
        marginHorizontal: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#1F2937',
        fontWeight: '600',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDB813',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 8,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentDetails: {
        flex: 1,
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    paymentMeta: {
        fontSize: 12,
        color: '#6B7280',
    },
    paymentNote: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    methodBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    methodCash: {
        backgroundColor: '#ECFDF5',
    },
    methodOnline: {
        backgroundColor: '#EFF6FF',
    },
    methodText: {
        fontSize: 10,
        fontWeight: '600',
    },
    methodTextCash: {
        color: '#059669',
    },
    methodTextOnline: {
        color: '#2563EB',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 500,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: '#1F2937',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDB813',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    typeTextActive: {
        color: '#B45309',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#FDB813',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    summaryCard: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    summaryLight: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E5E7EB',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#374151',
        marginHorizontal: 16,
    },
    dividerLight: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 16,
    },
});
