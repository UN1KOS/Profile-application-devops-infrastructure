import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa';

function Profile({ profile, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: profile.username,
    avatar: profile.avatar || ''
  });

  const handleSave = async () => {
    if (profile.isGuest) {
      alert('Гости не могут редактировать профиль!');
      return;
    }

    // Проверка на пустое имя
    if (!editedProfile.username.trim()) {
      alert('Имя не может быть пустым!');
      return;
    }

    const success = await onUpdate(profile.id, {
      username: editedProfile.username.trim(),
      avatar: editedProfile.avatar || null
    });

    if (success) {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (profile.isGuest) {
      alert('Гости не могут быть удалены!');
      return;
    }
    await onDelete(profile.id);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img 
          src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
          alt={profile.username}
          className="profile-avatar"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
          }}
        />
        
        {!profile.isGuest && !editing && (
          <div className="profile-actions">
            <button onClick={() => setEditing(true)} className="btn-edit">
              <FaEdit /> Редактировать
            </button>
            {(isAdmin || !profile.isGuest) && (
              <button onClick={handleDelete} className="btn-delete">
                <FaTrash /> Удалить
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="profile-edit">
          <div className="edit-field">
            <label>Имя:</label>
            <input
              type="text"
              value={editedProfile.username}
              onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
              placeholder="Введите имя"
              autoFocus
            />
          </div>
          
          <div className="edit-field">
            <label>URL аватарки:</label>
            <input
              type="url"
              value={editedProfile.avatar}
              onChange={(e) => setEditedProfile({...editedProfile, avatar: e.target.value})}
              placeholder="https://example.com/avatar.jpg"
            />
            <small>Оставьте пустым для аватарки по умолчанию</small>
          </div>
          
          {editedProfile.avatar && (
            <div className="avatar-preview">
              <img 
                src={editedProfile.avatar} 
                alt="preview" 
                className="preview"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="edit-buttons">
            <button onClick={handleSave} className="btn-save">
              <FaSave /> Сохранить
            </button>
            <button onClick={() => setEditing(false)} className="btn-cancel">
              <FaTimes /> Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p className="profile-id">ID: {profile.id}</p>
          
          {profile.isGuest && (
            <p className="guest-badge">👤 Гостевой аккаунт</p>
          )}
          
          {isAdmin && !profile.isGuest && (
            <p className="admin-badge">👑 Админ может редактировать</p>
          )}
          
          <div className="profile-stats">
            <div className="stat">
              <span>Создан</span>
              <strong>
                {profile.created_at 
                  ? new Date(profile.created_at).toLocaleDateString() 
                  : new Date().toLocaleDateString()}
              </strong>
            </div>
            {profile.updated_at && profile.updated_at !== profile.created_at && (
              <div className="stat">
                <span>Обновлен</span>
                <strong>{new Date(profile.updated_at).toLocaleDateString()}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
