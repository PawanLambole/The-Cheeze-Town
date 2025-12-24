import { Audio } from 'expo-av';

class SoundService {
    private static instance: SoundService;
    private sound: Audio.Sound | null = null;

    private constructor() { }

    static getInstance(): SoundService {
        if (!SoundService.instance) {
            SoundService.instance = new SoundService();
        }
        return SoundService.instance;
    }

    async loadSound() {
        try {
            // Unload if already loaded to avoid memory leaks or duplicate sounds
            if (this.sound) {
                await this.sound.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/belli.m4a'),
                { shouldPlay: false }
            );
            this.sound = sound;

            // Configure audio mode to play even if switch is on silent
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

        } catch (error) {
            console.error('Error loading sound:', error);
        }
    }

    async playNotificationSound() {
        try {
            if (!this.sound) {
                await this.loadSound();
            }

            if (this.sound) {
                // Reset to start if already played
                await this.sound.setPositionAsync(0);
                await this.sound.playAsync();
            }
        } catch (error) {
            console.error('Error playing sound:', error);
            // Try enabling again in case of error
            await this.loadSound();
        }
    }

    async unload() {
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }
    }
}

export const soundService = SoundService.getInstance();
