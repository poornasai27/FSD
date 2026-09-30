import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import InterviewCard from '../../components/InterviewCard';
import { clearHistory, deleteHistoryItem, getHistory } from '../../services/historyService';

const ITEMS_PER_PAGE = 8;

function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [interviews, setInterviews] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const lastErrorRef = useRef('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getHistory(page, ITEMS_PER_PAGE);
        setInterviews(data.entries);
        setTotalPages(data.totalPages);
        setTotalEntries(data.totalEntries);
        lastErrorRef.current = '';
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to load history';

        if (lastErrorRef.current !== message) {
          toast.error(message);
          lastErrorRef.current = message;
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [page]);

  const handleOpen = (interview) => {
    navigate(interview.status === 'completed' ? `/feedback/${interview._id}` : `/interview/${interview._id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setInterviews((prev) => prev.filter((item) => item._id !== id));
      setTotalEntries((prev) => Math.max(0, prev - 1));
    } catch (_error) {
      toast.error('Failed to delete interview');
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory();
      setInterviews([]);
      setTotalEntries(0);
      setTotalPages(1);
      toast.success('History cleared');
    } catch (_error) {
      toast.error('Failed to clear history');
    }
  };

  return (
    <main className="page">
      <section className="dashboard-topbar">
        <div>
          <p className="eyebrow">Interview archive</p>
          <h1>{totalEntries} saved sessions</h1>
          <p>Browse completed practice rounds and reopen active sessions.</p>
        </div>
        <button type="button" className="secondary-button" onClick={handleClear}>
          Clear All
        </button>
      </section>

      {loading ? (
        <p>Loading history...</p>
      ) : interviews.length > 0 ? (
        <div className="performance-grid">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview._id}
              interview={interview}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p>No history found yet.</p>
      )}

      <div className="pagination history-pagination">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </main>
  );
}

export default HistoryPage;
