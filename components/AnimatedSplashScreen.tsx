import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
    /* reloading the app might trigger some race conditions, ignore them */
});

interface AnimatedSplashScreenProps {
    children: React.ReactNode;
    onAnimationComplete?: () => void;
}

export default function AnimatedSplashScreen({ children, onAnimationComplete }: AnimatedSplashScreenProps) {
    const [appReady, setAppReady] = useState(false);
    const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Simulate/Wait for app initialization
        async function prepare() {
            try {
                // No artificial delay needed for production
            } catch (e) {
                console.warn(e);
            } finally {
                setAppReady(true);
            }
        }

        prepare();
    }, []);

    useEffect(() => {
        if (appReady) {
            SplashScreen.hideAsync().then(() => {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 20,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setSplashAnimationComplete(true);
                    if (onAnimationComplete) {
                        onAnimationComplete();
                    }
                });
            });
        }
    }, [appReady]);

    if (splashAnimationComplete) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.appContainer}>
                {children}
            </View>

            <Animated.View
                style={[
                    styles.splashContainer,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                {/* Background Gradient */}
                {/* Note: We use absolute View with background color if LinearGradient isn't available, 
                     but here we assume it is since app uses it. 
                     However, `AnimatedSplashScreen` acts as top-level.
                 */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
                    {/* shapes */}
                    <View style={styles.backgroundShape1} />
                    <View style={styles.backgroundShape2} />
                </View>

                {/* Logo Glow */}
                <Animated.View style={[styles.logoGlow, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]} />

                <Animated.Image
                    source={require('@/assets/images/logo.png')}
                    style={[
                        styles.image,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    appContainer: {
        flex: 1,
    },
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
    image: {
        width: 180,
        height: 180,
    },
    // Background Elements (Matches Login)
    backgroundShape1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#EAB308', // Primary Color
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    backgroundShape2: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#EAB308', // Gold
        opacity: 0.1,
        transform: [{ scale: 1.2 }],
    },
    logoGlow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#EAB308',
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
});
