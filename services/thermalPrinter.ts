/**
 * Thermal Printer Service
 * Formats and generates kitchen order receipts for thermal printers
 * Optimized for 58mm thermal printers (common in restaurant POS systems)
 */

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface PrintableOrder {
    orderId: string;
    tableNo?: number | string;
    customerName?: string;
    items: OrderItem[];
    totalAmount: number;
    timestamp?: Date;
    orderType?: 'dine-in' | 'takeaway' | 'delivery';
}

interface PaymentReceipt {
    orderId: string;
    tableNo?: number | string;
    customerName?: string;
    items: OrderItem[];
    subtotal: number;
    tax?: number;
    discount?: number;
    totalAmount: number;
    paymentMethod: string;
    transactionId: string;
    timestamp?: Date;
    orderType?: 'dine-in' | 'takeaway' | 'delivery';
}

/**
 * Formats a receipt for thermal printing
 * Creates a text-based receipt suitable for 58mm thermal printers
 */
export function formatThermalReceipt(order: PrintableOrder): string {
    const width = 30; // Reduced to 30 for better safety on mobile printers
    const timestamp = order.timestamp || new Date();

    // Helper functions
    const center = (text: string): string => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    };

    const line = (char: string = '-'): string => char.repeat(width);

    const leftRight = (left: string, right: string): string => {
        const spaces = Math.max(1, width - left.length - right.length);
        return left + ' '.repeat(spaces) + right;
    };

    // Date formatting
    const dateStr = timestamp.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const timeStr = timestamp.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Build receipt
    let receipt = '\n';

    // Header
    receipt += center('*** KITCHEN ORDER ***') + '\n';
    receipt += center('The Cheeze Town') + '\n';
    receipt += center(`${dateStr}  ${timeStr}`) + '\n'; // Date/Time at top
    receipt += line('=') + '\n';

    // Order Info
    receipt += leftRight('Order #:', order.orderId) + '\n';

    if (order.tableNo) {
        const tableText = typeof order.tableNo === 'number'
            ? `Table ${order.tableNo}`
            : order.tableNo;
        // Ensure table text fits
        receipt += leftRight('Table:', tableText.toString()) + '\n';
    }

    if (order.customerName) {
        receipt += leftRight('Customer:', order.customerName.substring(0, 15)) + '\n';
    }

    receipt += line('=') + '\n';

    // Items Header
    receipt += leftRight('ITEM', 'QTY') + '\n';
    receipt += line('-') + '\n';

    // Items List
    order.items.forEach(item => {
        // Item name on its own line if long, or left-aligned
        receipt += item.name + '\n';

        // Quantity and variant details indented
        receipt += leftRight(`  Price: ₹${item.price}`, `x${item.quantity}`) + '\n';

        // Optional: formatting for very distinct spacing
        // receipt += leftRight(item.name.substring(0, 20), `x${item.quantity}`) + '\n';
    });

    receipt += line('-') + '\n';

    // Total
    receipt += leftRight('TOTAL:', `₹${order.totalAmount.toFixed(2)}`) + '\n';
    receipt += line('=') + '\n';

    // Order Type
    if (order.orderType) {
        receipt += '\n';
        receipt += center(`[ ${order.orderType.toUpperCase()} ]`) + '\n';
    }

    // Footer
    receipt += '\n';
    receipt += center('*** PREPARE ASAP ***') + '\n';
    receipt += '\n\n\n';

    return receipt;
}

/**
 * Generates a compact one-line summary for added items
 * Used when items are added to an existing order
 */
