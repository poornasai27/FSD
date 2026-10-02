function InterviewCard({ interview, onOpen, onDelete }) {
  return (
    <article className="interview-card stitch-card">
      <div className="interview-card-head">
        <span className={`status-tag ${interview.status}`}>{interview.status}</span>
        <strong>{interview.overallScore ?? '--'}</strong>
      </div>
      <div className="interview-card-body">
        <h3>{interview.difficulty ? `${interview.difficulty.toUpperCase()} Level Interview` : (interview.role || 'Resume Interview')}</h3>
        <p>Questions answered: {interview.currentQuestion}/{interview.totalQuestions}</p>
      </div>
      <div className="card-actions">
        <button type="button" className="primary-button" onClick={() => onOpen(interview)}>
          Full Review
        </button>
        <button type="button" className="secondary-button" onClick={() => onDelete(interview._id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default InterviewCard;
