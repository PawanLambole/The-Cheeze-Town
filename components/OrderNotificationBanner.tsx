import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface OrderNotificationBannerProps {
    visible: boolean;
    order: any;
    onDismiss: () => void;
    onTap?: () => void;
}

export default function OrderNotificationBanner({ visible, order, onDismiss, onTap }: OrderNotificationBannerProps) {
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();

            // Auto dismiss after 5 seconds
            const timer = setTimeout(() => {
                handleDismiss();
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    const handleTap = () => {
        handleDismiss();
        if (onTap) {
            onTap();
        }
    };

    if (!visible || !order) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleTap}
                style={styles.content}
            >
                <View style={styles.iconContainer}>
                    <Bell size={24} color={Colors.dark.primary} />
                    <View style={styles.pulse} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>🔔 New Order Arrived!</Text>
                    <Text style={styles.message}>
                        {order.customer_name ? `${order.customer_name} - ` : ''}
                        Table {order.table_id || 'N/A'}
                    </Text>
                    <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
                </View>

                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <X size={20} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        shadowColor: Colors.dark.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    pulse: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.dark.primary,
        opacity: 0.3,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 2,
    },
    orderNumber: {
        fontSize: 12,
        color: Colors.dark.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});
