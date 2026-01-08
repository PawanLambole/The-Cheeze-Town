const { loadEnv } = require('./scripts/loadEnv');

loadEnv();

const appJson = require('./app.json');

function intOrFallback(value, fallback) {
    const parsed = parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = ({ config }) => {
    const baseExpo = appJson.expo ?? config ?? {};

    const envAppName = process.env.EXPO_PUBLIC_APP_NAME;
    const envAppVersion = process.env.EXPO_PUBLIC_APP_VERSION;

    const appName = envAppName || baseExpo.name;
    const appVersion = envAppVersion || baseExpo.version;

    const androidVersionCode = intOrFallback(
        process.env.EXPO_PUBLIC_ANDROID_VERSION_CODE,
        baseExpo.android?.versionCode
    );

    const iosBuildNumber = process.env.EXPO_PUBLIC_IOS_BUILD_NUMBER;

    return {
        ...baseExpo,
        name: appName,
        version: appVersion,
        runtimeVersion: appVersion,
        android: {
            ...(baseExpo.android ?? {}),
            versionCode: androidVersionCode,
        },
        ios: {
            ...(baseExpo.ios ?? {}),
            ...(iosBuildNumber ? { buildNumber: String(iosBuildNumber) } : {}),
        },
        extra: {
            ...(baseExpo.extra ?? {}),
            env: {
                appName,
                appVersion,
            },
        },
    };
};
