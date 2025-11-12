import React from "react"
import type { Channel, User } from "../types"



interface SidebarProps {
  channels: Channel[]
  selectedChannel: Channel | null
  setSelectedChannel: (c: Channel) => void
  showCreateChannel: boolean
  setShowCreateChannel: (b: boolean) => void
  newChannelName: string
  setNewChannelName: (name: string) => void
  createChannel: () => void
  deleteChannel: (id: string) => void
  loading: boolean
  currentUser: User
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
            onClick={() => setSelectedChannel(channel)}
            className={`sidebar-item ${selectedChannel?.id === channel.id ? "active" : ""}`}
          >
            <div className="sidebar-item-content">
              <span>{channel.name}</span>
              {channel.ownerId === currentUser.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChannel(channel.id)
                  }}
                  className="delete-button"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        {showCreateChannel ? (
          <div className="create-channel-form">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              onKeyPress={(e) => e.key === "Enter" && createChannel()}
            />
            <div className="button-group">
              <button onClick={createChannel} disabled={loading} className="create-btn">
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateChannel(false)
                  setNewChannelName("")
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCreateChannel(true)} className="create-toggle-btn">
            Create
          </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar;
