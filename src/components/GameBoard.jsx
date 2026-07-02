import React, { useState, useRef, useEffect } from 'react';
import { audio } from '../utils/audio';

export default function GameBoard({ onGuess, feedback, lastGuess, target, range }) {
  const [guess, setGuess] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < range.min || num > range.max) {
      return; // Add validation warning if needed
    }
    
    onGuess(num);
    setGuess('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Calculate hot/cold warmth based on distance
  const getWarmthMessage = () => {
    if (lastGuess === null) return null;
    const diff = Math.abs(lastGuess - target);
    if (diff === 0) return '🎉 Correct!';
    if (diff <= 3) return '🔥 Scorching Hot!';
    if (diff <= 8) return '☀️ Quite Warm';
    if (diff <= 15) return '🌤️ Lukewarm';
    if (diff <= 30) return '🍃 Cool';
    return '❄️ Ice Cold';
  };

  const warmth = getWarmthMessage();

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit} className="game-control-group">
        {/* Feedback Bubble */}
        <div 
          className={`feedback-bubble ${
            feedback === 'Too High' 
              ? 'high' 
              : feedback === 'Too Low' 
              ? 'low' 
              : feedback === 'Correct' 
              ? 'correct' 
              : 'idle'
          }`}
        >
          {feedback === 'Too High' && (
            <>
              <span>📈 Too High!</span>
              {warmth && <span className="feedback-subtext">{warmth}</span>}
            </>
          )}
          {feedback === 'Too Low' && (
            <>
              <span>📉 Too Low!</span>
              {warmth && <span className="feedback-subtext">{warmth}</span>}
            </>
          )}
          {feedback === 'Correct' && (
            <>
              <span>🎉 Correct!</span>
            </>
          )}
          {!feedback && (
            <>
              <span>Enter a number to start!</span>
              <span className="feedback-subtext">The number is between {range.min} and {range.max}</span>
            </>
          )}
        </div>

        {/* Input */}
        <div className="input-container">
          <input
            ref={inputRef}
            type="number"
            min={range.min}
            max={range.max}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="guess-input"
            placeholder={`Guess (${range.min}–${range.max})`}
            required
          />
        </div>

        {/* Action Button */}
        <button type="submit" className="btn" style={{ width: '100%' }}>
          Submit Guess
        </button>
      </form>
    </div>
  );
}
