import React, { useState } from 'react';
import { FaLock, FaUnlock, FaTrash, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';

function AdminPanel({ onClose, onLogin, isAdmin, profiles, onProfileUpdate, onProfileDelete, API_URL, showMessage }) {
  const [password, setPassword] = useState('');
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', avatar: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: password })
      });
      
      if (response.ok) {
        onLogin(true);
        showMessage('Добро пожаловать, администратор!', 'success');
      } else {
        showMessage('Неверный пароль', 'error');
      }
    } catch (error) {
      showMessage('Ошибка входа', 'error');
    }
  };

  const handleAdminUpdate = async (profileId) => {
    const success = await onProfileUpdate(profileId, editForm);
    if (success) {
      setEditingProfile(null);
    }
  };

  const handleAdminDelete = async (profileId) => {
    if (window.confirm('Вы уверены? Это действие необратимо!')) {
      await onProfileDelete(profileId);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h2><FaLock /> Панель администратора</h2>
          <button onClick={onClose} className="btn-close">
            <FaTimes />
          </button>
        </div>
        
        <div className="admin-login">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Пароль администратора:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary">
              <FaUnlock /> Войти
            </button>
          </form>
          <p className="admin-hint">Подсказка: admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2><FaUnlock /> Админ-панель</h2>
        <button onClick={onClose} className="btn-close">
          <FaTimes />
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">Всего профилей:</span>
          <span className="stat-value">{profiles.length}</span>
        </div>
      </div>

      <div className="admin-profiles">
        <h3>Управление профилями</h3>
        <div className="admin-table">
          <div className="admin-table-header">
            <div>ID</div>
            <div>Имя</div>
            <div>Аватар</div>
            <div>Создан</div>
            <div>Действия</div>
          </div>
          
          {profiles.map(profile => (
            <div key={profile.id} className="admin-table-row">
              {editingProfile === profile.id ? (
                <>
                  <div className="profile-id">{profile.id.slice(0, 8)}...</div>
                  <div>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      placeholder="Имя"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                      placeholder="URL аватарки"
                    />
                  </div>
                  <div>{new Date(profile.created_at).toLocaleDateString()}</div>
                  <div className="admin-actions">
                    <button onClick={() => handleAdminUpdate(profile.id)} className="btn-icon success">
                      <FaCheck />
                    </button>
                    <button onClick={() => setEditingProfile(null)} className="btn-icon">
                      <FaTimes />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-id">{profile.id.slice(0, 8)}...</div>
                  <div>{profile.username}</div>
                  <div>
                    <img 
                      src={profile.avatar} 
                      alt={profile.username}
                      className="admin-avatar"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
                      }}
                    />
                  </div>
                  <div>{new Date(profile.created_at).toLocaleDateString()}</div>
                  <div className="admin-actions">
                    <button 
                      onClick={() => {
                        setEditingProfile(profile.id);
                        setEditForm({
                          username: profile.username,
                          avatar: profile.avatar || ''
                        });
                      }} 
                      className="btn-icon warning"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleAdminDelete(profile.id)} 
                      className="btn-icon danger"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
