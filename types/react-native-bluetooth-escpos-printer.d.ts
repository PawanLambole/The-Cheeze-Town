declare module 'react-native-bluetooth-escpos-printer' {
    export interface BluetoothDevice {
        address: string;
        name: string;
    }

    export class BluetoothManager {
        static isBluetoothEnabled(): Promise<boolean>;
        static enableBluetooth(): Promise<void>;
        static list(): Promise<BluetoothDevice[]>;
        static connect(address: string): Promise<void>;
        static disconnect(): Promise<void>;
    }

    export class BluetoothEscposPrinter {
        static ALIGN: {
            LEFT: number;
            CENTER: number;
            RIGHT: number;
        };

        static printerInit(): Promise<void>;
        static printerAlign(align: number): Promise<void>;
        static printText(text: string, options: any): Promise<void>;
        static printColumn(
            columnWidths: number[],
            columnAligns: number[],
            columnTexts: string[],
            options: any
        ): Promise<void>;
    }
}
