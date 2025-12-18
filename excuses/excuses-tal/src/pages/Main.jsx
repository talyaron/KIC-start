import Header from '../components/Header';
import ActionCard from '../components/ActionCard';
import './Main.css';

const Main = () => {
  return (
    <div className="main-page">
      <Header />
      <main className="main-content">
        <h2 className="main-title">מה תרצה לעשות?</h2>
        <div className="action-grid">
          <ActionCard
            icon="⚡"
            title="תירוץ מהיר"
            description="5 תירוצים מוכנים לשימוש מיידי"
            to="/fast"
          />
          <ActionCard
            icon="🎯"
            title="תירוץ מותאם"
            description="תירוץ מותאם אישית למצב שלך"
            to="/tailored"
          />
          <ActionCard
            icon="✏️"
            title="צור תירוץ"
            description="המצא תירוץ חדש ומקורי"
            to="/create"
          />
          <ActionCard
            icon="🏆"
            title="אליפות התירוצים"
            description="מי יוצר את התירוצים הכי טובים?"
            to="/championship"
          />
        </div>
      </main>
    </div>
  );
};

export default Main;
