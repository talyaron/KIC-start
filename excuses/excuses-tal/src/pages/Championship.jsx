import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTopUsers, getBestExcuses, getUserExcuses } from '../firebase/services';
import Header from '../components/Header';
import LeaderboardItem from '../components/LeaderboardItem';
import ExcuseCard from '../components/ExcuseCard';
import './Championship.css';

const Championship = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('creators');
  const [topUsers, setTopUsers] = useState([]);
  const [bestExcuses, setBestExcuses] = useState([]);
  const [myExcuses, setMyExcuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'creators':
          const users = await getTopUsers(20);
          setTopUsers(users);
          break;
        case 'excuses':
          const excuses = await getBestExcuses(20);
          setBestExcuses(excuses);
          break;
        case 'mine':
          if (user) {
            const mine = await getUserExcuses(user.uid);
            setMyExcuses(mine);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="championship-page">
      <Header showBack />
      <main className="championship-content">
        <h1 className="page-title">🏆 אליפות התירוצים</h1>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveTab('creators')}
          >
            יוצרים מובילים
          </button>
          <button
            className={`tab ${activeTab === 'excuses' ? 'active' : ''}`}
            onClick={() => setActiveTab('excuses')}
          >
            תירוצים מאמינים
          </button>
          <button
            className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            התירוצים שלי
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="loading">טוען...</div>
          ) : (
            <>
              {activeTab === 'creators' && (
                <div className="leaderboard">
                  {topUsers.length === 0 ? (
                    <div className="empty-state">אין עדיין יוצרים</div>
                  ) : (
                    topUsers.map((u, index) => (
                      <LeaderboardItem
                        key={u.id}
                        rank={index + 1}
                        user={u}
                        isCurrentUser={u.id === user?.uid}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'excuses' && (
                <div className="best-excuses">
                  {bestExcuses.length === 0 ? (
                    <div className="empty-state">אין עדיין תירוצים</div>
                  ) : (
                    bestExcuses.map((excuse) => (
                      <div key={excuse.id} className="best-excuse-card">
                        <p className="best-excuse-text">"{excuse.text}"</p>
                        <div className="best-excuse-footer">
                          <span className="best-excuse-creator">
                            יוצר: {excuse.creatorName}
                          </span>
                          <span className="best-excuse-believed">
                            האמינו {excuse.believedCount} פעמים
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'mine' && (
                <div className="my-excuses">
                  {myExcuses.length === 0 ? (
                    <div className="empty-state">
                      <p>עדיין לא יצרת תירוצים</p>
                      <p>לחץ על "צור תירוץ" כדי להתחיל!</p>
                    </div>
                  ) : (
                    myExcuses.map((excuse) => (
                      <ExcuseCard
                        key={excuse.id}
                        excuse={excuse}
                        showStats
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Championship;
