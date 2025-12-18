import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createExcuse } from '../firebase/services';
import Header from '../components/Header';
import './CreateExcuse.css';

const categories = [
  { value: 'late', label: 'איחור' },
  { value: 'homework', label: 'שיעורי בית' },
  { value: 'forgot_equipment', label: 'שכחתי ציוד' },
  { value: 'absence', label: 'היעדרות' }
];

const eventTypes = [
  { value: 'test', label: 'מבחן' },
  { value: 'regular_class', label: 'שיעור רגיל' },
  { value: 'assignment', label: 'הגשת עבודה' },
  { value: 'general', label: 'כללי' }
];

const CreateExcuse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !category || !eventType) return;

    setLoading(true);
    try {
      await createExcuse({ text: text.trim(), category, eventType }, user);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error creating excuse:', error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="create-page">
        <Header showBack />
        <main className="create-content">
          <div className="success-message">
            <span className="success-icon">🎉</span>
            <h2>התירוץ נוצר בהצלחה!</h2>
            <p>מעביר אותך לדף הראשי...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="create-page">
      <Header showBack />
      <main className="create-content">
        <h1 className="page-title">✏️ צור תירוץ חדש</h1>
        <p className="page-subtitle">המצא תירוץ מקורי ותן לאחרים להשתמש בו</p>

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">התירוץ שלך</label>
            <textarea
              className="form-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="כתוב כאן את התירוץ שלך..."
              maxLength={200}
              rows={4}
            />
            <span className="char-count">{text.length}/200</span>
          </div>

          <div className="form-group">
            <label className="form-label">קטגוריה</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">בחר קטגוריה</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">סוג האירוע</label>
            <select
              className="form-select"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="">בחר סוג אירוע</option>
              {eventTypes.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!text.trim() || !category || !eventType || loading}
          >
            {loading ? 'שומר...' : 'צור תירוץ'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateExcuse;
