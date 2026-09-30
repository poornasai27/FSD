import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const MAX_RECORD_TIME = 300;
const MIN_RECORD_TIME = 3;

const pickSupportedMimeType = () => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];

  const supported = candidates.find(
    (mimeType) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)
  );

  return supported || '';
};

function VoiceRecorder({ onSubmit, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    let timerId = null;
    if (isRecording) {
      timerId = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= MAX_RECORD_TIME) {
            stopRecording();
            toast.success('Maximum recording time reached (5 minutes).');
            return MAX_RECORD_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isRecording]);

  useEffect(
    () => () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    },
    [audioUrl]
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }
      setRecordingTime(0);
      setIsRecording(true);
      recorder.start(250);
    } catch (_error) {
      toast.error('Microphone access is required to record an answer.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl('');
    setRecordingTime(0);
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-actions">
        {!isRecording && !audioBlob && (
          <button type="button" className="primary-button" onClick={startRecording} disabled={disabled}>
            Start Recording
          </button>
        )}
        {isRecording && (
          <button type="button" className="danger-button" onClick={stopRecording}>
            Stop ({recordingTime}s)
          </button>
        )}
        {!isRecording && audioBlob && (
          <>
            <audio controls src={audioUrl} className="audio-preview" />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (recordingTime < MIN_RECORD_TIME) {
                  toast.error(`Please record at least ${MIN_RECORD_TIME} seconds of speech.`);
                  return;
                }
                onSubmit(audioBlob);
              }}
              disabled={disabled}
            >
              Submit Voice Answer
            </button>
            <button type="button" className="secondary-button" onClick={resetRecording} disabled={disabled}>
              Re-record
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceRecorder;
