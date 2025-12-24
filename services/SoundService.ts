import { AudioPlayer, createAudioPlayer } from 'expo-audio';

class SoundService {
    private static instance: SoundService;
    private player: AudioPlayer | null = null;
    private soundSource = require('../assets/sounds/belli.m4a');

    private constructor() { }

    static getInstance(): SoundService {
        if (!SoundService.instance) {
            SoundService.instance = new SoundService();
        }
        return SoundService.instance;
    }

    async loadSound() {
        try {
            // No direct load needed in expo-audio for creating players on demand, 
            // but we can pre-create the player here if desired.
            // For now, we'll create it when needed or reuse if possible.
            if (!this.player) {
                this.player = createAudioPlayer(this.soundSource);
            }

            // Configure audio mode
            // Note: expo-audio handles audio mode differently or defaults might be sufficient.
            // We can explicitly set category if needed, but expo-audio often defaults well.
            // If needed: AudioModule.setAudioModeAsync({ ... }) - check docs if available/needed.

        } catch (error) {
            console.error('Error loading sound:', error);
        }
    }

    async playNotificationSound() {
        try {
            // Create player if not exists
            if (!this.player) {
                this.player = createAudioPlayer(this.soundSource);
            }

            // expo-audio players can be played directly. 
            // They handle state better.
            this.player.play();

        } catch (error) {
            console.error('Error playing sound:', error);
            // Retry logic could be simpler: create new player
            try {
                this.player = createAudioPlayer(this.soundSource);
                this.player.play();
            } catch (e) {
                console.error('Retry failed:', e);
            }
        }
    }

    async unload() {
        // expo-audio players are garbage collected or can be stopped.
        // Explicit release might not be strictly necessary like unloadAsync,
        // but stopping is good practice.
        if (this.player) {
            this.player.pause(); // or stop if available in method signature
            this.player = null;
        }
    }
}

export const soundService = SoundService.getInstance();
