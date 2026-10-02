import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getResume, startInterview, uploadResume } from '../../services/interviewService';

const difficultyConfig = {
  easy: {
    label: 'EASY',
    badge: '5 Qs',
    questionsCount: 5,
    tagline: 'Simple / Basic',
    description: 'Basic concept questions & fundamental resume-based skills.',
  },
  medium: {
    label: 'MEDIUM',
    badge: '7 Qs',
    questionsCount: 7,
    tagline: 'Moderate / Practical',
    description: 'Intermediate technical, practical scenarios & project questions.',
  },
  hard: {
    label: 'HARD',
    badge: '10 Qs',
    questionsCount: 10,
    tagline: 'Advanced / High-Level',
    description: 'Deep architecture, complex scenario problem-solving & depth.',
  },
};

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'];

function InterviewSetupPage() {
  const [step, setStep] = useState(1);
  const [difficulty, setDifficulty] = useState('medium');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await getResume();
        if (data) {
          setResumeText(data.text || '');
          setResumeFileName(data.fileName || '');
          setResumeSkills(data.skills || []);
        }
      } catch (_error) {
        // No saved resume yet
      }
    };

    loadResume();
  }, []);

  const validateAndProcessFile = async (file) => {
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Invalid file format. Please upload a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadResume(file);
      setResumeText(data.text);
      setResumeFileName(data.fileName);
      setResumeSkills(data.skills || []);
      toast.success('Resume uploaded and analyzed successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to parse resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    validateAndProcessFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    validateAndProcessFile(file);
  };

  const handleRemoveResume = () => {
    setResumeText('');
    setResumeFileName('');
    setResumeSkills([]);
    toast.success('Resume removed.');
  };

  const handleNextStep = () => {
    if (!resumeText) {
      toast.error('Please upload your resume before continuing.');
      return;
    }
    setStep(2);
  };

  const handleStartInterview = async () => {
    if (!resumeText) {
      toast.error('Please upload your resume before starting.');
      return;
    }

    setStarting(true);
    try {
      const targetQuestions = difficultyConfig[difficulty]?.questionsCount || 7;
      const data = await startInterview({
        level: difficulty,
        difficulty,
        totalQuestions: targetQuestions,
        resumeText,
      });
      navigate(`/interview/${data.interviewId}`, { state: { interviewData: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start interview. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="page setup-page">
      <section className="setup-header">
        <p className="eyebrow">AI Mock Preparation</p>
        <h1>Configure Your Interview</h1>
        <p>Upload your resume to extract skills, then select your interview difficulty level.</p>
        <div className="step-rail">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>
      </section>

      <section className="setup-layout">
        <section className="setup-card">
          <div className="section-header setup-card-header">
            <h2>{step === 1 ? 'Upload Your Resume' : 'Select Interview Level'}</h2>
            <span className="step-badge">Step {step} of 2</span>
          </div>

          {step === 1 && (
            <div className="resume-panel">
              <div
                className={`dropzone-box ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="dropzone-icon">📁</div>
                <p className="dropzone-title">
                  {uploading ? 'Analyzing resume skills...' : 'Drag & drop your resume file'}
                </p>
                <p className="dropzone-hint">Supports PDF, DOC, DOCX, TXT (Up to 10MB)</p>
                <label className="primary-button browse-btn">
                  <span>{uploading ? 'Analyzing...' : 'Browse / Upload Resume'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileSelect}
                    hidden
                    disabled={uploading}
                  />
                </label>
              </div>

              {resumeFileName && (
                <div className="resume-preview-card">
                  <div className="resume-file-info">
                    <span className="file-icon">📄</span>
                    <div>
                      <strong>{resumeFileName}</strong>
                      <p className="file-status">✓ Skills extracted & ready</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-button remove-btn"
                    onClick={handleRemoveResume}
                    disabled={uploading}
                  >
                    Change File
                  </button>
                </div>
              )}

              {resumeSkills.length > 0 && (
                <div className="skills-extracted-panel">
                  <p className="skills-heading">Extracted Candidate Skills:</p>
                  <div className="skills-chips">
                    {resumeSkills.map((skill) => (
                      <span key={skill} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="depth-selection-wrapper">
              <p className="depth-subtitle">Choose your interview difficulty level</p>

              <div className="depth-grid-3col">
                {Object.keys(difficultyConfig).map((key) => {
                  const conf = difficultyConfig[key];
                  const isSelected = difficulty === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`depth-card-item ${isSelected ? 'active-depth' : ''}`}
                      onClick={() => setDifficulty(key)}
                    >
                      <div className="depth-card-top">
                        <span className="depth-title">{conf.label}</span>
                        <span className="depth-qs-badge">{conf.badge}</span>
                      </div>
                      <span className="depth-tagline">{conf.tagline}</span>
                      <p className="depth-desc">{conf.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="setup-action-row">
            {step === 2 && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep(1)}
                disabled={starting}
              >
                Back to Resume
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                className="primary-button continue-depth-btn"
                onClick={handleNextStep}
                disabled={uploading || !resumeText}
              >
                Continue to Depth →
              </button>
            ) : (
              <button
                type="button"
                className="primary-button start-interview-btn"
                onClick={handleStartInterview}
                disabled={starting}
              >
                {starting ? 'Generating Resume Questions...' : 'Start Interview'}
              </button>
            )}
          </div>
        </section>

        <aside className="setup-side-card">
          <p className="eyebrow">Session Overview</p>
          <h3>InterviewMate AI</h3>

          <div className="setup-side-row">
            <span>Resume</span>
            <strong>{resumeFileName ? 'Uploaded ✓' : 'Required'}</strong>
          </div>

          {resumeSkills.length > 0 && (
            <div className="setup-side-row">
              <span>Detected Skills</span>
              <strong>{resumeSkills.slice(0, 3).join(', ')}</strong>
            </div>
          )}

          <div className="setup-side-row">
            <span>Selected Level</span>
            <strong>{difficultyConfig[difficulty]?.label}</strong>
          </div>

          <div className="setup-side-row">
            <span>Total Questions</span>
            <strong>{difficultyConfig[difficulty]?.questionsCount} Qs</strong>
          </div>

          <button
            type="button"
            className="primary-button side-start-btn"
            onClick={step === 1 ? handleNextStep : handleStartInterview}
            disabled={!resumeText || starting}
          >
            {starting ? 'Generating questions...' : step === 1 ? 'Continue to Depth' : 'Start Interview'}
          </button>

          <p className="hint-text">
            Questions are generated strictly from your uploaded resume skills and selected difficulty.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default InterviewSetupPage;
