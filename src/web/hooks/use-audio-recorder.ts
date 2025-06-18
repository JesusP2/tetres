import { useCallback, useEffect, useRef, useState } from 'react';
import RecordRTC from 'recordrtc';
import { toast } from 'sonner';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  duration: number;
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  error: string | null;
}

export function useAudioRecorder(
  onAudioReady?: (audioBlob: Blob) => void
): UseAudioRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }
    
    setDuration(0);
    startTimeRef.current = 0;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingState('processing');
      
      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      
      streamRef.current = stream;
      
      // Initialize RecordRTC
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        timeSlice: 1000,
        checkForInactiveTracks: true,
      });
      
      recorderRef.current.startRecording();
      
      // Start duration tracking
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
      
      setRecordingState('recording');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      setRecordingState('error');
      cleanup();
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast.error('Microphone permission denied. Please allow microphone access and try again.');
      } else {
        toast.error('Failed to start recording. Please check your microphone.');
      }
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current || recordingState !== 'recording') {
      return;
    }
    
    setRecordingState('processing');
    
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current?.getBlob();
      
      if (blob && blob.size > 0) {
        toast.promise(onAudioReady?.(blob), {
          loading: 'Processing audio...',
          success: 'Audio processed successfully',
          error: 'Failed to process audio',
        });
      } else {
        setError('Recording failed - no audio data');
        setRecordingState('error');
        toast.error('Recording failed - no audio captured');
      }
      
      cleanup();
      setRecordingState('idle');
    });
  }, [recordingState, duration, onAudioReady, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    recordingState,
    duration,
    startRecording,
    stopRecording,
    isRecording: recordingState === 'recording',
    error,
  };
} 
