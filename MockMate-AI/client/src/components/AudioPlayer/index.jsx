import { useEffect, useState } from 'react';

function AudioPlayer({ audioBase64, autoPlay = true, onEnded }) {
  const [audioInstance, setAudioInstance] = useState(null);

  useEffect(() => {
    if (!audioBase64) {
      return undefined;
    }

    if (audioInstance) {
      audioInstance.pause();
      audioInstance.src = '';
    }

    const binary = atob(audioBase64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    audio.onended = () => {
      onEnded?.();
    };

    setAudioInstance(audio);

    return () => {
      audio.pause();
      audio.src = '';
      URL.revokeObjectURL(url);
    };
  }, [audioBase64, autoPlay, onEnded]);

  return null;
}

export default AudioPlayer;
