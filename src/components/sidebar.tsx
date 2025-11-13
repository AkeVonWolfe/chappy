import React, { useState } from "react";
import type { Channel, User } from "../types";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  showCreateChannel: boolean;
  setShowCreateChannel: React.Dispatch<React.SetStateAction<boolean>>;
  newChannelName: string;
  setNewChannelName: React.Dispatch<React.SetStateAction<string>>;
  createChannel: (guestAccess: boolean) => Promise<void>; //  pass guestAccess to backend
  deleteChannel: (channelId: string) => Promise<void>;
  loading: boolean;
  currentUser: User;
}

const isGuest = !localStorage.getItem("token");

const Sidebar: React.FC<SidebarProps> = ({
  channels,
  selectedChannel,
  setSelectedChannel,
  showCreateChannel,
  setShowCreateChannel,
  newChannelName,
  setNewChannelName,
  createChannel,
  deleteChannel,
  loading,
  currentUser
}) => {

  //  Local state for Guest Access
  const [guestAccess, setGuestAccess] = useState(false);

  const handleCreateChannel = async () => {
    await createChannel(guestAccess);
    setGuestAccess(false); // reset after creation
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Channels</h1>
      </div>

      <div className="sidebar-list">
        {channels.map((channel) => {
          const locked = !channel.Guest && isGuest; // only block if Guest=false and user is guest
          return (
            <div
              key={channel.id}
              className={`sidebar-item ${selectedChannel?.id === channel.id ? "active" : ""} ${
              locked ? "locked" : ""
              }`}
              onClick={() => {
              if (locked) return; //  prevent guest click
              setSelectedChannel(channel);
              }}
              title={locked ? "Login required to access this channel" : ""}
      >
          <span>{channel.name}</span>

          {!locked && channel.ownerId === currentUser.id && (
            <button
            className="delete-button"
            onClick={(e) => {
            e.stopPropagation();
            deleteChannel(channel.id);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
})}
      </div>

      <div className="sidebar-footer">
      {showCreateChannel ? (
    <div className="create-channel-form">
      <input
        type="text"
        placeholder="Channel name"
        value={newChannelName}
        onChange={(e) => setNewChannelName(e.target.value)}
      />
      <label className="guest-toggle">
        <input
          type="checkbox"
          checked={guestAccess}
          onChange={(e) => setGuestAccess(e.target.checked)}
        />
        Guest Access
      </label>

      <div className="button-group">
        <button
          onClick={handleCreateChannel}
          className="create-btn"
          disabled={loading}
        >
          Create
        </button>
        <button
          onClick={() => {
            setShowCreateChannel(false);
            setNewChannelName("");
            setGuestAccess(false);
          }}
          className="cancel-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setShowCreateChannel(true)}
      className="create-toggle-btn"
    >
      + Create
    </button>
  )}

  <button
    onClick={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }}
    className="logout-btn"
  >
    Log out
  </button>
</div>
    </div>
  );
};

export default Sidebar;
