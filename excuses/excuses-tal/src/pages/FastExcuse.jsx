import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRandomExcuses, useExcuse, reportBelieved } from '../firebase/services';
import Header from '../components/Header';
import ExcuseCard from '../components/ExcuseCard';
import Modal from '../components/Modal';
import './FastExcuse.css';

const FastExcuse = () => {
  const { user, refreshUserData } = useAuth();
  const [excuses, setExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentExcuse, setCurrentExcuse] = useState(null);
  const [currentLogId, setCurrentLogId] = useState(null);

  useEffect(() => {
    loadExcuses();
  }, [user]);

  const loadExcuses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getRandomExcuses(user.uid, 5);
      setExcuses(data);
    } catch (error) {
      console.error('Error loading excuses:', error);
    }
    setLoading(false);
  };

  const handleUse = async (excuse) => {
    try {
      const logId = await useExcuse(excuse.id, excuse.creatorId, user.uid);
      setCurrentExcuse(excuse);
      setCurrentLogId(logId);
      setShowModal(true);
    } catch (error) {
      console.error('Error using excuse:', error);
    }
  };

  const handleBelievedResponse = async (believed) => {
    if (believed !== null && currentExcuse && currentLogId) {
      try {
        await reportBelieved(
          currentExcuse.id,
          currentExcuse.creatorId,
          currentLogId,
          believed
        );
      } catch (error) {
        console.error('Error reporting believed:', error);
      }
    }
    setShowModal(false);
    setCurrentExcuse(null);
    setCurrentLogId(null);
    await refreshUserData();
    loadExcuses();
  };

  return (
    <div className="fast-excuse-page">
      <Header showBack />
      <main className="fast-content">
        <h1 className="page-title">⚡ תירוץ מהיר</h1>
        <p className="page-subtitle">5 תירוצים מוכנים לשימוש</p>

        {loading ? (
          <div className="loading">טוען תירוצים...</div>
        ) : excuses.length === 0 ? (
          <div className="empty-state">
            <p>אין תירוצים זמינים כרגע.</p>
            <p>נסה ליצור תירוץ חדש!</p>
          </div>
        ) : (
          <div className="excuse-list">
            {excuses.map((excuse) => (
              <ExcuseCard
                key={excuse.id}
                excuse={excuse}
                onUse={handleUse}
              />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={showModal} onClose={() => handleBelievedResponse(null)}>
        <h2 className="modal-title">המורה האמין/ה?</h2>
        <p>עזור לנו לדעת אם התירוץ עובד!</p>
        <div className="modal-buttons">
          <button
            className="modal-button yes"
            onClick={() => handleBelievedResponse(true)}
          >
            כן! 🎉
          </button>
          <button
            className="modal-button no"
            onClick={() => handleBelievedResponse(false)}
          >
            לא 😅
          </button>
          <button
            className="modal-button skip"
            onClick={() => handleBelievedResponse(null)}
          >
            דלג
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FastExcuse;
