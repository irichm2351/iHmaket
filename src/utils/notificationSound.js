import { Audio } from 'expo-av';

// Create singleton for sound instance
let soundObject = null;

// Initialize audio session
const initAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error('Error setting audio mode:', error);
  }
};

// Play a notification sound
export const playNotificationSound = async (type = 'message') => {
  try {
    // Initialize audio session if not done
    if (soundObject === null) {
      await initAudioSession();
    }

    // Use different tones for different notification types
    const soundUri = type === 'booking' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' // Booking notification
      : 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Message notification

    // If we already have a sound loaded, unload it
    if (soundObject) {
      try {
        await soundObject.unloadAsync();
      } catch (error) {
        // Ignore unload errors
      }
    }

    // Create a new sound object
    soundObject = new Audio.Sound();
    
    // Load the sound
    await soundObject.loadAsync({ uri: soundUri });
    
    // Play the sound
    await soundObject.playAsync();

    // Clean up after playing
    soundObject.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        try {
          await soundObject.unloadAsync();
          soundObject = null;
        } catch (error) {
          console.error('Error unloading sound:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Silently fail - don't break the app if sound fails
  }
};

// Use a simple built-in beep for now (more reliable)
export const playSimpleNotificationSound = async (type = 'message') => {
  try {
    // Initialize audio session if not done
    await initAudioSession();

    // Use system sounds or a simple sine wave
    const { playAsync } = require('expo-av');
    
    // For now, we'll use a light haptic feedback as backup
    // since playing arbitrary system sounds is limited
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    // Play a simple tone URL (free notification sound)
    if (soundObject) {
      try {
        await soundObject.unloadAsync();
      } catch (error) {
        // ignore
      }
    }

    soundObject = new Audio.Sound();
    
    // Use a notification sound from a public CDN
    const soundUri = type === 'booking'
      ? 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d73348aab3.mp3'
      : 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d73348aab3.mp3';

    await soundObject.loadAsync({ uri: soundUri });
    await soundObject.playAsync();

    soundObject.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        try {
          await soundObject.unloadAsync();
          soundObject = null;
        } catch (error) {
          // ignore
        }
      }
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// Stop the current sound
export const stopNotificationSound = async () => {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
  } catch (error) {
    console.error('Error stopping sound:', error);
  }
};
