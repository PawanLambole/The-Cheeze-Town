import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, User, Mail, Phone, X, Edit2, UserX, UserPlus } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useTranslation } from 'react-i18next';
import { database, supabase } from '@/services/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status?: 'approved' | 'pending' | 'fired';
  joinDate: string;
}

interface StaffScreenProps {
  isOwner?: boolean;
  showBack?: boolean;
}

export default function StaffScreen({ isOwner, showBack = true }: StaffScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const isOwnerView = isOwner ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Filter out manager if not owner
  const baseDesignations = ['manager', 'chef', 'waiter', 'cashier'];
  const allowedDesignations = isOwnerView ? baseDesignations : baseDesignations.filter(d => d !== 'manager');

  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'fired'>('all'); // Add status filter state
  const [designations, setDesignations] = useState<string[]>(allowedDesignations);
  const roles = ['all', ...designations];

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>(allowedDesignations[0]);
  const [newDesignation, setNewDesignation] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = async () => {
    if (!refreshing) setRefreshing(true);
    try {
      // Build query based on user role
      let query = supabase.from('users').select('*');

      if (isOwnerView) {
        // Owner sees all staff except other owners
        query = query.neq('role', 'owner');
      } else {
        // Manager sees only lower-level staff (chef, waiter, cashier, staff)
        // Excludes: owner and manager
        query = query.not('role', 'in', '("owner","manager")');
      }

      const { data } = await query;
      if (data) {
        setStaff(data.map((u: any) => ({
          id: String(u.id),
          name: u.name || 'Unknown',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role,
          status: (u.status || 'approved') as 'approved' | 'pending' | 'fired',
          joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'
        })));
      }
    } catch (e) {
      console.error("Error fetching staff", e);
    } finally {
      setRefreshing(false);
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

    // Status Logic
    // all -> Show Approved + Pending (Exclude Fired)
    // pending -> Show Pending
    // fired -> Show Fired
    let matchesStatus = false;
    if (selectedStatus === 'all') {
      matchesStatus = member.status !== 'fired';
    } else {
      matchesStatus = member.status === selectedStatus;
    }

    return matchesSearch && matchesRole && matchesStatus;
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

  const activeStaff = staff.filter(s => s.status !== 'fired').length;
  const pendingStaff = staff.filter(s => s.status === 'pending').length;
  const firedStaff = staff.filter(s => s.status === 'fired').length;

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
        status: 'pending', // All new staff need approval
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;

      fetchStaff();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error("Error adding staff", e);
      alert(t('manager.staff.errorAddStaff', { defaultValue: 'Failed to add staff' }));
    }
  };

  const handleFireStaff = (member: StaffMember) => {
    Alert.alert(
      t('manager.staff.fireTitle', { defaultValue: 'Fire Staff Member' }),
      t('manager.staff.fireMessage', { defaultValue: 'Are you sure you want to fire {name}? They will be moved to the fired list.', name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ status: 'fired' })
                .eq('id', member.id);

              if (error) throw error;
              fetchStaff();
            } catch (e) {
              console.error("Error firing staff", e);
              Alert.alert(t('common.error'), t('manager.staff.errorFireStaff', { defaultValue: 'Failed to fire staff member' }));
            }
          }
        }
      ]
    );
  };

  const handleReinstateStaff = (member: StaffMember) => {
    Alert.alert(
      t('manager.staff.reinstateTitle', { defaultValue: 'Reinstate Staff Member' }),
      t('manager.staff.reinstateMessage', { defaultValue: 'Are you sure you want to reinstate {name}? They will be moved to pending status for approval.', name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ status: 'pending' })
                .eq('id', member.id);

              if (error) throw error;
              fetchStaff();
              Alert.alert(t('common.success'), t('manager.staff.reinstateSuccess', { defaultValue: 'Staff member reinstated to Pending list.' }));
            } catch (e) {
              console.error("Error reinstating staff", e);
              Alert.alert(t('common.error'), t('manager.staff.errorReinstateStaff', { defaultValue: 'Failed to reinstate staff member' }));
            }
          }
        }
      ]
    );
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
      alert(t('manager.staff.errorUpdateStaff', { defaultValue: 'Failed to update staff' }));
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

      if (error) throw error;

      Alert.alert(t('common.success'), t('manager.staff.approveSuccess', { defaultValue: 'Staff member approved successfully' }));
      fetchStaff();
    } catch (e) {
      console.error("Error approving staff", e);
      Alert.alert(t('common.error'), t('manager.staff.errorApproveStaff', { defaultValue: 'Failed to approve staff member' }));
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
    <View
      key={member.id}
      style={styles.staffCard}
    >
      {/* Edit Button - Top Right Corner */}
      <TouchableOpacity
        style={styles.editButtonTopRight}
        onPress={(e) => {
          e.stopPropagation();
          handleEditStaff(member);
        }}
      >
        <Edit2 size={18} color={Colors.dark.primary} />
      </TouchableOpacity>

      {/* Main Content - Clickable */}
      <TouchableOpacity
        onPress={() => router.push(`${isOwnerView ? '/owner' : '/manager'}/staff/${member.id}` as any)}
        activeOpacity={0.7}
        style={{ flex: 1 }}
      >
        {/* Top Section: Avatar and Core Info */}
        <View style={styles.cardTopSection}>
          <View style={styles.staffAvatar}>
            <User size={28} color={Colors.dark.text} />
          </View>
          <View style={styles.staffMainInfo}>
            <Text style={styles.staffName} numberOfLines={1}>{member.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
              <Text style={styles.roleBadgeText}>{member.role.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.cardMiddleSection}>
          <View style={styles.contactRow}>
            <Mail size={13} color={Colors.dark.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{member.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone size={13} color={Colors.dark.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{member.phone}</Text>
          </View>
        </View>

        {/* Bottom Section: Date and Status */}
        <View style={styles.cardBottomSection}>
          <Text style={styles.joinDateText}>Joined {member.joinDate}</Text>
          <View style={[
            styles.statusBadge,
            member.status === 'approved' ? styles.statusApproved :
              member.status === 'fired' ? styles.statusFired : styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              member.status === 'approved' ? { color: '#10B981' } :
                member.status === 'fired' ? { color: '#EF4444' } : { color: '#F59E0B' }
            ]}>
              {member.status === 'approved' ? `✓ ${t('common.approved', { defaultValue: 'Approved' })}` :
                member.status === 'fired' ? `✕ ${t('manager.staff.status.fired', { defaultValue: 'Fired' })}` : `⏱ ${t('manager.staff.status.pending', { defaultValue: 'Pending' })}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons for Owner */}
      {isOwnerView && (
        <View style={styles.actionButtonsContainer}>
          {/* Approve Button */}
          {member.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButtonFull, styles.approveButtonBg]}
              onPress={(e) => handleApproveClick(member.id, e)}
            >
              <Text style={styles.actionButtonText}>{t('common.approve', { defaultValue: 'Approve' })}</Text>
            </TouchableOpacity>
          )}

          {/* Fire Button - Only for non-fired staff */}
          {member.status !== 'fired' && (
            <TouchableOpacity
              style={[styles.actionButtonFull, styles.fireButtonBg, member.status === 'pending' && { marginTop: 8 }]}
              onPress={() => handleFireStaff(member)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <UserX size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>{t('manager.staff.fireStaff', { defaultValue: 'Fire Staff' })}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Reinstate Button - Only for fired staff */}
          {member.status === 'fired' && (
            <TouchableOpacity
              style={[styles.actionButtonFull, styles.approveButtonBg]}
              onPress={() => handleReinstateStaff(member)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <UserPlus size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>{t('manager.staff.reinstate', { defaultValue: 'Reinstate' })}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
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
          {isOwnerView ? t('manager.staff.title') : `${t('manager.owner.staff')} (${t('login.manager')})`}
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
            placeholder={t('common.search')}
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
          <TouchableOpacity
            style={[styles.statCard, selectedStatus === 'all' && styles.statCardActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.statValue, selectedStatus === 'all' && styles.statTextActive]}>{activeStaff}</Text>
            <Text style={[styles.statLabel, selectedStatus === 'all' && styles.statTextActive]}>{t('common.total')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedStatus === 'pending' && styles.statCardActive]}
            onPress={() => setSelectedStatus('pending')}
          >
            <Text style={[styles.statValue, selectedStatus === 'pending' && styles.statTextActive]}>{pendingStaff}</Text>
            <Text style={[styles.statLabel, selectedStatus === 'pending' && styles.statTextActive]}>{t('manager.orders.filter.pending')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedStatus === 'fired' && styles.statCardActive]}
            onPress={() => setSelectedStatus('fired')}
          >
            <Text style={[styles.statValue, selectedStatus === 'fired' && styles.statTextActive]}>{firedStaff}</Text>
            <Text style={[styles.statLabel, selectedStatus === 'fired' && styles.statTextActive]}>{t('manager.staff.status.fired', { defaultValue: 'Fired' })}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          renderItem={renderStaffItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={fetchStaff}
        />
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('manager.staff.addStaff')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder={t('manager.staff.name')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={formName}
                onChangeText={setFormName}
              />
              <TextInput
                style={styles.input}
                placeholder={t('manager.staff.email')}
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="email-address"
                value={formEmail}
                onChangeText={setFormEmail}
              />
              <TextInput
                style={styles.input}
                placeholder={t('manager.staff.phone')}
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="phone-pad"
                value={formPhone}
                onChangeText={setFormPhone}
              />

              <Text style={styles.modalLabel}>{t('manager.staff.role')}</Text>
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
                    placeholder={t('manager.staff.newDesignationPlaceholder', { defaultValue: 'New designation (optional)' })}
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newDesignation}
                    onChangeText={setNewDesignation}
                  />
                  <TouchableOpacity style={styles.addDesignationButton} onPress={handleAddDesignation}>
                    <Text style={styles.addDesignationText}>{t('common.add', { defaultValue: 'Add' })}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.modalAddButton} onPress={handleAddStaff}>
                <Text style={styles.modalAddButtonText}>
                  {isOwnerView ? t('manager.staff.addStaff') : t('manager.staff.submitForApproval', { defaultValue: 'Send for Approval' })}
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
              <Text style={styles.modalTitle}>{t('manager.staff.editStaff')}</Text>
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
                placeholder={t('manager.staff.name')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={formName}
                onChangeText={setFormName}
              />
              <TextInput
                style={styles.input}
                placeholder={t('manager.staff.email')}
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="email-address"
                value={formEmail}
                onChangeText={setFormEmail}
              />
              <TextInput
                style={styles.input}
                placeholder={t('manager.staff.phone')}
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="phone-pad"
                value={formPhone}
                onChangeText={setFormPhone}
              />

              <Text style={styles.modalLabel}>{t('manager.staff.role')}</Text>
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

              <TouchableOpacity style={styles.modalAddButton} onPress={handleUpdateStaff}>
                <Text style={styles.modalAddButtonText}>{t('common.save', { defaultValue: 'Save' })}</Text>
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
              <Text style={styles.confirmationTitle}>{t('manager.staff.approveAccess', { defaultValue: 'Approve Access?' })}</Text>
            </View>

            <Text style={styles.confirmationText}>
              {t('manager.staff.approveMessage', { defaultValue: 'Are you sure you want to approve this staff member? They will gain access to the system based on their assigned role.' })}
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmApproval}
              >
                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
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
    gap: 12,
    position: 'relative', // For absolute positioning of edit button
  },
  editButtonTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    zIndex: 10,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 40, // Space for edit button
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
    marginTop: 4,
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
  statusFired: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
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
  actionButtonsContainer: {
    marginTop: 8,
    gap: 8,
  },
  actionButtonFull: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonBg: {
    backgroundColor: '#10B981',
  },
  fireButtonBg: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statCardActive: {
    backgroundColor: Colors.dark.primary + '20', // Light opacity primary
    borderColor: Colors.dark.primary,
  },
  statTextActive: {
    color: Colors.dark.primary,
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
