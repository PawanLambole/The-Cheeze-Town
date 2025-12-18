import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Banknote, Smartphone, X, CheckCircle } from 'lucide-react-native';

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
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
                <X size={24} color="#6B7280" />
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
                    <Icon size={24} color={selectedPaymentMethod === method.id ? '#FDB813' : '#6B7280'} />
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === method.id && styles.paymentMethodTextSelected
                    ]}>
                      {method.name}
                    </Text>
                    {selectedPaymentMethod === method.id && (
                      <CheckCircle size={20} color="#FDB813" />
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  billTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  billTable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDB813',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  billItemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  billItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  billSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDB813',
  },
  actionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  payButton: {
    backgroundColor: '#FDB813',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
    color: '#1F2937',
  },
  amountDisplay: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDB813',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FDB813',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