export function formatAddedItemsReceipt(
    orderId: string,
    tableNo: number | string,
    addedItems: OrderItem[]
): string {
    const width = 30; // Reduced to 30 for consistency
    const timestamp = new Date();

    const center = (text: string): string => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    };

    const line = (char: string = '-'): string => char.repeat(width);

    const leftRight = (left: string, right: string): string => {
        const spaces = Math.max(1, width - left.length - right.length);
        return left + ' '.repeat(spaces) + right;
    };

    // Date/Time formatting
    const timeStr = timestamp.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
    const dateStr = timestamp.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit'
    });

    let receipt = '\n';

    // Header
    receipt += center('*** ADDED ITEMS ***') + '\n';
    receipt += center('The Cheeze Town') + '\n';
    receipt += center(`${dateStr}  ${timeStr}`) + '\n';
    receipt += line('=') + '\n';

    // Order Info
    receipt += leftRight('Order #:', orderId) + '\n';
    const tableText = typeof tableNo === 'number' ? `Table ${tableNo}` : tableNo;
    receipt += leftRight('Table:', tableText.toString()) + '\n';

    receipt += line('=') + '\n';

    // Items Header
    receipt += leftRight('NEW ITEMS', 'QTY') + '\n';
    receipt += line('-') + '\n';

    // Items List
    addedItems.forEach(item => {
        // Item Name
        receipt += item.name + '\n';
        // Qty
        receipt += leftRight('', `x${item.quantity}`) + '\n';
    });

    receipt += line('=') + '\n';
    receipt += '\n';
    receipt += center('*** PREPARE ASAP ***') + '\n';
    receipt += '\n\n\n';

    return receipt;
}

/**
 * Prints a receipt to a thermal printer
 * In React Native, you would typically use a library like:
 * - react-native-bluetooth-escpos-printer (for Bluetooth printers)
 * - react-native-star-prnt (for Star Micronics printers)
 * - react-native-thermal-receipt-printer
 * 
 * For now, this function logs the receipt and can be extended with actual printer integration
 */
export async function printKitchenReceipt(
    order: PrintableOrder,
    options: { silent?: boolean } = {}
): Promise<{ success: boolean; message: string; receipt?: string }> {
    try {
        const receipt = formatThermalReceipt(order);

        // Log the receipt (for development/debugging)
        if (!options.silent) {
            console.log('=== KITCHEN RECEIPT ===');
            console.log(receipt);
            console.log('======================');
        }

        // TODO: Integrate with actual thermal printer library
        // Example integration points:
        // 
        // For Bluetooth ESC/POS printers:
        // await BluetoothEscposPrinter.printText(receipt, {});
        // await BluetoothEscposPrinter.printText("\n\n\n", {});
        // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        // await BluetoothEscposPrinter.printText(".", {});
        // await BluetoothEscposPrinter.printText("\n", {});
        //
        // For WiFi/Network printers:
        // await fetch('http://printer-ip:9100', {
        //   method: 'POST',
        //   body: receipt,
        // });

        return {
            success: true,
            message: 'Kitchen receipt generated successfully',
            receipt
        };
    } catch (error) {
        console.error('Error printing kitchen receipt:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to print receipt'
        };
    }
}

/**
 * Prints an "added items" receipt for existing orders
 */
export async function printAddedItemsReceipt(
    orderId: string,
    tableNo: number | string,
    addedItems: OrderItem[],
    options: { silent?: boolean } = {}
): Promise<{ success: boolean; message: string; receipt?: string }> {
    try {
        const receipt = formatAddedItemsReceipt(orderId, tableNo, addedItems);

        // Log the receipt (for development/debugging)
        if (!options.silent) {
            console.log('=== ADDED ITEMS RECEIPT ===');
            console.log(receipt);
            console.log('===========================');
        }

        // TODO: Integrate with actual thermal printer library
        // (same as printKitchenReceipt)

        return {
            success: true,
            message: 'Added items receipt generated successfully',
            receipt
        };
    } catch (error) {
        console.error('Error printing added items receipt:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to print receipt'
        };
    }
}

/**
 * Preview receipt as formatted text (for testing/debugging)
 */
export function previewReceipt(order: PrintableOrder): string {
    return formatThermalReceipt(order);
}

/**
 * Preview added items receipt as formatted text (for testing/debugging)
 */
export function previewAddedItemsReceipt(
    orderId: string,
    tableNo: number | string,
    addedItems: OrderItem[]
): string {
    return formatAddedItemsReceipt(orderId, tableNo, addedItems);
}

/**
 * Formats a payment receipt for customer
 * Creates a text-based receipt suitable for 58mm thermal printers
 */
