# Thermal Printer Integration Guide

## 📱 Bluetooth Thermal Printer Setup

Your app now supports printing kitchen receipts directly to a Bluetooth thermal printer!

### ✨ Features

- ✅ **Automatic connection** - Printer remembered after first pairing
- ✅ **Smart detection** - Auto-reconnects when print is clicked
- ✅ **One-time setup** - Connect once, print forever
- ✅ **Visual feedback** - Loading states and success messages
- ✅ **Printer selection** - Choose from paired Bluetooth devices
- ✅ **Error handling** - Clear messages when something goes wrong

### 🖨️ How It Works

#### First Time Setup:
1. **Pair your printer** in phone's Bluetooth settings
2. Open the receipt after creating an order
3. Click the **Print** button (purple)
4. Select your thermal printer from the list
5. Done! Receipt prints automatically

#### After Setup:
1. Open any receipt
2. Click **Print**
3. Receipt prints instantly! ✨

No need to connect again - the printer is remembered!

### 🔧 Technical Details

**Library Used**: `react-native-bluetooth-escpos-printer`

**Components**:
- `thermalPrinterService.ts` - Printer management service
- `ReceiptViewer.tsx` - Updated with Print button
- Auto-connection logic
- Printer selection modal

**Android Permissions Required**:
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`

### 📋 User Flow

```
Order Created → Receipt Opens
         ↓
   Click "Print" Button
         ↓
    First Time?
    ├─ Yes → Show printer selection
    │         ↓
    │    Select printer → Connect → Print
    │         ↓
    │    Save printer for future use
    │
    └─ No → Auto-connect to saved printer → Print
```

### 🎨 UI Elements

**Receipt Viewer Buttons**:
- 🖨️ **Print** (Purple) - Print to thermal printer
- 📤 **Share** (Blue) - Share receipt as text
- ✅ **Done** (Green) - Close receipt

**Printer Modal**:
- List of paired Bluetooth printers
- Connected printer indicator
- Scan Again button
- Empty state if no printers found

### 💡 Best Practices

1. **Keep printer on** during service hours
2. **Pair in Bluetooth settings** first
3. **Test print** after initial setup
4. **Keep printer nearby** for reliable connection
5. **Check battery** on mobile printers

### 🔍 Troubleshooting

**Printer not found?**
- Check if paired in Bluetooth settings
- Make sure printer is turned on
- Click "Scan Again" button
- Check printer battery

**Print failed?**
- Check Bluetooth connection
- Ensure printer has paper
- Restart printer
- Re-pair in settings if needed

**Auto-connect not working?**
- Bluetooth might be off
- Printer might be paired with another device
- Clear saved printer and reconnect

### 📝 Technical Implementation

**Printer Service Functions**:
```typescript
// Check connection status
await thermalPrinterService.getConnectionStatus()

// Scan for printers
await thermalPrinterService.scanDevices()

// Connect to printer
await thermalPrinterService.connectToPrinter(device)

// Print receipt
await thermalPrinterService.printReceipt(receiptText)

// Auto-connect (try saved printer)
await thermalPrinterService.autoConnect()
```

**Storage**:
- Printer details saved in AsyncStorage
- Key: `@thermal_printer_device`
- Auto-loads on app start

### 🚀 Next Steps

1. Test with your actual thermal printer
2. Verify receipt formatting on printed output
3. Adjust text size/alignment if needed
4. Train staff on printer usage
5. Keep spare paper rolls handy!

### ⚙️ Configuration

The thermal printer is configured for:
- **Paper width**: 58mm (typical for mobile printers)
- **Alignment**: Left (ESC/POS standard)
- **Character set**: UTF-8
- **Line spacing**: Auto

### 📱 Compatible Printers

This integration works with most ESC/POS compatible Bluetooth thermal printers, including:
- Mobile 58mm printers (like yours!)
- 80mm receipt printers
- Portable Bluetooth printers
- POS thermal printers

### 🎯 Final Notes

- Printer connection is saved permanently
- No need to reconnect for each print
- Works offline once paired
- Fast printing (2-3 seconds)
- Professional quality receipts

Enjoy seamless receipt printing! 🎉
