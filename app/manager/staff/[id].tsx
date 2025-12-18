import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, CheckCircle } from 'lucide-react-native';

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

export default function StaffDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const staff = mockStaffData[id || '1'];

    if (!staff) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/manager/staff')}>
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/manager/staff')}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Staff Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarLarge}>
                        <User size={48} color="#FFFFFF" />
                    </View>
                    <Text style={styles.staffNameLarge}>{staff.name}</Text>
                    <View style={[styles.roleBadgeLarge, { backgroundColor: getRoleColor(staff.role) }]}>
                        <Text style={styles.roleBadgeTextLarge}>{staff.role.toUpperCase()}</Text>
                    </View>
                    <View style={[
                        styles.statusBadgeLarge,
                        staff.status === 'approved' ? styles.statusApproved : styles.statusPending
                    ]}>
                        <CheckCircle size={14} color={staff.status === 'approved' ? '#10B981' : '#F59E0B'} />
                        <Text style={[styles.statusTextLarge, { color: staff.status === 'approved' ? '#10B981' : '#F59E0B' }]}>
                            {staff.status === 'approved' ? 'Approved' : 'Pending Approval'}
                        </Text>
                    </View>
                </View>

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
            </ScrollView>
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
});
