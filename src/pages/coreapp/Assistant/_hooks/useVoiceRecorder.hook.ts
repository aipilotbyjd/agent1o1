import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Records from the microphone and hands back the audio when stopped.
 * `isSupported` is false where the browser has no MediaRecorder.
 */
export const useVoiceRecorder = (onRecorded: (audio: Blob) => void) => {
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const recorder = useRef<MediaRecorder | null>(null);
	const chunks = useRef<Blob[]>([]);

	const isSupported =
		typeof window !== 'undefined' &&
		typeof window.MediaRecorder !== 'undefined' &&
		!!navigator.mediaDevices;

	const stopTracks = () => recorder.current?.stream.getTracks().forEach((track) => track.stop());

	const start = useCallback(async () => {
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const instance = new MediaRecorder(stream);
			chunks.current = [];
			instance.ondataavailable = (event) => {
				if (event.data.size > 0) chunks.current.push(event.data);
			};
			instance.onstop = () => {
				stopTracks();
				const audio = new Blob(chunks.current, { type: instance.mimeType || 'audio/webm' });
				if (audio.size > 0) onRecorded(audio);
			};
			recorder.current = instance;
			instance.start();
			setIsRecording(true);
		} catch {
			setError('microphone');
		}
	}, [onRecorded]);

	const stop = useCallback(() => {
		if (recorder.current?.state === 'recording') recorder.current.stop();
		setIsRecording(false);
	}, []);

	useEffect(() => () => stopTracks(), []);

	return { isSupported, isRecording, error, start, stop };
};
