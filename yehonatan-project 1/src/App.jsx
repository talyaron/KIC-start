import React, { useState, useEffect } from 'react';
import { CASES, RARITIES } from './constants/gameData';
import { generateSpinnerItems } from './utils/rng';
import CaseCard from './components/CaseCard';
import CaseSpinner from './components/CaseSpinner';
import SkinIcon from './components/SkinIcon';
import './App.css';

function App() {
  const [balance, setBalance] = useState(1000); // Starting balance
  const [inventory, setInventory] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinnerItems, setSpinnerItems] = useState([]);
  const [wonItem, setWonItem] = useState(null);
  const [view, setView] = useState('shop'); // 'shop', 'opening', 'inventory', 'luck-shop'
  const [activeLuckBoost, setActiveLuckBoost] = useState(0); // 0 to 1 (multiplier)

  // Load from local storage
  useEffect(() => {
    const savedBalance = localStorage.getItem('csgo_balance');
    const savedInventory = localStorage.getItem('csgo_inventory');
    const savedBoost = localStorage.getItem('csgo_boost');
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedBoost) setActiveLuckBoost(parseFloat(savedBoost));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('csgo_balance', balance.toString());
    localStorage.setItem('csgo_inventory', JSON.stringify(inventory));
    localStorage.setItem('csgo_boost', activeLuckBoost.toString());
  }, [balance, inventory, activeLuckBoost]);

  const handleSelectCase = (caseData) => {
    if (balance < caseData.price) {
      alert("Not enough balance!");
      return;
    }
    setSelectedCase(caseData);
    // Increased count to 100 for more stable landing
    setSpinnerItems(generateSpinnerItems(caseData.items, activeLuckBoost, 100));
    setView('opening');
    setWonItem(null);
  };

  const handleStartSpin = () => {
    if (spinning || !selectedCase) return;
    setBalance(prev => prev - selectedCase.price);
    setSpinning(true);
  };

  const handleSpinFinished = (item) => {
    setSpinning(false);
    setWonItem(item);
    setInventory(prev => [item, ...prev]);
  };

  const handleGoBack = () => {
    if (spinning) return;
    setView('shop');
    setSelectedCase(null);
    setWonItem(null);
  };

  const handleSellItem = (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // Selling fee: user gets 70% of value
    const sellPrice = item.value * 0.7;
    setBalance(prev => prev + sellPrice);
    setInventory(prev => prev.filter(i => i.id !== itemId));
  };

  const handleSellAll = () => {
    const totalValue = inventory.reduce((acc, item) => acc + (item.value * 0.7), 0);
    setBalance(prev => prev + totalValue);
    setInventory([]);
  };

  const buyLuckBoost = (amount, cost, name) => {
    if (balance < cost) {
      alert("Not enough balance!");
      return;
    }
    setBalance(prev => prev - cost);
    // Simplified boost logic: set instead of add, or add with smaller values
    setActiveLuckBoost(prev => Math.min(prev + amount, 0.8)); // Cap at 80% total boost
    alert(`${name} Activated! Rare item chances increased.`);
  };

  return (
    <div className="app-wrapper">
      <header className="main-header glass-panel">
        <div className="logo" onClick={() => setView('shop')}>
          <h1>CS:GO <span className="accent">CRATE</span></h1>
        </div>
        <nav className="main-nav">
          <button className={`nav-link ${view === 'shop' ? 'active' : ''}`} onClick={() => setView('shop')}>Cases</button>
          <button className={`nav-link ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>Inventory ({inventory.length})</button>
          <button className={`nav-link ${view === 'luck-shop' ? 'active' : ''}`} onClick={() => setView('luck-shop')}>Luck Shop</button>
        </nav>
        <div className="user-stats">
          {activeLuckBoost > 0 && (
            <div className="boost-badge">
              🔥 +{(activeLuckBoost * 100).toFixed(0)}% Luck
            </div>
          )}
          <div className="balance-box">
            <span className="balance-label">Balance</span>
            <span className="balance-amount">${balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="container">
        {view === 'shop' && (
          <div className="view-shop">
            <h2 className="section-title">Case Collection</h2>
            <div className="case-grid">
              {CASES.map(c => (
                <CaseCard key={c.id} caseData={c} onSelect={handleSelectCase} />
              ))}
            </div>
          </div>
        )}

        {view === 'opening' && selectedCase && (
          <div className="view-opening">
            <div className="opening-header">
              <button className="btn btn-outline" onClick={handleGoBack} disabled={spinning}>← Back</button>
              <h2>{selectedCase.name}</h2>
            </div>

            <CaseSpinner
              items={spinnerItems}
              spinning={spinning}
              onFinished={handleSpinFinished}
            />

            <div className="action-area">
              {!spinning && !wonItem && (
                <button className="btn btn-primary lg-btn" onClick={handleStartSpin}>
                  Spin for ${selectedCase.price.toFixed(2)}
                </button>
              )}

              {wonItem && (
                <div className="win-announcement glass-panel" style={{ borderTop: `6px solid ${wonItem.rarityInfo?.color || '#ffffff'}` }}>
                  <p className="win-rarity" style={{ color: wonItem.rarityInfo?.color || '#ffffff' }}>{wonItem.rarityInfo?.name || 'Unknown'}</p>
                  <div className="win-image-wrapper">
                    {wonItem.image ? (
                      <img
                        src={wonItem.image}
                        alt={wonItem.name}
                        className="win-img"
                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }}
                      />
                    ) : null}
                    <div className="fallback-icon" style={{ display: wonItem.image ? 'none' : 'block' }}>
                      <SkinIcon color={wonItem.rarityInfo?.color || '#ffffff'} size={150} />
                    </div>
                  </div>
                  <h3>{wonItem.name}</h3>
                  <p className="win-value">${wonItem.value.toFixed(2)}</p>
                  <div className="win-actions">
                    <button className="btn btn-primary" onClick={() => handleSelectCase(selectedCase)}>Open Another</button>
                    <button className="btn btn-outline" onClick={() => handleSellItem(wonItem.id)}>Sell (70% Value)</button>
                  </div>
                </div>
              )}
            </div>

            <div className="case-contents glass-panel">
              <h4>Case Contains:</h4>
              <div className="contents-grid">
                {selectedCase.items.map((item, idx) => (
                  <div key={idx} className="content-item" style={{ borderBottom: `2px solid ${RARITIES[item.rarity].color}` }}>
                    <span className="content-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="view-inventory">
            <div className="inventory-header">
              <h2 className="section-title">My Collection</h2>
              {inventory.length > 0 && (
                <button className="btn btn-outline sell-all-btn" onClick={handleSellAll}>Sell All (70% Value)</button>
              )}
            </div>
            {inventory.length === 0 ? (
              <p className="empty-msg">Your inventory is empty. Open some cases!</p>
            ) : (
              <div className="inventory-grid">
                {inventory.map((item, idx) => (
                  <div key={item.id} className="inventory-item glass-panel" style={{ borderBottom: `4px solid ${item.rarityInfo?.color || '#ffffff'}` }}>
                    <div className="item-img-placeholder" style={{ background: `linear-gradient(45deg, ${item.rarityInfo?.color || '#ffffff'}22, transparent)` }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} />
                      ) : null}
                      <div className="fallback-icon" style={{ display: item.image ? 'none' : 'block' }}>
                        <SkinIcon color={item.rarityInfo?.color || '#ffffff'} size={80} />
                      </div>
                    </div>
                    <div className="item-meta">
                      <span className="item-rarity-tag" style={{ color: item.rarityInfo?.color || '#ffffff' }}>{item.rarityInfo?.name || 'Unknown'}</span>
                      <p className="item-title">{item.name}</p>
                      <p className="item-val">${item.value.toFixed(2)}</p>
                      <button className="btn btn-outline btn-sm sell-btn" onClick={() => handleSellItem(item.id)}>Sell (${(item.value * 0.7).toFixed(2)})</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'luck-shop' && (
          <div className="view-luck-shop">
            <h2 className="section-title">Luck Boost Shop</h2>
            <p className="luck-desc">Permanently increase your rare drop chances. Boosts apply relative increases (e.g. +5% means 5% more likely than base).</p>
            <div className="luck-grid">
              <div className="luck-card glass-panel">
                <h3>Silver Luck</h3>
                <p>+2% Rare Item Chance</p>
                <p className="luck-price">$500.00</p>
                <button className="btn btn-primary" onClick={() => buyLuckBoost(0.02, 500, 'Silver Luck')}>Buy Boost</button>
              </div>
              <div className="luck-card glass-panel shadow-gold">
                <h3>Gold Luck</h3>
                <p>+5% Rare Item Chance</p>
                <p className="luck-price">$1,500.00</p>
                <button className="btn btn-primary" onClick={() => buyLuckBoost(0.05, 1500, 'Gold Luck')}>Buy Boost</button>
              </div>
              <div className="luck-card glass-panel highlight-red">
                <h3>Omega Luck</h3>
                <p>+15% Rare Item Chance</p>
                <p className="luck-price">$5,000.00</p>
                <button className="btn btn-primary" onClick={() => buyLuckBoost(0.15, 5000, 'Omega Luck')}>Buy Boost</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="main-footer">
        <p>© 2026 CS:GO Crate Simulator • Realistic Odds • No Real Money Involved</p>
      </footer>
    </div>
  );
}

export default App;
