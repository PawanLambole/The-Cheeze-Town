import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

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
        // In a real app, you might wait for fonts or auth checks here
        async function prepare() {
            try {
                // No artificial delay needed for production
                // await new Promise(resolve => setTimeout(resolve, 2000));
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
            // 1. Hide the native splash screen immediately
            SplashScreen.hideAsync().then(() => {
                // 2. Start our JS-based animation from the same state
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 20, // Zoom out effect
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 500,
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
            {/* 
        This view sits behind the splash image. 
        Once the splash fades out, the children (App) will be revealed underneath if we structured it that way,
        but here we render children conditionally or absolute. 
        Actually, simplest is to render children absolutely *behind* the splash, 
        or just switch over. Transitioning is smoother if children are rendered.
      */}
            <View style={styles.appContainer}>
                {children}
            </View>

            <Animated.View
                style={[
                    styles.splashContainer,
                    {
                        opacity: fadeAnim,
                        // pointerEvents: 'none', // Ensure it doesn't block touches if it lingers
                    },
                ]}
            >
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
        backgroundColor: '#121212', // Match your app theme
    },
    appContainer: {
        flex: 1,
    },
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#121212', // Match your splash background color
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
    image: {
        width: 200, // Match the size of your icon on the native splash slightly needed
        height: 200,
    },
});
