import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getResume, startInterview, uploadResume } from '../../services/interviewService';

const roles = ['Frontend', 'Backend', 'Full Stack', 'Data Analyst', 'DevOps'];
const difficultyMap = {
  easy: 4,
  medium: 5,
  hard: 6,
};

function InterviewSetupPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('Full Stack');
  const [difficulty, setDifficulty] = useState('medium');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await getResume();
        if (data) {
          setResumeText(data.text);
          setResumeFileName(data.fileName);
        }
      } catch (_error) {
        // No saved resume yet.
      }
    };

    loadResume();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const data = await uploadResume(file);
      setResumeText(data.text);
      setResumeFileName(data.fileName);
      toast.success('Resume uploaded successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !role) {
      toast.error('Please select a role.');
      return;
    }
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleStartInterview = async () => {
    if (!resumeText) {
      toast.error('Please upload your resume before starting.');
      return;
    }

    setStarting(true);
    try {
      const data = await startInterview({
        role,
        difficulty,
        totalQuestions: difficultyMap[difficulty],
        resumeText,
      });
      navigate(`/interview/${data.interviewId}`, { state: { interviewData: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start interview.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="page">
      <section className="setup-header">
        <p className="eyebrow">Preparation module</p>
        <h1>Configure your interview experience</h1>
        <p>Tailor role, level, and resume context before starting the session.</p>
        <div className="step-rail">
          {[1, 2, 3].map((index) => (
            <div key={index} className={`step-dot ${step >= index ? 'active' : ''}`}>
              {index}
            </div>
          ))}
        </div>
      </section>

      <section className="setup-layout">
        <section className="setup-card">
          <div className="section-header">
            <h2>
              {step === 1 && 'Select Target Role'}
              {step === 2 && 'Choose Interview Depth'}
              {step === 3 && 'Upload Resume'}
            </h2>
            <span>Step {step} of 3</span>
          </div>

          {step === 1 && (
            <div className="option-grid">
              {roles.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`option-card ${role === item ? 'selected' : ''}`}
                  onClick={() => setRole(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="option-grid">
              {Object.keys(difficultyMap).map((item) => (
              <button
                key={item}
                type="button"
                className={`option-card ${difficulty === item ? 'selected' : ''}`}
                onClick={() => setDifficulty(item)}
              >
                <span className="option-title">{item}</span>
                <small className="option-meta">{difficultyMap[item]} total questions</small>
              </button>
            ))}
          </div>
          )}

          {step === 3 && (
            <div className="resume-panel">
              <label className="upload-box">
                <span>{uploading ? 'Uploading...' : 'Upload PDF resume'}</span>
                <input type="file" accept="application/pdf" onChange={handleFileUpload} hidden />
              </label>
              {resumeFileName && (
                <div className="resume-preview">
                  <strong>{resumeFileName}</strong>
                </div>
              )}
            </div>
          )}

          <div className="row-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleBack}
              disabled={step === 1 || starting}
            >
              Back
            </button>
            {step < 3 ? (
              <button type="button" className="primary-button" onClick={handleNext} disabled={starting}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={handleStartInterview}
                disabled={starting}
              >
                {starting ? 'Starting...' : 'Start Interview'}
              </button>
            )}
          </div>
        </section>

        <aside className="setup-side-card">
          <p className="eyebrow">Session preview</p>
          <h3>MockMate AI interviewer</h3>
          <div className="setup-side-row">
            <span>Role</span>
            <strong>{role}</strong>
          </div>
          <div className="setup-side-row">
            <span>Difficulty</span>
            <strong>{difficulty}</strong>
          </div>
          <div className="setup-side-row">
            <span>Questions</span>
            <strong>{difficultyMap[difficulty]}</strong>
          </div>
          <div className="setup-side-row">
            <span>Resume</span>
            <strong>{resumeFileName ? 'Uploaded' : 'Required'}</strong>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={handleStartInterview}
            disabled={step !== 3 || !resumeText || starting}
          >
            {starting ? 'Starting...' : 'Begin Interview'}
          </button>
          <p className="hint-text">
            Tip: Upload a concise, clean resume for better personalized questions.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default InterviewSetupPage;
