import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional import - only load if available
let BluetoothManager: any = null;
let BluetoothEscposPrinter: any = null;
let isPrinterAvailable = false;

// Try to load the printer module
try {
    const printerModule = require('react-native-bluetooth-escpos-printer');
    BluetoothManager = printerModule.BluetoothManager;
    BluetoothEscposPrinter = printerModule.BluetoothEscposPrinter;
    isPrinterAvailable = true;
} catch (error) {
    console.log('Thermal printer module not available (requires dev build)');
    isPrinterAvailable = false;
}

const PRINTER_STORAGE_KEY = '@thermal_printer_device';

export interface PrinterDevice {
    address: string;
    name: string;
}

export interface PrinterStatus {
    isConnected: boolean;
    device: PrinterDevice | null;
}

class ThermalPrinterService {
    private currentDevice: PrinterDevice | null = null;

    /**
     * Check if thermal printer is available
     */
    isAvailable(): boolean {
        return isPrinterAvailable;
    }

    /**
     * Get availability message
     */
    getAvailabilityMessage(): string {
        if (!isPrinterAvailable) {
            return 'Thermal printer requires a development build. Build the app with EAS to enable printing.';
        }
        return 'Thermal printer ready';
    }

    /**
     * Request Bluetooth permissions (Android)
     */
    async requestBluetoothPermissions(): Promise<boolean> {
        if (!isPrinterAvailable) {
            throw new Error(this.getAvailabilityMessage());
        }
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } catch (err) {
                console.warn('Bluetooth permission error:', err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
    }

    /**
     * Enable Bluetooth
     */
    async enableBluetooth(): Promise<boolean> {
        try {
            await BluetoothManager.enableBluetooth();
            return true;
        } catch (error) {
            console.error('Error enabling Bluetooth:', error);
            return false;
        }
    }

    /**
     * Check if Bluetooth is enabled
     */
    async isBluetoothEnabled(): Promise<boolean> {
        try {
            return await BluetoothManager.isBluetoothEnabled();
        } catch (error) {
            console.error('Error checking Bluetooth status:', error);
            return false;
        }
    }

    /**
     * Scan for available Bluetooth devices
     */
    async scanDevices(): Promise<PrinterDevice[]> {
        try {
            const hasPermission = await this.requestBluetoothPermissions();
            if (!hasPermission) {
                throw new Error('Bluetooth permissions not granted');
            }

            const isEnabled = await this.isBluetoothEnabled();
            if (!isEnabled) {
                await this.enableBluetooth();
            }

            const pairedDevices = await BluetoothManager.list();
            return pairedDevices.map((device: any) => ({
                address: device.address,
                name: device.name || 'Unknown Device',
            }));
        } catch (error) {
            console.error('Error scanning devices:', error);
            throw error;
        }
    }

    /**
     * Connect to a printer device
     */
    async connectToPrinter(device: PrinterDevice): Promise<boolean> {
        try {
            await BluetoothManager.connect(device.address);
            this.currentDevice = device;

            // Save device to storage for auto-reconnect
            await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(device));

            return true;
        } catch (error) {
            console.error('Error connecting to printer:', error);
            throw error;
        }
    }

    /**
     * Disconnect from printer
     */
    async disconnect(): Promise<void> {
        try {
            await BluetoothManager.disconnect();
            this.currentDevice = null;
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    /**
     * Get saved printer device
     */
    async getSavedPrinter(): Promise<PrinterDevice | null> {
        try {
            const deviceStr = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
            if (deviceStr) {
                return JSON.parse(deviceStr);
            }
            return null;
        } catch (error) {
            console.error('Error getting saved printer:', error);
            return null;
        }
    }

    /**
     * Auto-connect to saved printer
     */
    async autoConnect(): Promise<boolean> {
        try {
            // Check if already connected
            const isConnected = await BluetoothManager.isBluetoothEnabled();
            if (!isConnected) {
                await this.enableBluetooth();
            }

            // Try to get saved device
            const savedDevice = await this.getSavedPrinter();
            if (!savedDevice) {
                return false;
            }

            // Try to connect
            await this.connectToPrinter(savedDevice);
            return true;
        } catch (error) {
            console.error('Auto-connect failed:', error);
            return false;
        }
    }

    /**
     * Check printer connection status
     */
    async getConnectionStatus(): Promise<PrinterStatus> {
        try {
            const isEnabled = await this.isBluetoothEnabled();
            const savedDevice = await this.getSavedPrinter();

            return {
                isConnected: isEnabled && this.currentDevice !== null,
                device: this.currentDevice || savedDevice,
            };
        } catch (error) {
            return {
                isConnected: false,
                device: null,
            };
        }
    }

    /**
     * Print receipt text
     */
    async printReceipt(receiptText: string): Promise<void> {
        try {
            // Try auto-connect first
            if (!this.currentDevice) {
                const connected = await this.autoConnect();
                if (!connected) {
                    throw new Error('Not connected to printer. Please select a printer first.');
                }
            }

            // Print using ESC/POS commands
            await BluetoothEscposPrinter.printerInit();
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

            // Print receipt content line by line
            const lines = receiptText.split('\n');
            for (const line of lines) {
                await BluetoothEscposPrinter.printText(line + '\n', {});
            }

            // Feed paper and cut (if supported)
            await BluetoothEscposPrinter.printText('\n\n\n', {});
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    /**
     * Clear saved printer
     */
    async clearSavedPrinter(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PRINTER_STORAGE_KEY);
            this.currentDevice = null;
        } catch (error) {
            console.error('Error clearing saved printer:', error);
        }
    }
}

export default new ThermalPrinterService();
