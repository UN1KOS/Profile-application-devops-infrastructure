import React, { useState } from 'react';
import { FaLock, FaUnlock, FaTrash, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';

function AdminPanel({ onClose, onLogin, isAdmin, profiles = [], onProfileUpdate, onProfileDelete, API_URL, showMessage }) {
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
    if (window.confirm('Вы уверены?')) {
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
            />
            <button type="submit">
              <FaUnlock /> Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h2>Админ-панель</h2>

      <div className="admin-profiles">
        {(profiles || []).map(profile => (
          <div key={profile.id} className="admin-row">
            <div>{profile.username}</div>
            <div className="actions">
              <button onClick={() => {
                setEditingProfile(profile.id);
                setEditForm({
                  username: profile.username,
                  avatar: profile.avatar || ''
                });
              }}>
                <FaEdit />
              </button>
              <button onClick={() => handleAdminDelete(profile.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
