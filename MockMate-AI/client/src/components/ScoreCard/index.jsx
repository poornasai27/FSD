function ScoreCard({ title, score, summary }) {
  return (
    <article className="score-card stitch-card">
      <div className="score-header">
        <h3>{title}</h3>
        <span>{score ?? '--'}</span>
      </div>
      <div className="mini-progress">
        <div style={{ width: `${score ?? 0}%` }} />
      </div>
      <p>{summary}</p>
    </article>
  );
}

export default ScoreCard;
