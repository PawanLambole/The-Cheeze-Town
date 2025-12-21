
const tintColorLight = '#FFB800';
const tintColorDark = '#FFB800';

export const Colors = {
    light: {
        text: '#121212',
        background: '#FFFFFF',
        card: '#F9FAFB',
        tint: tintColorLight,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorLight,
        border: '#E5E7EB',
        primary: '#FFB800',
        secondary: '#1E1E1E',
        success: '#10B981',
        error: '#EF4444',
    },
    dark: {
        text: '#FFFFFF',
        textSecondary: '#A1A1AA',
        background: '#121212',
        card: '#1E1E1E',
        tint: tintColorDark,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorDark,
        border: '#2D2D2D',
        primary: '#FFB800',
        primarycontent: '#000000',
        secondary: '#27272A',
        success: '#10B981',
        error: '#EF4444',
        inputBackground: '#27272A',
    },
};

export const Spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const Layout = {
    radius: {
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
        circle: 9999,
    },
    shadow: {
        small: {
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 2,
        },
        medium: {
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,
            elevation: 6,
        },
        large: {
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 10,
            },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 10,
        }
    }
};
