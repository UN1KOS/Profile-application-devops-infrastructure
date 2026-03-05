import React, { useState, useEffect } from 'react';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import './styles.css';
import { FaUser, FaSignInAlt, FaSignOutAlt, FaCog } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.109';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newProfile, setNewProfile] = useState({ username: '', avatar: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch(`${API_URL}/profiles`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      showMessage('Ошибка загрузки профилей', 'error');
    }
  };

  const createProfile = async (e) => {
    e.preventDefault();
    if (!newProfile.username.trim()) {
      showMessage('Имя не может быть пустым', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newProfile.username.trim(),
          avatar: newProfile.avatar || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProfiles([...profiles, data]);
        setCurrentProfile(data);
        setShowCreateForm(false);
        setNewProfile({ username: '', avatar: '' });
        showMessage('Профиль создан!', 'success');
      } else {
        showMessage(data.detail || 'Ошибка создания', 'error');
      }
    } catch (error) {
      showMessage('Ошибка сервера', 'error');
    }
  };

  const updateProfile = async (profileId, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (response.ok) {
        setProfiles(profiles.map(p => (p.id === profileId ? data : p)));
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(data);
        }
        showMessage('Профиль обновлен!', 'success');
        return true;
      } else {
        showMessage(data.detail || 'Ошибка обновления', 'error');
        return false;
      }
    } catch (error) {
      showMessage('Ошибка сервера', 'error');
      return false;
    }
  };

  const deleteProfile = async (profileId) => {
    if (!window.confirm('Вы уверены, что хотите удалить профиль?')) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(null);
        }
        showMessage('Профиль удален', 'success');
        return true;
      } else {
        const data = await response.json();
        showMessage(data.detail || 'Ошибка удаления', 'error');
        return false;
      }
    } catch (error) {
      showMessage('Ошибка сервера', 'error');
      return false;
    }
  };

  const loginAsGuest = () => {
    const guestProfile = {
      id: 'guest-' + Date.now(),
      username: 'Гость ' + Math.floor(Math.random() * 1000),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${Date.now()}`,
      isGuest: true
    };
    setCurrentProfile(guestProfile);
    showMessage('Добро пожаловать, гость!', 'success');
  };

  const logout = () => {
    setCurrentProfile(null);
    showMessage('Вы вышли из профиля', 'info');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>🎭 Profile App</h1>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>

        <div className="header-right">
          {!currentProfile ? (
            <>
              <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                <FaUser /> Создать профиль
              </button>
              <button onClick={loginAsGuest} className="btn-secondary">
                <FaSignInAlt /> Войти как гость
              </button>
              <button onClick={() => setShowAdminPanel(true)} className="btn-admin">
                <FaCog /> Админка
              </button>
            </>
          ) : (
            <>
              <span className="welcome">Привет, {currentProfile.username}!</span>
              <button onClick={logout} className="btn-logout">
                <FaSignOutAlt /> Выйти
              </button>
            </>
          )}
        </div>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <main className="main">
        {showAdminPanel ? (
          <AdminPanel
            onClose={() => setShowAdminPanel(false)}
            onLogin={setIsAdmin}
            isAdmin={isAdmin}
            profiles={profiles}
            onProfileUpdate={updateProfile}
            onProfileDelete={deleteProfile}
            API_URL={API_URL}
            showMessage={showMessage}
          />
        ) : currentProfile ? (
          <Profile
            profile={currentProfile}
            onUpdate={updateProfile}
            onDelete={deleteProfile}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="profiles-grid">
            {(profiles || []).map(profile => (
              <div
                key={profile.id}
                className="profile-card"
                onClick={() => setCurrentProfile(profile)}
              >
                <img
                  src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                  alt={profile.username}
                  className="avatar"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
                  }}
                />
                <h3>{profile.username}</h3>
                <p className="profile-id">ID: {profile.id.slice(0, 8)}...</p>
                <button className="btn-select">Выбрать</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateForm && (
        <div className="modal" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Создать новый профиль</h2>
            <form onSubmit={createProfile}>
              <div className="form-group">
                <label>Имя пользователя:</label>
                <input
                  type="text"
                  value={newProfile.username}
                  onChange={(e) => setNewProfile({...newProfile, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>URL аватарки (необязательно):</label>
                <input
                  type="url"
                  value={newProfile.avatar}
                  onChange={(e) => setNewProfile({...newProfile, avatar: e.target.value})}
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Создать</button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
