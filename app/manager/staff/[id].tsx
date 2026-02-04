import { useState, useEffect } from 'react';
import { supabase } from '@/services/database';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, CheckCircle, IndianRupee, Wallet, CreditCard, Plus, X, Edit2, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SalaryRecord {
    id: string; // payment id
    date: string;
    amount: number;
    type: 'salary' | 'advance';
    method: 'cash' | 'online';
    note?: string;
    staff_id?: number;
}

interface SalaryLog {
    id: string;
    old_salary: number;
    new_salary: number;
    change_date: string;
    notes?: string;
    changed_by?: string;
}

interface StaffMember {
    id: string; // user_id (uuid)
    staff_id?: number; // staff table id (serial)
    name: string;
    email: string;
    phone: string;
    role: string;
    status: 'approved' | 'pending';
    joinDate: string;
    address?: string;
    emergencyContact?: string;
    salary?: string; // stored as numeric in DB, but string here for display maybe?
    salaryFromDate?: string;
    nextPaymentDate?: string;
    shifts?: { day: string; time: string }[];
    salaryHistory?: SalaryRecord[];
    salaryLogs?: SalaryLog[];
}

interface StaffDetailsScreenProps {
    isOwner?: boolean;
}

export default function StaffDetailsScreen({ isOwner }: StaffDetailsScreenProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isOwnerView = isOwner ?? false;
    const [staff, setStaff] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'salary'>('overview');
    const insets = useSafeAreaInsets();

    const [showSalaryEditModal, setShowSalaryEditModal] = useState(false);
    const [salaryLogs, setSalaryLogs] = useState<SalaryLog[]>([]);

    // State for unified salary edit modal
    const [newSalary, setNewSalary] = useState('');
    const [salaryFromDate, setSalaryFromDate] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState('');

    // Date picker state
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
    const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
    const [tempDateObj, setTempDateObj] = useState(new Date());

    // Date Editing State (for joining date only now)
    const [isEditingJoiningDate, setIsEditingJoiningDate] = useState(false);
    const [tempDate, setTempDate] = useState(''); // Generic temp date for editing

    // Helper to format date to DD/MM/YYYY
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not Set';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // fallback
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };

    // Helper to convert Date object to YYYY-MM-DD string for database
    const dateToDbFormat = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper to parse YYYY-MM-DD string to Date object
    const dbFormatToDate = (dateString?: string) => {
        if (!dateString) return new Date();
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date() : date;
        } catch {
            return new Date();
        }
    };

    // Date picker handlers
    const handleFromDateChange = (event: any, selectedDate?: Date) => {
        setShowFromDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setSalaryFromDate(dateToDbFormat(selectedDate));
        }
    };

    const handleToDateChange = (event: any, selectedDate?: Date) => {
        setShowToDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setNextPaymentDate(dateToDbFormat(selectedDate));
        }
    };

    const handleJoiningDateChange = (event: any, selectedDate?: Date) => {
        setShowJoiningDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setTempDateObj(selectedDate);
            setTempDate(dateToDbFormat(selectedDate));
        }
    };

    const handlePaymentDateChange = (event: any, selectedDate?: Date) => {
        setShowPaymentDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setPaymentDate(dateToDbFormat(selectedDate));
        }
    };

    useEffect(() => {
        if (!id) return;

        const fetchStaffDetails = async () => {
            try {
                // Fetch User Details
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (userError) throw userError;

                // Fetch Staff Details (if exists)
                const { data: staffData, error: staffError } = await supabase
                    .from('staff')
                    .select('*')
                    .eq('user_id', id)
                    .single();

                // Fetch Payment History
                let paymentHistory: SalaryRecord[] = [];
                let salaryLogsList: SalaryLog[] = []; // FETCH SALARY LOGS

                if (staffData) {
                    const { data: payments } = await supabase
                        .from('staff_payments')
                        .select('*')
                        .eq('staff_id', staffData.id)
                        .order('payment_date', { ascending: false });

                    if (payments) {
                        paymentHistory = payments.map((p: any) => ({
                            id: String(p.id),
                            date: p.payment_date,
                            amount: p.amount,
                            type: p.payment_type as 'salary' | 'advance',
                            method: p.notes?.includes('Method: Online') ? 'online' : 'cash',
                            note: p.notes,
                            staff_id: p.staff_id
                        }));
                    }

                    // FETCH LOGS
                    const { data: logs } = await supabase
                        .from('salary_logs')
                        .select('*')
                        .eq('staff_id', staffData.id)
                        .order('change_date', { ascending: false });

                    if (logs) {
                        salaryLogsList = logs.map((l: any) => ({
                            id: String(l.id),
                            old_salary: l.old_salary,
                            new_salary: l.new_salary,
                            change_date: l.change_date,
                            notes: l.notes,
                            changed_by: l.changed_by
                        }));
                    }
                }

                if (userData) {
                    setStaff({
                        id: userData.id,
                        staff_id: staffData?.id,
                        name: userData.name || 'Unknown',
                        email: userData.email || '',
                        phone: userData.phone || 'Not provided',
                        role: userData.role || 'staff',
                        status: (userData as any).status || 'pending',
                        joinDate: userData.created_at || new Date().toISOString(),
                        salary: staffData?.salary ? String(staffData.salary) : 'Not set',
                        salaryFromDate: staffData?.salary_from_date || undefined,
                        nextPaymentDate: staffData?.next_payment_date || undefined,
                        salaryLogs: salaryLogsList,
                        address: staffData?.address || 'Not provided',
                        emergencyContact: staffData?.emergency_contact || 'Not provided',
                        shifts: [],
                        salaryHistory: paymentHistory
                    });
                    if (staffData?.salary) {
                        setNewSalary(String(staffData.salary));
                        setSalaryFromDate(staffData?.salary_from_date || '');
                        setNextPaymentDate(staffData?.next_payment_date || '');
                    }
                }
            } catch (e) {
                console.error("Error fetching staff details:", e);
                Alert.alert("Error", "Failed to fetch staff details");
            } finally {
                setLoading(false);
            }
        };

        fetchStaffDetails();
    }, [id]);

    // State for salary management
    const [records, setRecords] = useState<SalaryRecord[]>(staff?.salaryHistory || []);
    // Update records when staff changes
    useEffect(() => {
        if (staff?.salaryHistory) {
            setRecords(staff.salaryHistory);
        }
    }, [staff]);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'salary' | 'advance'>('salary');
    const [method, setMethod] = useState<'cash' | 'online'>('cash');
    const [note, setNote] = useState('');
    const [paymentDate, setPaymentDate] = useState(''); // DD/MM/YYYY format for display, YYYY-MM-DD for DB

    // Calculate financial summary
    const parseSalary = (salaryStr?: string) => {
        if (!salaryStr) return 0;
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

    // Calculate current month's advances
    const getCurrentMonthAdvances = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return records
            .filter(r => {
                if (r.type !== 'advance') return false;
                const recordDate = new Date(r.date);
                return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
            })
            .reduce((sum, r) => sum + r.amount, 0);
    };

    const currentMonthAdvances = getCurrentMonthAdvances();
    const remainingPayable = baseSalary - currentMonthAdvances;

    const handleBack = () => {
        router.push(isOwnerView ? '/owner/staff' : '/manager/staff');
    };

    const handleUpdateSalary = async () => {
        if (!staff?.staff_id) return;
        const numericSalary = parseFloat(newSalary);
        if (isNaN(numericSalary)) {
            Alert.alert(t('common.error'), "Please enter a valid salary amount");
            return;
        }

        const oldSalary = parseFloat(staff.salary || '0') || 0;

        try {
            // Update Salary and dates
            const { error } = await supabase
                .from('staff')
                .update({
                    salary: numericSalary,
                    salary_from_date: salaryFromDate || null,
                    next_payment_date: nextPaymentDate || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staff.staff_id);

            if (error) throw error;

            // Log change if salary amount changed
            if (oldSalary !== numericSalary) {
                await supabase.from('salary_logs').insert([{
                    staff_id: staff.staff_id,
                    old_salary: oldSalary,
                    new_salary: numericSalary,
                    change_date: new Date().toISOString(),
                    changed_by: (await supabase.auth.getUser()).data.user?.id,
                    notes: 'Base salary updated'
                }]);
            }

            // Refresh logs
            const { data: logs } = await supabase
                .from('salary_logs')
                .select('*')
                .eq('staff_id', staff.staff_id)
                .order('change_date', { ascending: false });

            const refreshedLogs = logs ? logs.map((l: any) => ({
                id: String(l.id),
                old_salary: l.old_salary,
                new_salary: l.new_salary,
                change_date: l.change_date,
                notes: l.notes,
                changed_by: l.changed_by
            })) : [];

            setStaff(prev => prev ? ({
                ...prev,
                salary: String(numericSalary),
                salaryFromDate: salaryFromDate || undefined,
                nextPaymentDate: nextPaymentDate || undefined,
                salaryLogs: refreshedLogs,
                salaryHistory: prev.salaryHistory // Preserve transaction history
            }) : null);
            setSalaryLogs(refreshedLogs);
            setShowSalaryEditModal(false);
            Alert.alert(t('common.success'), "Salary details updated successfully");
        } catch (e) {
            console.error("Error updating salary:", e);
            Alert.alert(t('common.error'), "Failed to update salary");
        }
    };

    const handleUpdateJoiningDate = async (dateStr: string) => {
        if (!staff?.id) return;
        try {
            const { error } = await supabase
                .from('users')
                .update({ created_at: dateStr })
                .eq('id', staff.id);

            if (error) throw error;
            setStaff(prev => prev ? ({ ...prev, joinDate: dateStr }) : null);
            setIsEditingJoiningDate(false);
            Alert.alert("Success", "Joining date updated");
        } catch (e) {
            Alert.alert("Error", "Failed to update date");
        }
    };

    const handleDeleteLog = async (logId: string) => {
        Alert.alert("Delete Log", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    const { error } = await supabase.from('salary_logs').delete().eq('id', parseInt(logId));
                    if (!error) {
                        setSalaryLogs(prev => prev.filter(l => l.id !== logId));
                        setStaff(prev => prev ? ({ ...prev, salaryLogs: prev.salaryLogs?.filter(l => l.id !== logId) }) : null);
                    }
                }
            }
        ]);
    };

    const handleAddPayment = async () => {
        if (!amount || !staff?.staff_id) {
            Alert.alert(t('common.error'), t('manager.staff.errorEnterAmount', { defaultValue: 'Please enter an amount' }));
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return;

        try {
            const { data, error } = await supabase
                .from('staff_payments')
                .insert([{
                    staff_id: staff.staff_id,
                    amount: numericAmount,
                    payment_type: type,
                    payment_date: new Date().toISOString().split('T')[0],
                    notes: note + (method === 'online' ? ' [Method: Online]' : ''),
                    paid_by: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newRecord: SalaryRecord = {
                    id: String(data.id),
                    date: data.payment_date || new Date().toISOString().split('T')[0],
                    amount: data.amount,
                    type: data.payment_type as 'salary' | 'advance',
                    method: method,
                    note: data.notes || undefined,
                    staff_id: data.staff_id || 0
                };
                setRecords([newRecord, ...records]);
                setShowPaymentModal(false);
                setAmount('');
                setNote('');
                Alert.alert(t('common.success'), t('manager.staff.paymentRecordedSuccess', { defaultValue: 'Payment recorded successfully' }));
            }
        } catch (e) {
            console.error("Error adding payment:", e);
            Alert.alert(t('common.error'), "Failed to add payment record");
        }
    };

    const handleDeletePayment = (paymentId: string) => {
        Alert.alert(
            "Delete Payment",
            "Are you sure you want to delete this payment record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('staff_payments')
                                .delete()
                                .eq('id', parseInt(paymentId));

                            if (error) throw error;

                            setRecords(prev => prev.filter(r => r.id !== paymentId));
                        } catch (e) {
                            console.error("Error deleting payment:", e);
                            Alert.alert("Error", "Failed to delete payment");
                        }
                    }
                }
            ]
        );
    };

    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

    const openEditPaymentModal = (record: SalaryRecord) => {
        setEditingPaymentId(record.id);
        setAmount(String(record.amount));
        setType(record.type);
        setMethod(record.method);
        setNote(record.note || '');
        setShowPaymentModal(true);
    };

    const handleEditPayment = async () => {
        if (!editingPaymentId || !amount) return;

        try {
            const { error } = await supabase
                .from('staff_payments')
                .update({
                    amount: parseFloat(amount),
                    payment_type: type,
                    notes: note + (method === 'online' ? ' [Method: Online]' : ''),
                })
                .eq('id', parseInt(editingPaymentId));

            if (error) throw error;

            setRecords(prev => prev.map(r => {
                if (r.id === editingPaymentId) {
                    return {
                        ...r,
                        amount: parseFloat(amount),
                        type,
                        method,
                        note
                    };
                }
                return r;
            }));
            setShowPaymentModal(false);
            setEditingPaymentId(null);
            setAmount('');
            setNote('');
            Alert.alert("Success", "Payment updated successfully");

        } catch (e) {
            console.error("Error updating payment:", e);
            Alert.alert("Error", "Failed to update payment");
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (!staff) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity onPress={handleBack}>
                        <ArrowLeft size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('manager.staff.detailsTitle', { defaultValue: 'Staff Details' })}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('manager.staff.notFound', { defaultValue: 'Staff member not found' })}</Text>
                </View>
            </View>
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

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={handleBack}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('manager.staff.detailsTitle', { defaultValue: 'Staff Details' })}</Text>
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
                                    <Mail size={20} color={Colors.dark.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{staff.email}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Phone size={20} color={Colors.dark.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Phone</Text>
                                        <Text style={styles.infoValue}>{staff.phone}</Text>
                                    </View>
                                </View>
                                {staff.address && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <User size={20} color={Colors.dark.textSecondary} />
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
                                            <Phone size={20} color={Colors.dark.textSecondary} />
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
                                    <Calendar size={20} color={Colors.dark.textSecondary} />
                                    <View style={styles.infoContent}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.infoLabel}>Joined Date</Text>
                                            {isOwnerView && (
                                                <TouchableOpacity onPress={() => { setTempDate(staff.joinDate || ''); setIsEditingJoiningDate(true); }}>
                                                    <Edit2 size={14} color={Colors.dark.primary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <Text style={styles.infoValue}>{formatDate(staff.joinDate)}</Text>
                                    </View>
                                </View>

                                {staff.salary && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <IndianRupee size={20} color={Colors.dark.textSecondary} />
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Current Salary</Text>
                                                <Text style={styles.infoValue}>₹{parseFloat(staff.salary).toLocaleString()}</Text>
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Employee Salary</Text>
                                    <Text style={[styles.summaryValue, baseSalary === 0 && { color: Colors.dark.textSecondary, fontSize: 18 }]}>
                                        {baseSalary > 0 ? `₹${baseSalary.toLocaleString()}` : 'Not Set'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowSalaryEditModal(true)}
                                    style={{ backgroundColor: Colors.dark.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                >
                                    <Edit2 size={14} color="#FFFFFF" />
                                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Salary Period */}
                            <View style={{ borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: 12 }}>
                                <Text style={[styles.summaryLabel, { marginBottom: 8 }]}>Salary Period</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: Colors.dark.textSecondary, marginBottom: 4 }}>From</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.text }}>
                                            {staff?.salaryFromDate ? formatDate(staff.salaryFromDate) : 'Not Set'}
                                        </Text>
                                    </View>
                                    <ArrowLeft size={16} color={Colors.dark.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: Colors.dark.textSecondary, marginBottom: 4 }}>To</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.text }}>
                                            {staff?.nextPaymentDate ? formatDate(staff.nextPaymentDate) : 'Not Set'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Remaining Payable Salary - Current Month */}
                            {baseSalary > 0 && (
                                <View style={{ borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: 12, marginTop: 12 }}>
                                    <Text style={[styles.summaryLabel, { marginBottom: 8 }]}>This Month Summary</Text>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 13, color: Colors.dark.textSecondary }}>Base Salary</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.text }}>
                                                ₹{baseSalary.toLocaleString()}
                                            </Text>
                                        </View>
                                        {currentMonthAdvances > 0 && (
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 13, color: '#F59E0B' }}>Advances Given</Text>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#F59E0B' }}>
                                                    - ₹{currentMonthAdvances.toLocaleString()}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{ height: 1, backgroundColor: Colors.dark.border, marginVertical: 4 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.text }}>Remaining Payable</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: remainingPayable < 0 ? '#EF4444' : '#16A34A' }}>
                                                ₹{remainingPayable.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Salary History / Increments Section */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Salary Increments</Text>
                        </View>

                        <View style={[styles.infoCard, { marginBottom: 24 }]}>
                            {salaryLogs.length === 0 ? (
                                <Text style={styles.emptyText}>No salary history recorded.</Text>
                            ) : (
                                salaryLogs.map((log) => (
                                    <View key={log.id} style={styles.logItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.logDate}>{formatDate(log.change_date)}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={styles.logOldValue}>₹{log.old_salary}</Text>
                                                <ArrowLeft size={12} color={Colors.dark.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                                                <Text style={styles.logNewValue}>₹{log.new_salary}</Text>
                                            </View>
                                            {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                                            <Trash2 size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Transaction History</Text>
                            <TouchableOpacity
                                style={[styles.addButton, baseSalary === 0 && { opacity: 0.5, backgroundColor: Colors.dark.textSecondary }]}
                                onPress={() => {
                                    if (baseSalary === 0) {
                                        Alert.alert("Base Salary Required", "Please set the base salary for this employee before recording payments.");
                                        return;
                                    }
                                    setShowPaymentModal(true);
                                }}
                            >
                                <Plus size={16} color="#FFFFFF" />
                                <Text style={styles.addButtonText}>Add Record</Text>
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
                                                    {record.type === 'salary' ? 'Salary Payment' : 'Advance Given'} • {formatDate(record.date)}
                                                </Text>
                                                {record.note ? <Text style={styles.paymentNote}>{record.note}</Text> : null}
                                            </View>
                                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
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
                                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                                    <TouchableOpacity
                                                        onPress={() => openEditPaymentModal(record)}
                                                        style={{ backgroundColor: Colors.dark.secondary, padding: 8, borderRadius: 8 }}
                                                    >
                                                        <Edit2 size={16} color={Colors.dark.primary} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeletePayment(record.id)}
                                                        style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8 }}
                                                    >
                                                        <Trash2 size={16} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
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
                            <Text style={styles.modalTitle}>{editingPaymentId ? 'Edit Payment' : 'Record Payment'}</Text>
                            <TouchableOpacity onPress={() => {
                                setShowPaymentModal(false);
                                setEditingPaymentId(null);
                                setAmount('');
                                setNote('');
                            }}>
                                <X size={24} color={Colors.dark.text} />
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

                        <Text style={styles.inputLabel}>Payment Date</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowPaymentDatePicker(true)}
                        >
                            <Text style={{ color: paymentDate ? Colors.dark.text : Colors.dark.textSecondary }}>
                                {paymentDate ? formatDate(paymentDate) : 'Select date (Today)'}
                            </Text>
                            <Calendar size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        {showPaymentDatePicker && (
                            <DateTimePicker
                                value={dbFormatToDate(paymentDate || dateToDbFormat(new Date()))}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handlePaymentDateChange}
                            />
                        )}

                        <Text style={styles.inputLabel}>Note (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add a note..."
                            multiline
                            numberOfLines={3}
                            value={note}
                            onChangeText={setNote}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={editingPaymentId ? handleEditPayment : handleAddPayment}>
                            <Text style={styles.saveButtonText}>{editingPaymentId ? 'Update Payment' : 'Save Record'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Unified Salary Edit Modal */}
            <Modal
                visible={showSalaryEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSalaryEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: 30 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Salary Details</Text>
                            <TouchableOpacity onPress={() => setShowSalaryEditModal(false)}>
                                <X size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Base Salary (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            value={newSalary}
                            onChangeText={setNewSalary}
                        />

                        <Text style={styles.inputLabel}>Salary Period From</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowFromDatePicker(true)}
                        >
                            <Text style={{ color: salaryFromDate ? Colors.dark.text : Colors.dark.textSecondary }}>
                                {salaryFromDate ? formatDate(salaryFromDate) : 'Select date'}
                            </Text>
                            <Calendar size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        {showFromDatePicker && (
                            <DateTimePicker
                                value={dbFormatToDate(salaryFromDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleFromDateChange}
                            />
                        )}

                        <Text style={styles.inputLabel}>Next Payment Date</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowToDatePicker(true)}
                        >
                            <Text style={{ color: nextPaymentDate ? Colors.dark.text : Colors.dark.textSecondary }}>
                                {nextPaymentDate ? formatDate(nextPaymentDate) : 'Select date'}
                            </Text>
                            <Calendar size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        {showToDatePicker && (
                            <DateTimePicker
                                value={dbFormatToDate(nextPaymentDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleToDateChange}
                            />
                        )}

                        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateSalary}>
                            <Text style={styles.saveButtonText}>Update Salary Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Edit Modal - Joining Date Only */}
            <Modal
                visible={isEditingJoiningDate}
                transparent
                animationType="fade"
                onRequestClose={() => setIsEditingJoiningDate(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Joining Date</Text>
                            <TouchableOpacity onPress={() => setIsEditingJoiningDate(false)}>
                                <X size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Joining Date</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowJoiningDatePicker(true)}
                        >
                            <Text style={{ color: tempDate ? Colors.dark.text : Colors.dark.textSecondary }}>
                                {tempDate ? formatDate(tempDate) : 'Select date'}
                            </Text>
                            <Calendar size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        {showJoiningDatePicker && (
                            <DateTimePicker
                                value={tempDateObj}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleJoiningDateChange}
                            />
                        )}
                        <TouchableOpacity style={styles.saveButton} onPress={() => handleUpdateJoiningDate(tempDate)}>
                            <Text style={styles.saveButtonText}>Update Date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
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
        color: Colors.dark.textSecondary,
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
        color: Colors.dark.text,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    summaryItem: {
        flex: 1,
        minWidth: 150,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    infoCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
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
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 12,
    },
    profileCard: {
        backgroundColor: Colors.dark.card,
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
        backgroundColor: Colors.dark.primary,
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
        color: Colors.dark.text,
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
        color: Colors.dark.textSecondary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.secondary,
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
        backgroundColor: Colors.dark.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    tabTextActive: {
        color: Colors.dark.primary,
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
        backgroundColor: Colors.dark.primary,
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
        color: Colors.dark.textSecondary,
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
        backgroundColor: Colors.dark.secondary,
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
        color: Colors.dark.text,
    },
    paymentMeta: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    paymentNote: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    // New Styles for Logs
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    logDate: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    logOldValue: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textDecorationLine: 'line-through',
    },
    logNewValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    logNotes: {
        fontSize: 11,
        color: '#6B7280',
        fontStyle: 'italic',
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
        backgroundColor: Colors.dark.card,
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
        color: Colors.dark.text,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: Colors.dark.text,
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
        borderColor: Colors.dark.border,
        alignItems: 'center',
        backgroundColor: Colors.dark.secondary,
    },
    typeButtonActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    typeTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});
