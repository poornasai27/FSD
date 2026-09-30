import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ScoreCard from '../../components/ScoreCard';
import { getInterview } from '../../services/interviewService';

function FeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const data = await getInterview(id);
        if (!data.feedback) {
          toast.error('No feedback available for this interview.');
          navigate('/');
          return;
        }
        setFeedback(data.feedback);
      } catch (_error) {
        toast.error('Failed to load feedback.');
        navigate('/');
      }
    };

    loadFeedback();
  }, [id, navigate]);

  if (!feedback) {
    return <main className="page">Loading feedback...</main>;
  }

  const categories = feedback.categories || {};

  return (
    <main className="page">
      <section className="report-hero">
        <div className="report-title">
          <p className="eyebrow">Interview feedback</p>
          <h1>Interview Analysis</h1>
          <p>{feedback.finalAssessment}</p>
        </div>
        <article className="report-score-card">
          <div className="readiness-ring small-ring">
            <div className="readiness-ring-inner">
              <strong>{feedback.overallScore ?? '--'}</strong>
              <span>TIER: READY</span>
            </div>
          </div>
          <span className="capsule small-capsule">Composite proficiency index</span>
        </article>
      </section>

      <section className="feedback-grid">
        <ScoreCard
          title="Communication"
          score={categories.communication?.score}
          summary={categories.communication?.summary}
        />
        <ScoreCard
          title="Technical Knowledge"
          score={categories.technicalKnowledge?.score}
          summary={categories.technicalKnowledge?.summary}
        />
        <ScoreCard
          title="Problem Solving"
          score={categories.problemSolving?.score}
          summary={categories.problemSolving?.summary}
        />
        <ScoreCard
          title="Confidence"
          score={categories.confidence?.score}
          summary={categories.confidence?.summary}
        />
        <ScoreCard
          title="Role Readiness"
          score={categories.roleReadiness?.score}
          summary={categories.roleReadiness?.summary}
        />
      </section>

      <section className="feedback-panels">
        <article className="panel stitch-card">
          <h2>Core Strengths</h2>
          <ul>
            {(feedback.strengths || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="panel stitch-card">
          <h2>Growth Areas</h2>
          <ul>
            {(feedback.improvements || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default FeedbackPage;
