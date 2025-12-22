import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, User, Mail, Phone, X, Edit2 } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

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
  showBack?: boolean;
}

export default function StaffScreen({ isOwner, showBack = true }: StaffScreenProps) {
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

  const [staff, setStaff] = useState<StaffMember[]>([]);

  const fetchStaff = async () => {
    try {
      const { data } = await supabase.from('users').select('*').neq('role', 'owner');
      if (data) {
        setStaff(data.map((u: any) => ({
          id: String(u.id),
          name: u.name || 'Unknown',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role,
          status: (u.status === 'approved') ? 'approved' : 'pending',
          joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'
        })));
      }
    } catch (e) {
      console.error("Error fetching staff", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

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

  const handleAddStaff = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) return;

    try {
      const newUser = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: selectedDesignation,
        status: isOwnerView ? 'approved' : 'pending',
        // Default auth_id might be needed if required, but Supabase usually generates it on auth signup.
        // If this is just a 'users' record:
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;

      fetchStaff();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error("Error adding staff", e);
      alert("Failed to add staff");
    }
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormPhone(member.phone);
    setSelectedDesignation(member.role);
    setShowEditModal(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !formName.trim() || !formEmail.trim() || !formPhone.trim()) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: selectedDesignation
        })
        .eq('id', editingStaff.id);

      if (error) throw error;

      fetchStaff();
      setShowEditModal(false);
      setEditingStaff(null);
      resetForm();
    } catch (e) {
      console.error("Error updating staff", e);
      alert("Failed to update staff");
    }
  };

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStaffForApproval, setSelectedStaffForApproval] = useState<string | null>(null);

  const handleApproveClick = (id: string, e: any) => {
    e.stopPropagation();
    setSelectedStaffForApproval(id);
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedStaffForApproval) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', selectedStaffForApproval);

      if (error) throw error;
      fetchStaff();
    } catch (e) {
      console.error("Error approving staff", e);
      Alert.alert("Error", "Failed to approve staff member");
    } finally {
      setShowApprovalModal(false);
      setSelectedStaffForApproval(null);
    }
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

  const insets = useSafeAreaInsets();

  const renderStaffItem = ({ item: member }: { item: StaffMember }) => (
    <TouchableOpacity
      key={member.id}
      style={styles.staffCard}
      onPress={() => router.push(`${isOwnerView ? '/owner' : '/manager'}/staff/${member.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Left Section: Avatar and Core Info */}
      <View style={styles.cardLeftSection}>
        <View style={styles.staffAvatar}>
          <User size={28} color={Colors.dark.text} />
        </View>
        <View style={styles.staffMainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName} numberOfLines={1}>{member.name}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
            <Text style={styles.roleBadgeText}>{member.role.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Middle Section: Contact Details */}
      <View style={styles.cardMiddleSection}>
        <View style={styles.contactRow}>
          <Mail size={13} color={Colors.dark.textSecondary} />
          <Text style={styles.contactText} numberOfLines={1}>{member.email}</Text>
        </View>
        <View style={styles.contactRow}>
          <Phone size={13} color={Colors.dark.textSecondary} />
          <Text style={styles.contactText} numberOfLines={1}>{member.phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.joinDateText}>Joined {member.joinDate}</Text>
          <View style={[
            styles.statusBadge,
            member.status === 'approved' ? styles.statusApproved : styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              member.status === 'approved' ? { color: '#10B981' } : { color: '#F59E0B' }
            ]}>
              {member.status === 'approved' ? '✓ Approved' : '⏱ Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Section: Actions */}
      <View style={styles.cardRightSection}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEditStaff(member);
          }}
        >
          <Edit2 size={18} color={Colors.dark.primary} />
        </TouchableOpacity>
        {isOwnerView && member.status === 'pending' && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={(e) => handleApproveClick(member.id, e)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // Spacer to keep title centered if needed, or remove if aligned left
        )}
        <Text style={[styles.headerTitle, !showBack && { marginLeft: 0 }]}>
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

        <View style={styles.rolesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </View>

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

        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          renderItem={renderStaffItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
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
      <Modal visible={showApprovalModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowApprovalModal(false)}
          />
          <View style={[styles.modalContent, styles.confirmationModal]}>
            <View style={styles.confirmationHeader}>
              <View style={styles.warningIconContainer}>
                <User size={32} color={Colors.dark.primary} />
              </View>
              <Text style={styles.confirmationTitle}>Approve Staff Member?</Text>
            </View>

            <Text style={styles.confirmationText}>
              Are you sure you want to approve this staff member? They will gain access to the system based on their assigned role.
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmApproval}
              >
                <Text style={styles.confirmButtonText}>Approve Access</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'column',
    backgroundColor: Colors.dark.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 14,
  },
  cardLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  staffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  staffMainInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardMiddleSection: {
    gap: 8,
    paddingLeft: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  joinDateText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    padding: 10,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  approveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
    marginRight: 8,
  },
  designationChipActive: {
    backgroundColor: Colors.dark.secondary,
    borderColor: Colors.dark.primary,
  },
  designationText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  designationTextActive: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  newDesignationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  addDesignationButton: {
    backgroundColor: Colors.dark.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  addDesignationText: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  confirmationModal: {
    minHeight: 'auto',
    maxHeight: 'auto',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    flex: 1,
  },
  confirmationText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
