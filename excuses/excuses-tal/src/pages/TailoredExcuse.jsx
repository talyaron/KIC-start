import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTailoredExcuses, useExcuse, reportBelieved } from '../firebase/services';
import Header from '../components/Header';
import ExcuseCard from '../components/ExcuseCard';
import Modal from '../components/Modal';
import './TailoredExcuse.css';

const categories = [
  { value: 'late', label: 'איחרתי' },
  { value: 'homework', label: 'לא הכנתי שיעורים' },
  { value: 'forgot_equipment', label: 'שכחתי ציוד' },
  { value: 'absence', label: 'לא הגעתי' }
];

const eventTypes = [
  { value: 'test', label: 'מבחן' },
  { value: 'regular_class', label: 'שיעור רגיל' },
  { value: 'assignment', label: 'הגשת עבודה' },
  { value: 'general', label: 'כללי' }
];

const TailoredExcuse = () => {
  const { user, refreshUserData } = useAuth();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [dramaticLevel, setDramaticLevel] = useState(3);
  const [excuses, setExcuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentExcuse, setCurrentExcuse] = useState(null);
  const [currentLogId, setCurrentLogId] = useState(null);

  const handleSearch = async () => {
    if (!category || !eventType) return;
    setLoading(true);
    try {
      const data = await getTailoredExcuses(user.uid, category, eventType, 5);
      setExcuses(data);
      setStep(2);
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
  };

  const resetSearch = () => {
    setStep(1);
    setCategory('');
    setEventType('');
    setDramaticLevel(3);
    setExcuses([]);
  };

  return (
    <div className="tailored-page">
      <Header showBack />
      <main className="tailored-content">
        <h1 className="page-title">🎯 תירוץ מותאם</h1>

        {step === 1 ? (
          <div className="questions-container">
            <div className="question-group">
              <label className="question-label">מה קרה?</label>
              <div className="radio-group">
                {categories.map((cat) => (
                  <label key={cat.value} className="radio-option">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                    <span className="radio-label">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-group">
              <label className="question-label">לאיזה סוג שיעור?</label>
              <div className="radio-group">
                {eventTypes.map((event) => (
                  <label key={event.value} className="radio-option">
                    <input
                      type="radio"
                      name="eventType"
                      value={event.value}
                      checked={eventType === event.value}
                      onChange={(e) => setEventType(e.target.value)}
                    />
                    <span className="radio-label">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-group">
              <label className="question-label">כמה דרמטי? ({dramaticLevel})</label>
              <input
                type="range"
                min="1"
                max="5"
                value={dramaticLevel}
                onChange={(e) => setDramaticLevel(Number(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>רגוע</span>
                <span>דרמטי מאוד</span>
              </div>
            </div>

            <button
              className="search-button"
              onClick={handleSearch}
              disabled={!category || !eventType || loading}
            >
              {loading ? 'מחפש...' : 'מצא תירוצים'}
            </button>
          </div>
        ) : (
          <div className="results-container">
            <button className="back-to-search" onClick={resetSearch}>
              ← חיפוש חדש
            </button>

            {excuses.length === 0 ? (
              <div className="empty-state">
                <p>לא נמצאו תירוצים מתאימים.</p>
                <p>נסה קטגוריה אחרת או צור תירוץ חדש!</p>
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

export default TailoredExcuse;
