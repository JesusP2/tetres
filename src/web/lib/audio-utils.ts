/**
 * Format duration in milliseconds to a readable string (mm:ss)
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Convert audio blob to FormData for upload
 */
export function createAudioFormData(audioBlob: Blob, filename?: string): FormData {
  const formData = new FormData();
  const audioFile = new File(
    [audioBlob], 
    filename || `audio_${Date.now()}.wav`,
    { type: audioBlob.type || 'audio/wav' }
  );
  
  formData.append('audio', audioFile);
  formData.append('duration', audioBlob.size.toString());
  formData.append('timestamp', new Date().toISOString());
  
  return formData;
}

/**
 * Check if browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
  try {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  } catch {
    return false;
  }
}

/**
 * Get audio recording constraints with fallbacks
 */
export function getAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: { ideal: 44100, min: 16000 },
      channelCount: { ideal: 1 },
    },
  };
} 