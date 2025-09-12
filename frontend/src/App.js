import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PotluckList />} />
        <Route path="/potluck/:id" element={<PotluckView />} />
      </Routes>
    </Router>
  );
}

function PotluckList() {
  const [potlucks, setPotlucks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [newPotluck, setNewPotluck] = useState({
    name: '',
    date: '',
    guestList: '',
    menuItems: ''
  });

  useEffect(() => {
    loadPotlucks();
  }, []);

  const loadPotlucks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/potlucks`);
      setPotlucks(response.data);
    } catch (err) {
      setError('Failed to load potlucks');
    } finally {
      setLoading(false);
    }
  };

  const createPotluck = async () => {
    if (!newPotluck.name.trim()) {
      setError('Please enter a potluck name');
      return;
    }

    try {
      setLoading(true);
      const guestList = newPotluck.guestList ? newPotluck.guestList.split(',').map(g => g.trim()).filter(g => g) : [];
      const menuItems = newPotluck.menuItems ? newPotluck.menuItems.split(',').map(m => m.trim()).filter(m => m) : [];

      const response = await axios.post(`${API}/potlucks`, {
        ...newPotluck,
        guestList,
        menuItems
      });

      setSuccess('Potluck created successfully!');
      setNewPotluck({ name: '', date: '', guestList: '', menuItems: '' });
      setShowCreateForm(false);
      loadPotlucks();
      
      // Navigate to the new potluck
      setTimeout(() => {
        navigate(`/potluck/${response.data.id}`);
      }, 1000);
    } catch (err) {
      setError('Failed to create potluck');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL potluck data? This cannot be undone.')) {
      try {
        await axios.delete(`${API}/reset`);
        setSuccess('All data cleared');
        loadPotlucks();
      } catch (err) {
        setError('Failed to clear data');
      }
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🥗 Potluck</h1>
        <p>Simple signup & organization</p>
        <button className="btn-clear" onClick={clearAllData} title="Clear all data">
          🗑️
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="potluck-list-container">
        {loading ? (
          <div className="empty-message">
            <span className="loading"></span>Loading...
          </div>
        ) : potlucks.length === 0 ? (
          <div className="empty-message">
            No potlucks yet. Create your first one!
          </div>
        ) : (
          <div className="potluck-grid">
            {potlucks.map(potluck => (
              <div 
                key={potluck.id} 
                className="potluck-card"
                onClick={() => navigate(`/potluck/${potluck.id}`)}
              >
                <h3>{potluck.name}</h3>
                <p>{potluck.date || 'No date set'}</p>
                <div className="potluck-card-footer">
                  Click to view & signup
                </div>
              </div>
            ))}
          </div>
        )}

        {!showCreateForm ? (
          <button 
            className="plus-button" 
            onClick={() => setShowCreateForm(true)}
            title="Create new potluck"
          >
            +
          </button>
        ) : (
          <div className="create-form">
            <h2>Create New Potluck</h2>
            <div className="form-row">
              <input 
                className="input"
                placeholder="Potluck name" 
                value={newPotluck.name} 
                onChange={e => setNewPotluck({ ...newPotluck, name: e.target.value })} 
              />
              <input 
                className="input"
                type="date"
                value={newPotluck.date} 
                onChange={e => setNewPotluck({ ...newPotluck, date: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <input 
                className="input"
                placeholder="Guest list (comma separated: John, Mary, Bob)" 
                value={newPotluck.guestList} 
                onChange={e => setNewPotluck({ ...newPotluck, guestList: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <input 
                className="input"
                placeholder="Menu items (comma separated: Salad, Pizza, Drinks)" 
                value={newPotluck.menuItems} 
                onChange={e => setNewPotluck({ ...newPotluck, menuItems: e.target.value })} 
              />
            </div>
            <div className="form-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={createPotluck}
                disabled={loading}
              >
                {loading && <span className="loading"></span>}
                Create Potluck
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PotluckView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [potluck, setPotluck] = useState(null);
  const [menu, setMenu] = useState([]);
  const [guests, setGuests] = useState([]);
  const [userName, setUserName] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState({
    menu: true,
    guests: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUserName = localStorage.getItem('potluckUserName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
    loadPotluckData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-section')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const loadPotluckData = async () => {
    try {
      setLoading(true);
      const [potluckRes, menuRes, guestsRes] = await Promise.all([
        axios.get(`${API}/potlucks`),
        axios.get(`${API}/potlucks/${id}/menu`),
        axios.get(`${API}/potlucks/${id}/guests`)
      ]);
      
      const currentPotluck = potluckRes.data.find(p => p.id === parseInt(id));
      if (!currentPotluck) {
        setError('Potluck not found');
        return;
      }
      
      setPotluck(currentPotluck);
      setMenu(menuRes.data);
      setGuests(guestsRes.data);
    } catch (err) {
      setError('Failed to load potluck data');
    } finally {
      setLoading(false);
    }
  };

  const selectGuest = (guestName) => {
    setUserName(guestName);
    localStorage.setItem('potluckUserName', guestName);
  };

  const selectMenuItem = async (menuItem) => {
    if (!userName) {
      setError('Please select your name first');
      return;
    }

    try {
      // Check if this user already selected this specific dish
      const userGuest = guests.find(g => g.name === userName);
      const existingSelection = userGuest && userGuest.dish_ids && userGuest.dish_ids.includes(menuItem.id);
      
      if (existingSelection) {
        setError('You have already selected this dish');
        return;
      }

      // Add new selection (multiple dishes allowed)
      await axios.post(`${API}/potlucks/${id}/guests`, {
        name: userName,
        dish_id: menuItem.id,
        quantity: 1
      });
      setSuccess(`Added ${menuItem.dish} to your selections!`);
      
      loadPotluckData();
    } catch (err) {
      setError('Failed to add selection');
    }
  };

  const removeUserDish = async (guestId, dishId) => {
    try {
      await axios.delete(`${API}/potlucks/${id}/guests/${guestId}/dishes/${dishId}`);
      setSuccess(`Removed dish from your selections!`);
      loadPotluckData();
    } catch (err) {
      setError('Failed to remove selection');
    }
  };

  const addNewDish = async () => {
    if (!userName) {
      setError('Please select your name first');
      return;
    }

    const newDishName = prompt('Enter the dish name:');
    if (!newDishName || !newDishName.trim()) {
      return;
    }

    try {
      await axios.post(`${API}/potlucks/${id}/menu/with-user`, {
        dish: newDishName.trim(),
        userName: userName
      });
      setSuccess(`Added ${newDishName} and assigned it to you!`);
      loadPotluckData();
    } catch (err) {
      setError('Failed to add new dish');
    }
  };

  const addNewGuest = async () => {
    const newGuestName = prompt('Enter guest name:');
    if (!newGuestName || !newGuestName.trim()) {
      return;
    }

    try {
      // Add guest without a dish assignment initially
      await axios.post(`${API}/potlucks/${id}/guests`, {
        name: newGuestName.trim(),
        dish_id: null,
        quantity: 1
      });
      setSuccess(`Added ${newGuestName} to the guest list!`);
      loadPotluckData();
    } catch (err) {
      setError('Failed to add guest');
    }
  };

  const deleteGuest = async (guestName) => {
    if (!window.confirm(`Are you sure you want to remove ${guestName} from the potluck? This will delete all their dish selections.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/potlucks/${id}/guests/by-name/${encodeURIComponent(guestName)}`);
      setSuccess(`Removed ${guestName} from the potluck!`);
      loadPotluckData();
    } catch (err) {
      setError('Failed to remove guest');
    }
  };

  const updateFamilyCount = async (guestName, newCount) => {
    if (newCount < 1) return;

    try {
      await axios.put(`${API}/potlucks/${id}/guests/family-count/${encodeURIComponent(guestName)}`, {
        family_count: newCount
      });
      setSuccess(`Updated family count for ${guestName}!`);
      loadPotluckData();
    } catch (err) {
      setError('Failed to update family count');
    }
  };

  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addCustomGuest = () => {
    const customName = prompt('Enter your name:');
    if (customName && customName.trim()) {
      selectGuest(customName.trim());
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="empty-message">
          <span className="loading"></span>Loading potluck...
        </div>
      </div>
    );
  }

  if (error && !potluck) {
    return (
      <div className="app">
        <div className="error-message">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Potlucks
        </button>
      </div>
    );
  }

  const currentUserGuest = guests.find(g => g.name === userName);
  
  // Create individual guest entries for each dish they signed up for
  const signedUpGuests = [];
  guests.forEach(guest => {
    if (guest.dish_ids && guest.dish_ids.length > 0) {
      guest.dish_ids.forEach((dishId, index) => {
        signedUpGuests.push({
          id: `${guest.id}-${dishId}`, // Unique ID for this guest-dish combination
          guest_id: guest.id,
          name: guest.name,
          dish_id: dishId,
          quantity: guest.quantities[index] || 1,
          family_count: guest.family_count
        });
      });
    }
  });
  
  const userSelections = signedUpGuests.filter(g => g.name === userName);

  // Group guests by dish for display
  const guestsByDish = {};
  signedUpGuests.forEach(guest => {
    if (!guestsByDish[guest.dish_id]) {
      guestsByDish[guest.dish_id] = [];
    }
    guestsByDish[guest.dish_id].push(guest);
  });

  return (
    <div className="app">
      <div className="header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div>
          <h1>{potluck?.name}</h1>
          <p>{potluck?.date || 'No date set'}</p>
        </div>
        <div className="profile-section">
          <div className="share-info">
            <small>Share this URL with guests</small>
          </div>
          <div 
            className={`profile-icon ${!userName ? 'no-user' : ''}`}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            title={userName ? `Signed in as ${userName}` : 'Click to sign in'}
          >
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              {userName ? (
                <div className="current-user-profile">
                  <h3>Current User</h3>
                  <div className="user-greeting">
                    ✋ Hi, <strong>{userName}</strong>!
                  </div>
                  <button 
                    className="switch-user-btn" 
                    onClick={() => {
                      setUserName('');
                      localStorage.removeItem('potluckUserName');
                      setShowProfileDropdown(false);
                    }}
                  >
                    Switch user
                  </button>
                </div>
              ) : (
                <div className="guest-selection">
                  <h3>Who are you?</h3>
                  {availableGuests.length > 0 && (
                    <div className="guest-buttons">
                      {availableGuests.map(guest => (
                        <button 
                          key={guest.id} 
                          className="guest-button"
                          onClick={() => {
                            selectGuest(guest.name);
                            setShowProfileDropdown(false);
                          }}
                        >
                          {guest.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      addCustomGuest();
                      setShowProfileDropdown(false);
                    }}
                  >
                    Add new name
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="main-content">
        {/* Menu Selection */}
        {userName && (
        <div className="card">
          <div className="collapsible-header" onClick={() => toggleSection('menu')}>
            <h2>Select Your Dishes</h2>
            <button className={`expand-icon ${sectionsExpanded.menu ? 'expanded' : ''}`}>
              ▼
            </button>
          </div>
          <div className={`collapsible-content ${sectionsExpanded.menu ? 'expanded' : 'collapsed'}`}>
          {userSelections.length > 0 && (
            <div className="current-selection">
              Your selections: <strong>{userSelections.map(s => {
                const dish = menu.find(m => m.id === s.dish_id);
                return dish ? dish.dish : 'Unknown dish';
              }).join(', ')}</strong>
            </div>
          )}
          <div className="menu-grid">
            {[...menu]
              .sort((a, b) => {
                const aHasGuests = (guestsByDish[a.id] || []).length > 0;
                const bHasGuests = (guestsByDish[b.id] || []).length > 0;
                
                // Sort unselected dishes (no guests) first
                if (!aHasGuests && bHasGuests) return -1;
                if (aHasGuests && !bHasGuests) return 1;
                
                // If both have same selection status, sort alphabetically
                return a.dish.localeCompare(b.dish);
              })
              .map(item => {
              const dishGuests = guestsByDish[item.id] || [];
              const userHasSelected = userSelections.some(s => s.dish_id === item.id);
              const hasAnyGuests = dishGuests.length > 0;
              
              return (
                <div key={item.id} className="menu-item-container">
                  <button 
                    className={`menu-button ${userHasSelected ? 'selected' : ''} ${!hasAnyGuests ? 'unselected' : ''}`}
                    onClick={() => selectMenuItem(item)}
                  >
                    {item.dish}
                    {!hasAnyGuests && <span className="needs-someone">🍽️</span>}
                  </button>
                  {dishGuests.length > 0 && (
                    <div className="dish-guests">
                      {dishGuests.map(guest => (
                        <div key={guest.id} className="guest-tag">
                          <span>{guest.name}</span>
                          {guest.name === userName && (
                            <button 
                              className="remove-btn"
                              onClick={() => removeUserDish(guest.guest_id, guest.dish_id)}
                              title="Remove this dish"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="menu-item-container">
              <button 
                className="menu-button add-dish-button"
                onClick={addNewDish}
                title="Add a new dish"
              >
                + Add Dish
              </button>
            </div>
          </div>
          </div> {/* End collapsible-content */}
        </div>
      )}

      {/* Who's Coming */}
      <div className="card">
        <div className="collapsible-header" onClick={() => toggleSection('guests')}>
          <h2>Who's Coming ({
            // Calculate total people including family members
            [...new Set(guests.map(g => g.name))].reduce((total, guestName) => {
              const guestRecord = guests.find(g => g.name === guestName);
              return total + (guestRecord?.family_count || 1);
            }, 0)
          })</h2>
          <button className={`expand-icon ${sectionsExpanded.guests ? 'expanded' : ''}`}>
            ▼
          </button>
        </div>
        <div className={`collapsible-content ${sectionsExpanded.guests ? 'expanded' : 'collapsed'}`}>
        {guests.length === 0 ? (
          <div className="empty-message">No one added yet</div>
        ) : (
          <div className="compact-guest-list">
            {/* Compact guest display in rows */}
            {[...new Set(guests.map(g => g.name))].map(guestName => {
              // Get the family count for this guest (from any of their records)
              const guestRecord = guests.find(g => g.name === guestName);
              const familyCount = guestRecord?.family_count || 1;
              
              return (
                <div key={guestName} className="compact-guest-item">
                  <span className="guest-name">{guestName}</span>
                  <div className="compact-counter">
                    <button 
                      className="compact-btn minus"
                      onClick={() => updateFamilyCount(guestName, familyCount - 1)}
                      disabled={familyCount <= 1}
                      title="Decrease"
                    >
                      −
                    </button>
                    <span className="count-badge">{familyCount}</span>
                    <button 
                      className="compact-btn plus"
                      onClick={() => updateFamilyCount(guestName, familyCount + 1)}
                      title="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="compact-remove"
                    onClick={() => deleteGuest(guestName)}
                    title={`Remove ${guestName}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button 
              className="add-guest-compact"
              onClick={addNewGuest}
              title="Add new guest"
            >
              + Add Guest
            </button>
          </div>
        )}
        </div> {/* End collapsible-content */}
      </div>
      </div> {/* End main-content */}
    </div>
  );
}

export default App;
