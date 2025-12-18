import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en/translation.json';
import mr from './locales/mr/translation.json';

const LANGUAGE_KEY = '@app_language';

// Get stored language
const getStoredLanguage = async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        return storedLanguage || 'mr'; // Default to Marathi
    } catch (error) {
        console.error('Error getting stored language:', error);
        return 'mr';
    }
};

// Initialize i18n
const initI18n = async () => {
    const storedLanguage = await getStoredLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources: {
                en: { translation: en },
                mr: { translation: mr },
            },
            lng: storedLanguage,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        });
};

// Initialize on import
initI18n();

// Save language preference
export const changeLanguage = async (language: string) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, language);
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error saving language:', error);
    }
};

export default i18n;
