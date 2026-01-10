import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';

export type PendingOrderNotification = {
    orderId: number;
    type?: string;
};

type OrderNotificationContextType = {
    pending: PendingOrderNotification | null;
    consume: () => void;
};

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export function OrderNotificationProvider({ children }: { children: React.ReactNode }) {
    const [pending, setPending] = useState<PendingOrderNotification | null>(null);

    const lastHandledIdRef = useRef<string | null>(null);

    const handleResponse = useCallback((response: Notifications.NotificationResponse | null | undefined) => {
        if (!response) return;

        const notificationId = response.notification.request.identifier;
        if (lastHandledIdRef.current === notificationId) return;
        lastHandledIdRef.current = notificationId;

        const data: any = response.notification.request.content.data;
        const rawOrderId = data?.orderId;

        const orderId = typeof rawOrderId === 'string' ? Number(rawOrderId) : rawOrderId;
        if (!orderId || Number.isNaN(orderId)) return;

        setPending({
            orderId,
            type: typeof data?.type === 'string' ? data.type : undefined,
        });
    }, []);

    useEffect(() => {
        let mounted = true;

        // Handle cold-start: user taps a notification while the app is closed.
        Notifications.getLastNotificationResponseAsync()
            .then((resp) => {
                if (!mounted) return;
                handleResponse(resp);
            })
            .catch(() => {
                // ignore
            });

        const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
            handleResponse(resp);
        });

        return () => {
            mounted = false;
            sub.remove();
        };
    }, [handleResponse]);

    const consume = useCallback(() => {
        setPending(null);
    }, []);

    const value = useMemo(() => ({ pending, consume }), [pending, consume]);

    return <OrderNotificationContext.Provider value={value}>{children}</OrderNotificationContext.Provider>;
}

export function useOrderNotification() {
    const ctx = useContext(OrderNotificationContext);
    if (!ctx) throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
    return ctx;
}
