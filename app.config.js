const { loadEnv } = require('./scripts/loadEnv');

loadEnv();

function intOrFallback(value, fallback) {
    const parsed = parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = ({ config }) => {
    const envAppName = process.env.EXPO_PUBLIC_APP_NAME || 'The Cheese Town';
    const envAppVersion = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';

    const androidVersionCode = intOrFallback(
        process.env.EXPO_PUBLIC_ANDROID_VERSION_CODE,
        3
    );

    const iosBuildNumber = process.env.EXPO_PUBLIC_IOS_BUILD_NUMBER;

    return {
        name: envAppName,
        slug: 'the-cheese-town',
        version: envAppVersion,
        orientation: 'portrait',
        icon: './assets/images/logo.png',
        scheme: 'myapp',
        userInterfaceStyle: 'dark',
        splash: {
            image: './assets/images/logo.png',
            resizeMode: 'contain',
            backgroundColor: '#121212'
        },
        runtimeVersion: '1.0.0', // Locked to 1.0.0 for OTA compatibility
        updates: {
            enabled: true,
            checkAutomatically: 'ON_ERROR_RECOVERY',
            fallbackToCacheTimeout: 0,
            url: 'https://u.expo.dev/3a81c4a5-1d0b-4303-a288-3eab17e1ed8d'
        },
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            infoPlist: {
                UIViewControllerBasedStatusBarAppearance: false,
                UIStatusBarStyle: 'UIStatusBarStyleLightContent'
            },
            ...(iosBuildNumber ? { buildNumber: String(iosBuildNumber) } : {})
        },
        android: {
            versionCode: androidVersionCode,
            package: 'com.cheesetown.app',
            googleServicesFile: './google-services.json',
            adaptiveIcon: {
                foregroundImage: './assets/images/logo.png',
                backgroundColor: '#121212'
            },
            permissions: [
                'VIBRATE',
                'READ_MEDIA_IMAGES',
                'READ_MEDIA_AUDIO',
                'READ_MEDIA_VIDEO',
                'READ_EXTERNAL_STORAGE',
                'WRITE_EXTERNAL_STORAGE',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
                'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
                'android.permission.READ_MEDIA_IMAGES',
                'android.permission.READ_MEDIA_VIDEO',
                'android.permission.READ_MEDIA_AUDIO'
            ]
        },
        web: {
            bundler: 'metro',
            output: 'single',
            favicon: './assets/images/favicon.png'
        },
        plugins: [
            'expo-router',
            'expo-font',
            'expo-web-browser',
            'expo-notifications',
            [
                'expo-media-library',
                {
                    photosPermission: 'Allow The Cheese Town to access your photos to save QR codes.',
                    savePhotosPermission: 'Allow The Cheese Town to save QR codes to your gallery.',
                    isAccessMediaLocationEnabled: false
                }
            ],
            'expo-asset'
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            router: {},
            eas: {
                projectId: '3a81c4a5-1d0b-4303-a288-3eab17e1ed8d'
            },
            env: {
                appName: envAppName,
                appVersion: envAppVersion
            }
        }
    };
};
