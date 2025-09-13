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
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
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

  const toggleHeader = () => {
    setIsHeaderMinimized(!isHeaderMinimized);
    setShowHeaderDropdown(false);
  };

  const toggleHeaderDropdown = () => {
    setShowHeaderDropdown(!showHeaderDropdown);
  };

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

    console.log('Creating potluck with data:', newPotluck);

    try {
      setLoading(true);
      const guestList = newPotluck.guestList ? newPotluck.guestList.split(',').map(g => g.trim()).filter(g => g) : [];
      const menuItems = newPotluck.menuItems ? newPotluck.menuItems.split(',').map(m => m.trim()).filter(m => m) : [];

      console.log('Processed data:', { ...newPotluck, guestList, menuItems });

      // Use fetch instead of axios for debugging
      const response = await fetch(`${API}/potlucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPotluck,
          guestList,
          menuItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const responseData = await response.json();
      console.log('Response:', responseData);
      setSuccess('Potluck created successfully!');
      setNewPotluck({ name: '', date: '', guestList: '', menuItems: '' });
      setShowCreateForm(false);
      loadPotlucks();
      
      // Note: Navigation commented out for debugging
      // setTimeout(() => {
      //   navigate(`/potluck/${response.data.id}`);
      // }, 1000);
    } catch (err) {
      console.error('Error creating potluck:', err);
      console.error('Error response:', err.response);
      alert(`Error creating potluck: ${err.response?.data?.error || err.message}`);
      setError(`Failed to create potluck: ${err.response?.data?.error || err.message}`);
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
      <div className={`header ${isHeaderMinimized ? 'minimized' : 'expanded'}`}>
        <div className="header-content">
          {!isHeaderMinimized && (
            <>
              <h1>🥗 Potluck</h1>
              <p>Simple signup & organization</p>
            </>
          )}
          <div className="header-controls">
            <button className="burger-menu" onClick={isHeaderMinimized ? toggleHeaderDropdown : toggleHeader}>
              ☰
            </button>
            {!isHeaderMinimized && (
              <button className="btn-clear" onClick={clearAllData} title="Clear all data">
                🗑️
              </button>
            )}
            {isHeaderMinimized && showHeaderDropdown && (
              <div className="header-dropdown">
                <button className="btn-clear" onClick={clearAllData} title="Clear all data">
                  🗑️ Clear all
                </button>
              </div>
            )}
          </div>
        </div>
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
  const [showWhoAreYouOverlay, setShowWhoAreYouOverlay] = useState(false);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState(false);
  const [showDishActionModal, setShowDishActionModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [dishNotes, setDishNotes] = useState({});
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editDishName, setEditDishName] = useState('');
  const [editingGuestName, setEditingGuestName] = useState(null);
  const [editGuestValue, setEditGuestValue] = useState('');
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
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
    } else {
      // Show "Who are you" overlay if no user is selected
      setShowWhoAreYouOverlay(true);
    }
    loadPotluckData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-section') && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
      if (showBurgerMenu && !event.target.closest('.burger-menu') && !event.target.closest('.burger-dropdown')) {
        setShowBurgerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, showBurgerMenu]);

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
    setShowWhoAreYouOverlay(false);
    setShowProfileDropdown(false);
  };

  const selectMenuItem = (menuItem) => {
    if (!userName) {
      setShowWhoAreYouOverlay(true);
      return;
    }

    // Show dish action modal
    setSelectedDish(menuItem);
    setShowDishActionModal(true);
  };

  const signUpForDish = async (menuItem) => {
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
      setShowDishActionModal(false);
      
      loadPotluckData();
    } catch (err) {
      setError('Failed to add selection');
    }
  };

  const addNoteForDish = async () => {
    if (!noteText.trim()) {
      setError('Please enter a note');
      return;
    }

    try {
      // For now, store notes locally. Later we'll add backend storage
      setDishNotes(prev => ({
        ...prev,
        [selectedDish.id]: [...(prev[selectedDish.id] || []), {
          id: Date.now(),
          text: noteText.trim(),
          author: userName,
          timestamp: new Date().toISOString()
        }]
      }));
      
      setSuccess('Note added successfully!');
      setNoteText('');
      setShowNoteForm(false);
      setShowDishActionModal(false);
    } catch (err) {
      setError('Failed to add note');
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

  const editDish = async () => {
    if (!editDishName.trim()) {
      setError('Please enter a dish name');
      return;
    }

    console.log('Edit dish request:', {
      url: `${API}/potlucks/${id}/menu/${selectedDish.id}`,
      dishName: editDishName.trim(),
      selectedDish: selectedDish,
      id: id
    });

    try {
      const response = await axios.put(`${API}/potlucks/${id}/menu/${selectedDish.id}`, {
        dish: editDishName.trim()
      });
      console.log('Edit dish response:', response.data);
      setSuccess(`Updated dish to "${editDishName.trim()}"`);
      setShowEditDishModal(false);
      setShowDishActionModal(false);
      setEditDishName('');
      loadPotluckData();
    } catch (err) {
      console.error('Edit dish error details:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        url: `${API}/potlucks/${id}/menu/${selectedDish.id}`
      });
      setError(`Failed to update dish: ${err.response?.data?.error || err.message}`);
    }
  };

  const openEditDishModal = () => {
    console.log('Opening edit dish modal for:', selectedDish);
    setEditDishName(selectedDish.dish || selectedDish.name);
    setShowEditDishModal(true);
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

  const startEditingGuestName = (guestName) => {
    setEditingGuestName(guestName);
    setEditGuestValue(guestName);
  };

  const cancelEditingGuestName = () => {
    setEditingGuestName(null);
    setEditGuestValue('');
  };

  const saveGuestName = async () => {
    if (!editGuestValue.trim()) {
      setError('Please enter a valid name');
      return;
    }

    if (editGuestValue.trim() === editingGuestName) {
      // No change, just cancel
      cancelEditingGuestName();
      return;
    }

    try {
      await axios.put(`${API}/potlucks/${id}/guests/rename/${encodeURIComponent(editingGuestName)}`, {
        new_name: editGuestValue.trim()
      });
      setSuccess(`Renamed ${editingGuestName} to ${editGuestValue.trim()}!`);
      
      // Update local user name if they changed their own name
      if (userName === editingGuestName) {
        setUserName(editGuestValue.trim());
        localStorage.setItem('potluckUserName', editGuestValue.trim());
      }
      
      cancelEditingGuestName();
      loadPotluckData();
    } catch (err) {
      setError(`Failed to rename guest: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleGuestNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveGuestName();
    } else if (e.key === 'Escape') {
      cancelEditingGuestName();
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

  // Get unique guest names for the dropdown
  const availableGuests = guests.filter((guest, index, self) => 
    index === self.findIndex(g => g.name === guest.name)
  );

  return (
    <div className="app">
      <div className={`header ${headerExpanded ? 'expanded' : 'minimized'}`}>
        {/* Minimized Header */}
        <div className="header-minimized" onClick={() => setHeaderExpanded(true)}>
          <div className="header-title">
            <h2>{potluck?.name}</h2>
          </div>
          <div className="header-actions">
            <button 
              className="burger-menu"
              onClick={(e) => {
                e.stopPropagation();
                setShowBurgerMenu(!showBurgerMenu);
              }}
              title="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Expanded Header */}
        {headerExpanded && (
          <div className="header-expanded">
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back
            </button>
            <div className="header-content">
              <h1>{potluck?.name}</h1>
              <p>{potluck?.date || 'No date set'}</p>
            </div>
            <div className="profile-section">
              <button 
                className="summary-button"
                onClick={() => setShowSummaryOverlay(true)}
                title="Show potluck summary"
              >
                📋 Summary
              </button>
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
            </div>
            <button 
              className="header-collapse"
              onClick={() => setHeaderExpanded(false)}
              title="Minimize header"
            >
              ▲
            </button>
          </div>
        )}

        {/* Burger Menu Dropdown */}
        {showBurgerMenu && (
          <div className="burger-dropdown">
            <button 
              className="burger-item"
              onClick={() => {
                navigate('/');
                setShowBurgerMenu(false);
              }}
            >
              🏠 Home
            </button>
            <button 
              className="burger-item"
              onClick={() => {
                setShowSummaryOverlay(true);
                setShowBurgerMenu(false);
              }}
            >
              📋 Summary
            </button>
            <button 
              className="burger-item"
              onClick={() => {
                setShowProfileDropdown(true);
                setShowBurgerMenu(false);
              }}
            >
              👤 Profile
            </button>
          </div>
        )}

        {/* Profile Dropdown */}
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
                      setShowWhoAreYouOverlay(true);
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

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="main-content">
        {/* Menu Selection */}
        <div className="card">
          <div className="collapsible-header" onClick={() => toggleSection('menu')}>
            <h2>{userName ? 'Select Your Dishes' : 'Menu Items'}</h2>
            <button className={`expand-icon ${sectionsExpanded.menu ? 'expanded' : ''}`}>
              ▼
            </button>
          </div>
          <div className={`collapsible-content ${sectionsExpanded.menu ? 'expanded' : 'collapsed'}`}>
          {!userName && (
            <div className="info-message">
              Click on your profile icon (top right) to select your name and sign up for dishes.
            </div>
          )}
          {userName && userSelections.length > 0 && (
            <div className="current-selection">
              Your selections: <strong>{userSelections.map(s => {
                const dish = menu.find(m => m.id === s.dish_id);
                return dish ? dish.dish : 'Unknown dish';
              }).join(', ')}</strong>
            </div>
          )}
          <div className="dishes-grid">
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
              const itemNotes = dishNotes[item.id] || [];
              
              return (
                <div key={item.id} className={`dish-card ${!hasAnyGuests ? 'unassigned' : 'assigned'}`}>
                  <button 
                    className={`btn btn-outline-primary dish-button w-100 ${userHasSelected ? 'selected' : ''} ${!hasAnyGuests ? 'unselected' : ''} ${!userName ? 'disabled' : ''}`}
                    onClick={() => userName ? selectMenuItem(item) : setShowWhoAreYouOverlay(true)}
                    disabled={false}
                  >
                    <div className="dish-content">
                      <div className="dish-name fw-bold">{item.dish}</div>
                      {hasAnyGuests ? (
                        <div className="dish-guests-list">
                          {dishGuests.map((guest, index) => (
                            <span key={guest.id} className="badge bg-success bg-opacity-75 text-dark me-1 guest-badge">
                              👤 {guest.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="needs-someone text-muted">
                          <i className="fas fa-utensils me-1"></i>Need someone
                        </span>
                      )}
                    </div>
                  </button>
                  {itemNotes.length > 0 && (
                    <div className="dish-notes mt-2">
                      {itemNotes.map(note => (
                        <div key={note.id} className="card card-body bg-light p-2 mb-1">
                          <span className="fw-bold text-primary">{note.author}:</span>
                          <span className="ms-2">{note.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="dish-card">
              <button 
                className="btn btn-success w-100 h-100 add-dish-button"
                onClick={addNewDish}
                title="Add a new dish"
              >
                <i className="fas fa-plus me-2"></i>Add Dish
              </button>
            </div>
          </div>
          </div> {/* End collapsible-content */}
        </div>

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
            {/* Compact guest display in rows - sorted by family count (largest to smallest) */}
            {[...new Set(guests.map(g => g.name))]
              .map(guestName => {
                const guestRecord = guests.find(g => g.name === guestName);
                const familyCount = guestRecord?.family_count || 1;
                return { name: guestName, familyCount, guestRecord };
              })
              .sort((a, b) => b.familyCount - a.familyCount) // Sort by family count descending
              .map(({ name: guestName, familyCount, guestRecord }) => {
              
              return (
                <div key={guestName} className="compact-guest-item">
                  {editingGuestName === guestName ? (
                    <div className="guest-name-edit">
                      <input
                        type="text"
                        value={editGuestValue}
                        onChange={(e) => setEditGuestValue(e.target.value)}
                        onKeyDown={handleGuestNameKeyPress}
                        autoFocus
                        className="guest-name-input"
                        placeholder="Guest name"
                      />
                      <div className="edit-guest-buttons">
                        <button 
                          className="save-guest-btn"
                          onClick={saveGuestName}
                          title="Save"
                        >
                          ✓
                        </button>
                        <button 
                          className="cancel-guest-btn"
                          onClick={cancelEditingGuestName}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span 
                      className="guest-name editable"
                      onClick={() => startEditingGuestName(guestName)}
                      title="Click to edit name"
                    >
                      {guestName}
                    </span>
                  )}
                  <div className="guest-info-section">
                    <span className="family-size-badge" title={`${familyCount} ${familyCount === 1 ? 'person' : 'people'}`}>
                      {familyCount} 👥
                    </span>
                    <div className="family-counter">
                      {[1, 2, 3, 4, 5].map(count => (
                        <button
                          key={count}
                          className={`family-icon-btn ${familyCount >= count ? 'active' : 'inactive'}`}
                          onClick={() => updateFamilyCount(guestName, count)}
                          title={`${count} ${count === 1 ? 'person' : 'people'}`}
                        >
                          👤
                        </button>
                      ))}
                      {familyCount > 5 && (
                        <div className="large-family">
                          <button 
                            className="family-icon-btn active"
                            onClick={() => updateFamilyCount(guestName, Math.max(1, familyCount - 1))}
                            title="Decrease"
                          >
                            ➖
                          </button>
                          <span className="large-count">{familyCount}</span>
                          <button 
                            className="family-icon-btn active"
                            onClick={() => updateFamilyCount(guestName, familyCount + 1)}
                            title="Increase"
                          >
                            ➕
                          </button>
                        </div>
                      )}
                    </div>
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

      {/* Dish Action Modal */}
      {showDishActionModal && selectedDish && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>{selectedDish.dish}</h2>
            <p>What would you like to do?</p>
            <div className="modal-buttons">
              {/* Check if user is already signed up for this dish */}
              {userSelections.some(s => s.dish_id === selectedDish.id) ? (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // Find the user's guest entry for this dish
                    const userGuestEntry = signedUpGuests.find(g => 
                      g.name === userName && g.dish_id === selectedDish.id
                    );
                    if (userGuestEntry) {
                      removeUserDish(userGuestEntry.guest_id, userGuestEntry.dish_id);
                      setShowDishActionModal(false);
                    }
                  }}
                >
                  ❌ Cancel Signup
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => signUpForDish(selectedDish)}
                >
                  🍽️ Sign Up for this Dish
                </button>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowNoteForm(true)}
              >
                💬 Add Note
              </button>
              <button 
                className="btn btn-secondary"
                onClick={openEditDishModal}
              >
                ✏️ Edit Dish
              </button>
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => {
                setShowDishActionModal(false);
                setShowNoteForm(false);
                setNoteText('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Note Form Modal */}
      {showNoteForm && selectedDish && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Add Note for {selectedDish.dish}</h2>
            <textarea
              className="note-input"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your note here (e.g., 'bringing extra spice on the side', 'vegetarian version', etc.)"
              rows={4}
            />
            <div className="modal-buttons">
              <button 
                className="btn btn-primary"
                onClick={addNoteForDish}
                disabled={!noteText.trim()}
              >
                Add Note
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteText('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {showEditDishModal && selectedDish && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Edit Dish</h2>
            <input
              type="text"
              className="form-input"
              value={editDishName}
              onChange={(e) => setEditDishName(e.target.value)}
              placeholder="Enter dish name"
              style={{ width: '100%', marginBottom: '15px', padding: '8px' }}
            />
            <div className="modal-buttons">
              <button 
                className="btn btn-primary"
                onClick={editDish}
                disabled={!editDishName.trim()}
              >
                Save Changes
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditDishModal(false);
                  setEditDishName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary overlay */}
      {showSummaryOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Potluck Summary</h2>
            <div className="summary-content">
              <pre className="summary-text">
{(() => {
  // Create signedUpGuests for summary
  const summarySignedUpGuests = [];
  guests.forEach(guest => {
    if (guest.dish_ids && guest.dish_ids.length > 0) {
      guest.dish_ids.forEach((dishId, index) => {
        summarySignedUpGuests.push({
          guest_id: guest.id,
          name: guest.name,
          dish_id: dishId,
          quantity: guest.quantities[index] || 1,
          family_count: guest.family_count
        });
      });
    }
  });
  
  // Create guestsByDish for summary
  const summaryGuestsByDish = {};
  summarySignedUpGuests.forEach(guest => {
    if (!summaryGuestsByDish[guest.dish_id]) {
      summaryGuestsByDish[guest.dish_id] = [];
    }
    summaryGuestsByDish[guest.dish_id].push(guest);
  });
  
  return `Potluck Summary:

Event: ${potluck?.name || 'Untitled Potluck'}
Date & Time: ${potluck?.event_datetime ? new Date(potluck.event_datetime).toLocaleString() : 'Not set'}
Location: ${potluck?.location || 'Not specified'}

Total Guests: ${guests.length}
Total Family Members: ${guests.reduce((sum, guest) => sum + (guest.family_count || 1), 0)}

Guest List: ${guests.map(guest => guest.name).join(', ')}

Dish Signups:
${(() => {
  // Group dishes by guest
  const dishesByGuest = {};
  summarySignedUpGuests.forEach(guest => {
    if (!dishesByGuest[guest.name]) {
      dishesByGuest[guest.name] = [];
    }
    const dish = menu.find(d => d.id === guest.dish_id);
    if (dish) {
      dishesByGuest[guest.name].push(dish.dish || dish.name);
    }
  });
  
  // Create guest summary lines
  const guestLines = Object.entries(dishesByGuest).map(([guestName, dishes]) => {
    return `• ${guestName}: ${dishes.join(', ')}`;
  });
  
  // Add unassigned dishes
  const assignedDishIds = new Set(summarySignedUpGuests.map(g => g.dish_id));
  const unassignedDishes = menu.filter(dish => !assignedDishIds.has(dish.id));
  const unassignedLines = unassignedDishes.map(dish => `• ${dish.dish || dish.name} - Still needed`);
  
  return [...guestLines, ...unassignedLines].join('\n');
})()}

Dishes Still Needed:
${(() => {
  const assignedDishIds = new Set(summarySignedUpGuests.map(g => g.dish_id));
  const unassignedDishes = menu.filter(dish => !assignedDishIds.has(dish.id));
  return unassignedDishes.length > 0 
    ? unassignedDishes.map(dish => `• ${dish.dish || dish.name}`).join('\n')
    : '• All dishes are assigned!';
})()}
`;
})()}
              </pre>
            </div>
            <div className="summary-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // Create signedUpGuests for copy action
                  const copySignedUpGuests = [];
                  guests.forEach(guest => {
                    if (guest.dish_ids && guest.dish_ids.length > 0) {
                      guest.dish_ids.forEach((dishId, index) => {
                        copySignedUpGuests.push({
                          guest_id: guest.id,
                          name: guest.name,
                          dish_id: dishId,
                          quantity: guest.quantities[index] || 1,
                          family_count: guest.family_count
                        });
                      });
                    }
                  });
                  
                  // Create guestsByDish for copy action
                  const copyGuestsByDish = {};
                  copySignedUpGuests.forEach(guest => {
                    if (!copyGuestsByDish[guest.dish_id]) {
                      copyGuestsByDish[guest.dish_id] = [];
                    }
                    copyGuestsByDish[guest.dish_id].push(guest);
                  });
                  
                  const summaryText = `Potluck Summary:

Event: ${potluck?.name || 'Untitled Potluck'}
Date & Time: ${potluck?.event_datetime ? new Date(potluck.event_datetime).toLocaleString() : 'Not set'}
Location: ${potluck?.location || 'Not specified'}

Total Guests: ${guests.length}
Total Family Members: ${guests.reduce((sum, guest) => sum + (guest.family_count || 1), 0)}

Guest List: ${guests.map(guest => guest.name).join(', ')}

Dish Signups:
${(() => {
  // Group dishes by guest
  const dishesByGuest = {};
  copySignedUpGuests.forEach(guest => {
    if (!dishesByGuest[guest.name]) {
      dishesByGuest[guest.name] = [];
    }
    const dish = menu.find(d => d.id === guest.dish_id);
    if (dish) {
      dishesByGuest[guest.name].push(dish.dish || dish.name);
    }
  });
  
  // Create guest summary lines
  const guestLines = Object.entries(dishesByGuest).map(([guestName, dishes]) => {
    return `• ${guestName}: ${dishes.join(', ')}`;
  });
  
  // Add unassigned dishes
  const assignedDishIds = new Set(copySignedUpGuests.map(g => g.dish_id));
  const unassignedDishes = menu.filter(dish => !assignedDishIds.has(dish.id));
  const unassignedLines = unassignedDishes.map(dish => `• ${dish.dish || dish.name} - Still needed`);
  
  return [...guestLines, ...unassignedLines].join('\n');
})()}

Dishes Still Needed:
${(() => {
  const assignedDishIds = new Set(copySignedUpGuests.map(g => g.dish_id));
  const unassignedDishes = menu.filter(dish => !assignedDishIds.has(dish.id));
  return unassignedDishes.length > 0 
    ? unassignedDishes.map(dish => `• ${dish.dish || dish.name}`).join('\n')
    : '• All dishes are assigned!';
})()}
`;
                  navigator.clipboard.writeText(summaryText).then(() => {
                    alert('Summary copied to clipboard!');
                  }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    alert('Failed to copy to clipboard. Please try selecting and copying manually.');
                  });
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSummaryOverlay(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Who are you overlay */}
      {showWhoAreYouOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Who are you?</h2>
            <p>Please select your name to sign up for dishes</p>
            {availableGuests.length > 0 ? (
              <div className="guest-buttons-overlay">
                {availableGuests.map(guest => (
                  <button 
                    key={guest.id} 
                    className="guest-button-overlay"
                    onClick={() => selectGuest(guest.name)}
                  >
                    {guest.name}
                  </button>
                ))}
              </div>
            ) : (
              <p>No guests available. Please add guests first.</p>
            )}
            <button 
              className="btn btn-secondary"
              onClick={() => setShowWhoAreYouOverlay(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
