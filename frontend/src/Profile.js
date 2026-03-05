import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa';

function Profile({ profile = {}, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: profile.username || '',
    avatar: profile.avatar || ''
  });

  const handleSave = async () => {
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
    await onDelete(profile.id);
  };

  return (
    <div className="profile-container">
      <img
        src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
        alt={profile.username}
      />

      {!editing ? (
        <>
          <h2>{profile.username}</h2>
          <p>ID: {profile.id}</p>
          <button onClick={() => setEditing(true)}>Редактировать</button>
          {(isAdmin || !profile.isGuest) && (
            <button onClick={handleDelete}>Удалить</button>
          )}
        </>
      ) : (
        <>
          <input
            value={editedProfile.username}
            onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
          />
          <button onClick={handleSave}>Сохранить</button>
          <button onClick={() => setEditing(false)}>Отмена</button>
        </>
      )}
    </div>
  );
}

export default Profile;
