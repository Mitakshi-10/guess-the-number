import React, { useState, useEffect } from 'react';
import Stats from './components/Stats';
import GameBoard from './components/GameBoard';
import HistoryList from './components/HistoryList';
import SuccessModal from './components/SuccessModal';
import { audio } from './utils/audio';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [range, setRange] = useState({ min: 1, max: 100 });
  const [customRange, setCustomRange] = useState({ min: '', max: '' });
  const [activePreset, setActivePreset] = useState('medium'); // easy, medium, hard, custom
  
  const [targetNumber, setTargetNumber] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lastGuess, setLastGuess] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Persist best score in local storage
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('guesser_best_score');
    return saved ? parseInt(saved, 10) : null;
  });

  const [isMuted, setIsMuted] = useState(false);

  // Sync mute state from audio utility on mount
  useEffect(() => {
    setIsMuted(audio.isMuted());
  }, []);

  const handleMuteToggle = () => {
    const newMuted = audio.toggleMute();
    setIsMuted(newMuted);
  };

  const handleStartGame = () => {
    audio.playClick();
    let finalRange = { min: 1, max: 100 };

    if (activePreset === 'easy') {
      finalRange = { min: 1, max: 50 };
    } else if (activePreset === 'medium') {
      finalRange = { min: 1, max: 100 };
    } else if (activePreset === 'hard') {
      finalRange = { min: 1, max: 500 };
    } else if (activePreset === 'custom') {
      const minVal = parseInt(customRange.min, 10) || 1;
      const maxVal = parseInt(customRange.max, 10) || 100;
      finalRange = { 
        min: Math.min(minVal, maxVal), 
        max: Math.max(minVal, maxVal) 
      };
    }

    setRange(finalRange);
    
    // Choose random number (Concept: Random numbers)
    const randomNum = Math.floor(Math.random() * (finalRange.max - finalRange.min + 1)) + finalRange.min;
    setTargetNumber(randomNum);
    setAttempts(0);
    setFeedback(null);
    setLastGuess(null);
    setHistory([]);
    setShowSuccess(false);
    setGameStarted(true);
    audio.startBgMusic();
  };

  const handleGuess = (guess) => {
    setAttempts((prev) => prev + 1);
    setLastGuess(guess);

    // Concept: Conditions (Too High, Too Low, Correct)
    if (guess > targetNumber) {
      setFeedback('Too High');
      audio.playTooHigh();
      setHistory((prev) => [
        { guess, result: 'Too High', target: targetNumber },
        ...prev,
      ]);
    } else if (guess < targetNumber) {
      setFeedback('Too Low');
      audio.playTooLow();
      setHistory((prev) => [
        { guess, result: 'Too Low', target: targetNumber },
        ...prev,
      ]);
    } else {
      setFeedback('Correct');
      setShowSuccess(true);
      audio.stopBgMusic();
      
      // Update best score
      const finalAttempts = attempts + 1;
      if (bestScore === null || finalAttempts < bestScore) {
        setBestScore(finalAttempts);
        localStorage.setItem('guesser_best_score', finalAttempts.toString());
      }
    }
  };

  const handleRestart = () => {
    audio.stopBgMusic();
    audio.stopAllScenarios();
    setGameStarted(false);
    setShowSuccess(false);
    setFeedback(null);
    setAttempts(0);
    setLastGuess(null);
    setHistory([]);
  };

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      audio.stopBgMusic();
    };
  }, []);

  return (
    <div className="app-container">
      {/* Sound Toggle Button */}
      <button 
        className="sound-toggle-btn" 
        onClick={handleMuteToggle}
        title={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <header>
        <h1>Guesser</h1>
        <p className="subtitle">Interactive Number Guessing Game</p>
      </header>

      {!gameStarted ? (
        /* Welcome Setup Card */
        <div className="glass-card welcome-container">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Select Game Range</h2>
          
          <div className="range-presets">
            <div 
              className={`preset-card ${activePreset === 'easy' ? 'active' : ''}`}
              onClick={() => { audio.playClick(); setActivePreset('easy'); }}
            >
              <div className="preset-title">Easy</div>
              <div className="preset-range">1–50</div>
            </div>

            <div 
              className={`preset-card ${activePreset === 'medium' ? 'active' : ''}`}
              onClick={() => { audio.playClick(); setActivePreset('medium'); }}
            >
              <div className="preset-title">Medium</div>
              <div className="preset-range">1–100</div>
            </div>

            <div 
              className={`preset-card ${activePreset === 'hard' ? 'active' : ''}`}
              onClick={() => { audio.playClick(); setActivePreset('hard'); }}
            >
              <div className="preset-title">Hard</div>
              <div className="preset-range">1–500</div>
            </div>

            <div 
              className={`preset-card ${activePreset === 'custom' ? 'active' : ''}`}
              onClick={() => { audio.playClick(); setActivePreset('custom'); }}
            >
              <div className="preset-title">Custom</div>
              <div className="preset-range">Any Range</div>
            </div>
          </div>

          {activePreset === 'custom' && (
            <div className="input-container" style={{ gap: '10px', marginTop: '10px' }}>
              <input
                type="number"
                placeholder="Min"
                value={customRange.min}
                onChange={(e) => setCustomRange({ ...customRange, min: e.target.value })}
                className="guess-input"
                style={{ fontSize: '1.1rem', padding: '12px' }}
              />
              <input
                type="number"
                placeholder="Max"
                value={customRange.max}
                onChange={(e) => setCustomRange({ ...customRange, max: e.target.value })}
                className="guess-input"
                style={{ fontSize: '1.1rem', padding: '12px' }}
              />
            </div>
          )}

          <button 
            className="btn" 
            style={{ width: '100%', marginTop: '16px' }}
            onClick={handleStartGame}
          >
            Start Guessing
          </button>
        </div>
      ) : (
        /* Active Game View with Side-by-Side Columns */
        <div className="game-layout">
          <div className="game-main">
            <Stats 
              attempts={attempts} 
              bestScore={bestScore} 
              range={range} 
            />

            <GameBoard
              onGuess={handleGuess}
              feedback={feedback}
              lastGuess={lastGuess}
              target={targetNumber}
              range={range}
            />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                onClick={handleRestart}
              >
                Reset Game
              </button>
            </div>
          </div>

          <div className="game-sidebar">
            <HistoryList history={history} />
          </div>
        </div>
      )}

      {showSuccess && (
        <SuccessModal
          targetNumber={targetNumber}
          attempts={attempts}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
