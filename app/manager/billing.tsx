import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Banknote, Smartphone, X, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface BillItem {
  name: string;
  quantity: number;
  price: number;
}

export default function BillingScreen() {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const billItems: BillItem[] = [
    { name: 'Cheese Burger', quantity: 2, price: 250 },
    { name: 'French Fries', quantity: 1, price: 150 },
    { name: 'Cappuccino', quantity: 2, price: 180 },
  ];

  const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const discount = 50;
  const total = subtotal + tax - discount;

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Banknote },
    { id: 'card', name: 'Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
  ];

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <Text style={styles.billTable}>Table 5</Text>
          </View>

          <View style={styles.billItems}>
            {billItems.map((item, index) => (
              <View key={index} style={styles.billItem}>
                <View style={styles.billItemLeft}>
                  <Text style={styles.billItemName}>{item.name}</Text>
                  <Text style={styles.billItemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.billItemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.billSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (5%)</Text>
              <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>-₹{discount}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Add Discount</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Add Items</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={styles.payButtonText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountDisplay}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amountValue}>₹{total.toFixed(2)}</Text>
            </View>

            <View style={styles.paymentMethods}>
              {paymentMethods.map(method => {
                const Icon = method.icon;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethod,
                      selectedPaymentMethod === method.id && styles.paymentMethodSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                    <Icon size={24} color={selectedPaymentMethod === method.id ? '#000000' : Colors.dark.textSecondary} />
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === method.id && styles.paymentMethodTextSelected
                    ]}>
                      {method.name}
                    </Text>
                    {selectedPaymentMethod === method.id && (
                      <CheckCircle size={20} color="#000000" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, !selectedPaymentMethod && styles.confirmButtonDisabled]}
              disabled={!selectedPaymentMethod}
            >
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  billCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  billTable: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  billItems: {
    marginBottom: 20,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  billItemLeft: {
    flex: 1,
  },
  billItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  billItemQuantity: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  billItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  billSummary: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  actionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  payButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
  amountDisplay: {
    backgroundColor: Colors.dark.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  paymentMethodSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.dark.secondary,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
