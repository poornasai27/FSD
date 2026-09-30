import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import InterviewCard from '../../components/InterviewCard';
import { useAuth } from '../../context/AuthContext';
import { deleteHistoryItem, getHistory } from '../../services/historyService';

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setAllInterviews([]);
      setRecentInterviews([]);
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const allData = await getHistory(1, 100);
        setAllInterviews(allData.entries);
        setRecentInterviews(allData.entries.slice(0, 3));
      } catch (error) {
        setAllInterviews([]);
        setRecentInterviews([]);
        toast.error(error.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isAuthenticated]);

  const completed = allInterviews.filter((item) => item.status === 'completed');
  const averageScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, item) => sum + (item.overallScore || 0), 0) / completed.length
        )
      : 0;
  const readinessScore = Math.min(100, Math.max(0, Math.round(averageScore * 1.15)));
  const upcomingRole = recentInterviews[0]?.role || allInterviews[0]?.role || 'Senior Product Manager';

  const handleOpen = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  const handleDelete = async (id) => {
    await deleteHistoryItem(id);
    setRecentInterviews((prev) => prev.filter((item) => item._id !== id));
    setAllInterviews((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <main className="page">
      {!isAuthenticated ? (
        <>
          <section className="marketing-hero">
            <div className="marketing-copy">
              <p className="capsule">Advanced AI coaching v2.0</p>
              <h1>
                Land your dream role <span>through AI mastery.</span>
              </h1>
              <p>
                Resume-aware simulations, voice interviews, coding rounds, and sharp evaluation in
                one system.
              </p>
              <div className="row-actions">
                <Link to="/setup" className="primary-button dark-button">
                  Start Journey
                </Link>
                <Link to="/login" className="text-link">
                  Watch Showcase
                </Link>
              </div>
              <div className="marketing-proof">
                <span className="proof-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>12,000+ professionals already levelled up.</span>
              </div>
            </div>

            <article className="marketing-visual-card">
              <div className="marketing-media" />
              <div className="floating-badge">
                <span>Success rate</span>
                <strong>+24% YoY</strong>
              </div>
              <div className="analysis-pill">Live analysis</div>
              <div className="hero-readiness">
                <span>Command presence</span>
                <strong>{readinessScore}%</strong>
              </div>
              <div className="progress-track">
                <div style={{ width: `${readinessScore}%` }} />
              </div>
            </article>
          </section>

          <section className="marketing-grid">
            <div className="marketing-left-copy">
              <h2>Meticulously crafted intelligence</h2>
              <p>
                We replaced clinical prep flows with a more human-centered coaching product built
                around real interview behavior.
              </p>
              <span className="marketing-line" />
            </div>
            <article className="micro-card">
              <h3>Linguistic Resonance</h3>
              <p>Evaluate cadence, emotional balance, and structural clarity in real time.</p>
            </article>
            <article className="micro-card micro-card-dark">
              <h3>Adaptive Role Engine</h3>
              <p>Questions adapt to your role, difficulty, and resume context automatically.</p>
            </article>
            <article className="micro-card">
              <h3>Executive Presence Analytics</h3>
              <p>Track communication dimensions and score progress across multiple sessions.</p>
            </article>
            <article className="bar-card">
              <div />
              <div />
              <div />
              <div />
              <div className="accent-bar" />
            </article>
          </section>

          <section className="brand-strip">
            <span>TECHCORP</span>
            <span>FIN-SOLVE</span>
            <span>GLOBAL_LOGIC</span>
            <span>ELITE_TALENT</span>
          </section>

          <section className="cta-banner">
            <h2>Ready to transcend the average narrative?</h2>
            <p>Practice like a real candidate and review what actually moves interview outcomes.</p>
            <Link to="/setup" className="secondary-button light-button">
              Unlock Access Now
            </Link>
          </section>

          <section className="site-footer-grid">
            <div>
              <strong>MockMate AI</strong>
              <p>
                Professional interview training powered by resume intelligence and deliberate
                practice loops.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <span>Pricing</span>
              <span>Features</span>
              <span>Case Studies</span>
            </div>
            <div>
              <h4>Company</h4>
              <span>About</span>
              <span>Careers</span>
              <span>Contact</span>
            </div>
            <div>
              <h4>Legal</h4>
              <span>Privacy Policy</span>
              <span>Terms</span>
              <span>Support</span>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="dashboard-topbar">
            <div>
              <h1>Welcome back, {user?.name || 'Alex'}.</h1>
              <p>Your communication effectiveness has increased by 12% this week.</p>
            </div>
            <div className="row-actions">
              <button type="button" className="secondary-button">Export Report</button>
              <Link to="/history" className="primary-button">View Analytics</Link>
            </div>
          </section>

          <section className="dashboard-grid">
            <article className="readiness-card">
              <div className="readiness-ring">
                <div className="readiness-ring-inner">
                  <strong>{readinessScore}</strong>
                  <span>READY</span>
                </div>
              </div>
              <div className="readiness-copy">
                <h2>Interview Readiness</h2>
                <p>
                  Your narrative clarity is approaching executive grade. Push articulation and
                  evidence depth to break the next threshold.
                </p>
                <div className="metric-row">
                  <div className="metric-card">
                    <span>Articulation</span>
                    <strong>{Math.max(60, readinessScore - 5)}%</strong>
                    <div className="progress-track compact"><div style={{ width: `${Math.max(60, readinessScore - 5)}%` }} /></div>
                  </div>
                  <div className="metric-card">
                    <span>Confidence</span>
                    <strong>{Math.max(55, averageScore)}%</strong>
                    <div className="progress-track compact"><div style={{ width: `${Math.max(55, averageScore)}%` }} /></div>
                  </div>
                </div>
                <Link to="/setup" className="primary-button dashboard-cta">Launch New Simulation</Link>
              </div>
            </article>

            <div className="dashboard-side">
              <article className="upcoming-card">
                <p className="eyebrow">Upcoming session</p>
                <h3>{upcomingRole}</h3>
                <p>Tomorrow, 10:00 AM</p>
                <Link to="/setup" className="secondary-button dark-outline-button">Prepare Dashboard</Link>
              </article>

              <article className="quick-tools-card">
                <div className="section-header">
                  <h3>Quick Tools</h3>
                  <span>...</span>
                </div>
                <div className="quick-tools-grid">
                  <div className="quick-tool"><strong>Record</strong></div>
                  <div className="quick-tool"><strong>Tips</strong></div>
                </div>
              </article>
            </div>
          </section>

          <section className="dashboard-section-heading">
            <h2>Recent Performance</h2>
            <p>History of your evaluated sessions</p>
          </section>

          <section className="performance-grid">
            {loading ? (
              <p>Loading dashboard...</p>
            ) : (
              <>
                {recentInterviews.slice(0, 2).map((interview) => (
                  <InterviewCard
                    key={interview._id}
                    interview={interview}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                  />
                ))}
                <article className="archive-card">
                  <div className="archive-icon">Archive</div>
                  <h3>Session Archives</h3>
                  <p>Explore completed and in-progress sessions.</p>
                  <Link to="/history" className="text-link strong-link">Browse All</Link>
                </article>
              </>
            )}
          </section>

          <section className="insight-grid">
            <article className="insight-panel">
              <div className="section-header">
                <h3>Narrative Intelligence</h3>
              </div>
              <div className="quote-panel">
                <p>"Your STAR implementation is structurally sound, but the result impact is under-articulated."</p>
                <span>Feedback from 2 expert signals</span>
              </div>
              <div className="coach-panel">
                <p className="eyebrow">Coach intervention</p>
                <p>
                  After highlighting the achievement, hold silence for 2 seconds. This makes the
                  impact land harder and improves perceived confidence.
                </p>
              </div>
            </article>

            <article className="growth-panel">
              <div className="section-header">
                <h3>Growth Velocity</h3>
                <span className="capsule small-capsule">This week</span>
              </div>
              <div className="growth-bars">
                <div />
                <div />
                <div />
                <div className="active-bar" />
                <div />
                <div />
                <div />
              </div>
              <div className="growth-labels">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </article>
          </section>

          <section className="site-footer-grid dashboard-footer">
            <div>
              <strong>MockMate AI</strong>
              <p>The professional interview system for narrative precision and technical clarity.</p>
            </div>
            <div>
              <h4>Resources</h4>
              <span>Support</span>
              <span>Best Practices</span>
            </div>
            <div>
              <h4>Legal</h4>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
            <div>
              <h4>Connect</h4>
              <span>Contact</span>
              <span>Twitter</span>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default HomePage;
