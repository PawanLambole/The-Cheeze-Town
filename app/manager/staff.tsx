import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, User, Mail, Phone, X, Edit2 } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'approved' | 'pending';
  joinDate: string;
}

interface StaffScreenProps {
  isOwner?: boolean;
}

export default function StaffScreen({ isOwner }: StaffScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const isOwnerView = isOwner ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [designations, setDesignations] = useState<string[]>(['manager', 'chef', 'waiter', 'cashier']);
  const roles = ['all', ...designations];

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('manager');
  const [newDesignation, setNewDesignation] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'John Doe', email: 'john@cheezetown.com', phone: '+91 98765 43210', role: 'manager', status: 'approved', joinDate: 'Jan 2024' },
    { id: '2', name: 'Sarah Wilson', email: 'sarah@cheezetown.com', phone: '+91 98765 43211', role: 'chef', status: 'approved', joinDate: 'Feb 2024' },
    { id: '3', name: 'Mike Johnson', email: 'mike@cheezetown.com', phone: '+91 98765 43212', role: 'waiter', status: 'approved', joinDate: 'Mar 2024' },
    { id: '4', name: 'Emily Brown', email: 'emily@cheezetown.com', phone: '+91 98765 43213', role: 'cashier', status: 'approved', joinDate: 'Mar 2024' },
  ]);

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return '#3B82F6';
      case 'chef': return Colors.dark.primary;
      case 'waiter': return '#10B981';
      case 'cashier': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const totalStaff = staff.length;
  const pendingStaff = staff.filter(s => s.status === 'pending').length;

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setSelectedDesignation(designations[0] ?? 'manager');
  };

  const handleAddStaff = () => {
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) return;
    const newMember: StaffMember = {
      id: String(Date.now()),
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      role: selectedDesignation,
      status: isOwnerView ? 'approved' : 'pending',
      joinDate: 'Apr 2024',
    };
    setStaff(prev => [newMember, ...prev]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormPhone(member.phone);
    setSelectedDesignation(member.role);
    setShowEditModal(true);
  };

  const handleUpdateStaff = () => {
    if (!editingStaff || !formName.trim() || !formEmail.trim() || !formPhone.trim()) return;
    setStaff(prev =>
      prev.map(m =>
        m.id === editingStaff.id
          ? { ...m, name: formName.trim(), email: formEmail.trim(), phone: formPhone.trim(), role: selectedDesignation }
          : m
      )
    );
    setShowEditModal(false);
    setEditingStaff(null);
    resetForm();
  };

  const handleApproveStaff = (id: string) => {
    setStaff(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'approved' } : m))
    );
  };

  const handleAddDesignation = () => {
    const label = newDesignation.trim();
    if (!label) return;
    if (!designations.includes(label)) {
      setDesignations(prev => [...prev, label]);
    }
    setNewDesignation('');
    setSelectedDesignation(label);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOwnerView ? 'Staff Management' : 'Team (Manager)'}
        </Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButtonHeader}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesContainer}>
          {roles.map(role => (
            <TouchableOpacity
              key={role}
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleText, selectedRole === role && styles.roleTextActive]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStaff}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingStaff}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
          </View>
        </View>

        <ScrollView style={styles.staffList} showsVerticalScrollIndicator={false}>
          {filteredStaff.map(member => (
            <TouchableOpacity
              key={member.id}
              style={styles.staffCard}
              onPress={() => router.push(`${isOwnerView ? '/owner' : '/manager'}/staff/${member.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.staffAvatar}>
                <User size={24} color={Colors.dark.text} />
              </View>
              <View style={styles.staffInfo}>
                <View style={styles.staffHeader}>
                  <Text style={styles.staffName}>{member.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                    <Text style={styles.roleBadgeText}>{member.role}</Text>
                  </View>
                </View>
                <View style={styles.staffContact}>
                  <Mail size={14} color={Colors.dark.textSecondary} />
                  <Text style={styles.staffContactText}>{member.email}</Text>
                </View>
                <View style={styles.staffContact}>
                  <Phone size={14} color={Colors.dark.textSecondary} />
                  <Text style={styles.staffContactText}>{member.phone}</Text>
                </View>
                <View style={styles.staffFooter}>
                  <Text style={styles.staffJoinDate}>Joined {member.joinDate}</Text>
                  <View style={[
                    styles.statusBadge,
                    member.status === 'approved' ? styles.statusApproved : styles.statusPending
                  ]}>
                    <Text style={[styles.statusText, member.status !== 'approved' && { color: '#92400E' }]}>
                      {member.status === 'approved' ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.staffActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditStaff(member);
                  }}
                >
                  <Edit2 size={18} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
                {isOwnerView && member.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApproveStaff(member.id);
                    }}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                )}
                {!isOwnerView && member.status === 'pending' && (
                  <View style={styles.pendingTag}>
                    <Text style={styles.pendingTagText}>Waiting owner</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.dark.textSecondary}
                value={formName}
                onChangeText={setFormName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="email-address"
                value={formEmail}
                onChangeText={setFormEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="phone-pad"
                value={formPhone}
                onChangeText={setFormPhone}
              />

              <Text style={styles.modalLabel}>Designation</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.designationChips}
              >
                {designations.map(des => (
                  <TouchableOpacity
                    key={des}
                    style={[
                      styles.designationChip,
                      selectedDesignation === des && styles.designationChipActive,
                    ]}
                    onPress={() => setSelectedDesignation(des)}
                  >
                    <Text
                      style={[
                        styles.designationText,
                        selectedDesignation === des && styles.designationTextActive,
                      ]}
                    >
                      {des.charAt(0).toUpperCase() + des.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isOwnerView && (
                <View style={styles.newDesignationRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="New designation (optional)"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newDesignation}
                    onChangeText={setNewDesignation}
                  />
                  <TouchableOpacity style={styles.addDesignationButton} onPress={handleAddDesignation}>
                    <Text style={styles.addDesignationText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.modalAddButton} onPress={handleAddStaff}>
                <Text style={styles.modalAddButtonText}>
                  {isOwnerView ? 'Add Staff (Approved)' : 'Send for Approval'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Staff Member</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setEditingStaff(null);
                resetForm();
              }}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.dark.textSecondary}
                value={formName}
                onChangeText={setFormName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="email-address"
                value={formEmail}
                onChangeText={setFormEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="phone-pad"
                value={formPhone}
                onChangeText={setFormPhone}
              />

              <Text style={styles.modalLabel}>Designation</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.designationChips}
              >
                {designations.map(des => (
                  <TouchableOpacity
                    key={des}
                    style={[
                      styles.designationChip,
                      selectedDesignation === des && styles.designationChipActive,
                    ]}
                    onPress={() => setSelectedDesignation(des)}
                  >
                    <Text
                      style={[
                        styles.designationText,
                        selectedDesignation === des && styles.designationTextActive,
                      ]}
                    >
                      {des.charAt(0).toUpperCase() + des.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isOwnerView && (
                <View style={styles.newDesignationRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="New designation (optional)"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newDesignation}
                    onChangeText={setNewDesignation}
                  />
                  <TouchableOpacity style={styles.addDesignationButton} onPress={handleAddDesignation}>
                    <Text style={styles.addDesignationText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.modalAddButton} onPress={handleUpdateStaff}>
                <Text style={styles.modalAddButtonText}>Update Staff Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  addButtonHeader: {
    backgroundColor: Colors.dark.primary,
    padding: 4,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
  },
  rolesContainer: {
    marginTop: 16,
    marginBottom: 16,
    flexGrow: 0,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  roleChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  roleTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  staffList: {
    flex: 1,
  },
  staffCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  staffContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  staffContactText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  staffFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  staffJoinDate: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  staffActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
  },
  approveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 999,
    alignSelf: 'center',
  },
  approveButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pendingTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    alignSelf: 'center',
    marginLeft: 8,
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  modalAddButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  designationChips: {
    marginBottom: 12,
  },
  designationChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.secondary,
    marginRight: 8,
  },
  designationChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  designationText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  designationTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  newDesignationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  addDesignationButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addDesignationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
  },
});
