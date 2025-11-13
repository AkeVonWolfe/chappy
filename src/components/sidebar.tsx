import React from "react";
import type { Channel, User } from "../types";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  showCreateChannel: boolean;
  setShowCreateChannel: React.Dispatch<React.SetStateAction<boolean>>;
  newChannelName: string;
  setNewChannelName: React.Dispatch<React.SetStateAction<string>>;
  createChannel: () => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  loading: boolean;
  currentUser: User;
}

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
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Channels</h1>
      </div>

      <div className="sidebar-list">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={`sidebar-item ${selectedChannel?.id === channel.id ? "active" : ""}`}
            onClick={() => setSelectedChannel(channel)}
          >
            <span>{channel.name}</span>
            {channel.ownerId === currentUser.id && (
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
        ))}
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
              checked={!!(window as any).newChannelGuest}
              onChange={(e) => ((window as any).newChannelGuest = e.target.checked)}
              />
            Guest Access
            </label>

            <div className="button-group">
              <button onClick={createChannel} className="create-btn" disabled={loading}>
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateChannel(false);
                  setNewChannelName("");
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCreateChannel(true)} className="create-toggle-btn">
            + Create
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
