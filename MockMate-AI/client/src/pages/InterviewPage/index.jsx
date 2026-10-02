import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AudioPlayer from '../../components/AudioPlayer';
import CodeEditor from '../../components/CodeEditor';
import VoiceRecorder from '../../components/VoiceRecorder';
import {
  endInterview,
  getInterview,
  submitCode,
  submitTextAnswer,
  submitVoiceAnswer,
} from '../../services/interviewService';

function InterviewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state?.interviewData || null;

  const [interview, setInterview] = useState(initialData);
  const [currentQuestion, setCurrentQuestion] = useState(initialData?.question || null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState(initialData?.currentQuestion || 1);
  const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 1);
  const [audioBase64, setAudioBase64] = useState(initialData?.audioBase64 || null);
  const [status, setStatus] = useState(initialData?.audioBase64 ? 'speaking' : 'listening');
  const [textAnswer, setTextAnswer] = useState('');
  const [code, setCode] = useState('// Write your solution here');
  const [codeEvaluation, setCodeEvaluation] = useState(null);
  const [hasSubmittedCode, setHasSubmittedCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const data = await getInterview(id);
        setInterview(data);
        setCurrentQuestionNum(data.currentQuestion);
        setTotalQuestions(data.totalQuestions);
        if (data.questions?.length > 0) {
          const qIndex = data.currentQuestion - 1;
          setCurrentQuestion(data.questions[qIndex] || data.questions[0]);
        }
        setStatus(data.status === 'completed' ? 'farewell' : data.audioBase64 ? 'speaking' : 'listening');
      } catch (_error) {
        toast.error('Failed to load interview.');
      }
    };

    loadInterview();
  }, [id]);

  const isCodingQuestion = useMemo(() => currentQuestion?.type === 'coding', [currentQuestion]);
  const controlsDisabled = submitting || status === 'speaking' || status === 'thinking';

  const handleAudioEnded = () => {
    setAudioBase64(null);
    setStatus('listening');
  };

  const processAnswerResult = (data) => {
    if (data.completed) {
      navigate(`/feedback/${id}`);
      return;
    }

    setCurrentQuestion(data.question);
    setCurrentQuestionNum(data.currentQuestion);
    setAudioBase64(data.audioBase64 || null);
    setStatus(data.audioBase64 ? 'speaking' : 'listening');
    setTextAnswer('');
    setCodeEvaluation(null);
    setHasSubmittedCode(false);
    setCode('// Write your solution here');
  };

  const handleSubmitText = async () => {
    const autoAnswer =
      isCodingQuestion && hasSubmittedCode
        ? 'Submitted coding solution and requested the next interview question.'
        : textAnswer.trim();

    if (!autoAnswer) {
      toast.error('Please enter an answer before submitting.');
      return;
    }

    setSubmitting(true);
    setStatus('thinking');
    try {
      const data = await submitTextAnswer(id, autoAnswer);
      processAnswerResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit answer.');
      setStatus('listening');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitVoice = async (audioBlob) => {
    setSubmitting(true);
    setStatus('thinking');
    try {
      const data = await submitVoiceAnswer(id, audioBlob);
      processAnswerResult(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          error.message ||
          'Failed to submit voice answer.'
      );
      setStatus('listening');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error('Please write code before submitting.');
      return;
    }

    try {
      const data = await submitCode(id, code, 'javascript');
      setCodeEvaluation(data.evaluation);
      setHasSubmittedCode(true);
      toast.success('Code evaluated successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to evaluate code.');
    }
  };

  const handleEndInterview = async () => {
    try {
      await endInterview(id);
      navigate(`/feedback/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end interview.');
    }
  };

  return (
    <main className="page">
      {audioBase64 && <AudioPlayer audioBase64={audioBase64} autoPlay onEnded={handleAudioEnded} />}
      <section className="interview-shell">
        <aside className="interview-side">
          <article className="side-card">
            <p className="eyebrow">Session status</p>
            <div className="question-meta">
              <span>
                Question {currentQuestionNum} of {totalQuestions}
              </span>
              <span className={`status-pill ${status}`}>{status}</span>
            </div>
            <div className="progress-track compact">
              <div style={{ width: `${(currentQuestionNum / totalQuestions) * 100}%` }} />
            </div>
          </article>
          <article className="side-card">
            <p className="eyebrow">Interview context</p>
            <p>Interview Level: {(interview?.difficulty || 'medium').toUpperCase()}</p>
            <p>Total Questions: {interview?.totalQuestions || 7}</p>
            <p>Mode: {isCodingQuestion ? 'Coding + Voice/Text' : 'Voice/Text'}</p>
          </article>
        </aside>

        <section className={`interview-layout ${isCodingQuestion ? 'with-code' : 'full-width'}`}>
          <article className="question-panel">
            <h1>{currentQuestion?.text || 'Loading question...'}</h1>
            {!isCodingQuestion && (
              <>
                <textarea
                  className="answer-box"
                  rows="7"
                  placeholder="Type your answer here if you prefer text instead of voice."
                  value={textAnswer}
                  onChange={(event) => setTextAnswer(event.target.value)}
                  disabled={controlsDisabled}
                />
                <div className="row-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleSubmitText}
                    disabled={controlsDisabled || !textAnswer.trim()}
                  >
                    Submit Text Answer
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleEndInterview}
                    disabled={controlsDisabled}
                  >
                    End Interview
                  </button>
                </div>
                <VoiceRecorder
                  key={`voice-${id}-${currentQuestionNum}`}
                  onSubmit={handleSubmitVoice}
                  disabled={controlsDisabled}
                />
              </>
            )}

            {isCodingQuestion && (
              <div className="row-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSubmitText}
                  disabled={controlsDisabled || !hasSubmittedCode}
                >
                  Next Question
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleEndInterview}
                  disabled={controlsDisabled}
                >
                  End Interview
                </button>
              </div>
            )}
          </article>

          {isCodingQuestion && (
            <article className="code-panel">
              <div className="section-header">
                <h2>Live Coding</h2>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSubmitCode}
                  disabled={controlsDisabled}
                >
                  {hasSubmittedCode ? 'Re-evaluate Code' : 'Evaluate Code'}
                </button>
              </div>
              <CodeEditor value={code} onChange={setCode} language="javascript" />
              {codeEvaluation && (
                <div className="evaluation-card">
                  <h3>Code Evaluation</h3>
                  <p>Score: {codeEvaluation.score}/100</p>
                  <p>{codeEvaluation.summary}</p>
                  <p className="hint-text">
                    Your code is saved. You can now click `Next Question` without typing anything else.
                  </p>
                </div>
              )}
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

export default InterviewPage;