export function formatPaymentReceipt(payment: PaymentReceipt): string {
    const width = 30; // Reduced to 30 for consistency
    const timestamp = payment.timestamp || new Date();

    // Helper functions
    const center = (text: string): string => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    };

    const line = (char: string = '-'): string => char.repeat(width);

    const leftRight = (left: string, right: string): string => {
        const spaces = Math.max(1, width - left.length - right.length);
        return left + ' '.repeat(spaces) + right;
    };

    // Date formatting
    const dateStr = timestamp.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const timeStr = timestamp.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Build receipt
    let receipt = '\n';

    // Header
    receipt += center('THE CHEEZE TOWN') + '\n';
    receipt += center('Payment Receipt') + '\n';
    receipt += center(`${dateStr}  ${timeStr}`) + '\n';
    receipt += line('=') + '\n';

    // Order Info
    receipt += leftRight('Order #:', payment.orderId) + '\n';

    if (payment.tableNo) {
        const tableText = typeof payment.tableNo === 'number'
            ? `Table ${payment.tableNo}`
            : payment.tableNo;
        receipt += leftRight('Table:', tableText.toString()) + '\n';
    }

    if (payment.customerName) {
        receipt += leftRight('Customer:', payment.customerName.substring(0, 15)) + '\n';
    }

    receipt += line('=') + '\n';

    // Items Header
    receipt += leftRight('ITEM', 'AMOUNT') + '\n';
    receipt += line('-') + '\n';

    // Items List
    payment.items.forEach(item => {
        // Item Name
        receipt += item.name + '\n';

        // Qty and Total Price
        const itemTotal = item.price * item.quantity;
        receipt += leftRight(`  ${item.quantity} x ₹${item.price}`, `₹${itemTotal.toFixed(2)}`) + '\n';
    });

    receipt += line('-') + '\n';

    // Subtotal
    receipt += leftRight('Subtotal:', `₹${payment.subtotal.toFixed(2)}`) + '\n';

    // Tax (if applicable)
    if (payment.tax && payment.tax > 0) {
        receipt += leftRight('Tax:', `₹${payment.tax.toFixed(2)}`) + '\n';
    }

    // Discount (if applicable)
    if (payment.discount && payment.discount > 0) {
        receipt += leftRight('Discount:', `-₹${payment.discount.toFixed(2)}`) + '\n';
    }

    receipt += line('=') + '\n';

    // Total
    receipt += leftRight('TOTAL:', `₹${payment.totalAmount.toFixed(2)}`) + '\n';
    receipt += line('=') + '\n';

    // Payment Details
    receipt += '\n';
    receipt += center('PAYMENT DETAILS') + '\n';
    receipt += line('-') + '\n';
    receipt += leftRight('Method:', payment.paymentMethod) + '\n';

    // Smart handling for Trans ID
    // 1. If short enough, one line
    // 2. If long, split or show last chars
    if (payment.transactionId.length <= (width - 10)) {
        receipt += leftRight('Trans ID:', payment.transactionId) + '\n';
    } else {
        receipt += 'Trans ID:' + '\n';
        receipt += payment.transactionId + '\n';
    }

    receipt += leftRight('Status:', 'PAID') + '\n';
    receipt += line('-') + '\n';

    // Footer
    receipt += '\n';
    receipt += center('Thank you for dining!') + '\n';
    receipt += center('Visit us again') + '\n';
    receipt += '\n';

    // Order Type
    if (payment.orderType) {
        receipt += center(`[ ${payment.orderType.toUpperCase()} ]`) + '\n';
    }

    receipt += '\n';
    receipt += '.\n'; // Printer cut mark
    receipt += '\n\n';

    return receipt;
}

/**
 * Generates payment receipt
 */
export async function printPaymentReceipt(
    payment: PaymentReceipt,
    options: { silent?: boolean } = {}
): Promise<{ success: boolean; message: string; receipt?: string }> {
    try {
        const receipt = formatPaymentReceipt(payment);

        // Log the receipt (for development/debugging)
        if (!options.silent) {
            console.log('=== PAYMENT RECEIPT ===');
            console.log(receipt);
            console.log('=======================');
        }

        // TODO: Integrate with actual thermal printer library
        // (same as printKitchenReceipt)

        return {
            success: true,
            message: 'Payment receipt generated successfully',
            receipt
        };
    } catch (error) {
        console.error('Error generating payment receipt:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate receipt'
        };
    }
}

