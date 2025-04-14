import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const GameInput = () => {
  const [gameName, setGameName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility

  // Check if the user is authenticated when the component mounts
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to handle adding a game
  const handleAddGame = async (event) => {
    event.preventDefault();

    // Check if user is logged in
    if (!user) {
      setMessage('You must be logged in to add a game.');
      return;
    }

    // Ensure game name is not empty
    if (!gameName.trim()) {
      setMessage('Game name cannot be empty.');
      return;
    }

    // Insert game into Supabase table
    const { data, error } = await supabase
      .from('games')
      .insert([{ name: gameName.trim() }]);

    if (error) {
      console.error('Error adding game:', error.message);
      setMessage('Error adding game: ' + error.message);
    } else {
      setMessage(`Game "${gameName}" added successfully!`);
      setGameName(''); // Clear input field after success
      setShowModal(true); // Show the success modal
    }
  };

  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      {/* Add Game Form */}
      <form onSubmit={handleAddGame}>
        <h2>Add a New Game</h2>
        
        {/* Check if user is logged in */}
        {!user && <p>You must be logged in to add a game.</p>}

        <label htmlFor="game-name">Game Name:</label>
        <input
          type="text"
          id="game-name"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          required
          disabled={!user} // Disable input if not logged in
        />
        <button type="submit" disabled={!user}>Add Game</button>
      </form>

      {/* Display success or error message */}
      {message && <p>{message}</p>}

      {/* Modal for success message */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3>{`Game "${gameName}" added successfully!`}</h3>
            <button onClick={closeModal} style={modalStyles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  closeButton: {
    marginTop: '20px',
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
};

export default GameInput;
