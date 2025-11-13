import React, { useState } from "react";
import type { Channel, User } from "../types";


// Props interface for Sidebar component
interface SidebarProps {
  channels: Channel[];  // list of channels
  selectedChannel: Channel | null; // currently selected channel
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>; // setter for selected channel
  showCreateChannel: boolean;  // whether to show create channel form
  setShowCreateChannel: React.Dispatch<React.SetStateAction<boolean>>; // setter for show create channel form
  newChannelName: string; // name for new channel
  setNewChannelName: React.Dispatch<React.SetStateAction<string>>; // setter for new channel name
  createChannel: (guestAccess: boolean) => Promise<void>; //  pass guestAccess to backend
  deleteChannel: (channelId: string) => Promise<void>; // function to delete a channel
  loading: boolean; // loading state for API requests
  currentUser: User; // current logged-in user info
}

const isGuest = !localStorage.getItem("token"); // check if user is guest

// Sidebar component definition with props above
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
    await createChannel(guestAccess);  // pass guestAccess to creation function
    setGuestAccess(false); // reset guest access after creation
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
              className={`sidebar-item ${selectedChannel?.id === channel.id ? "active" : ""} ${  // add locked class
              locked ? "locked" : ""  // disable click if locked
              }`}
              onClick={() => {
              if (locked) return; //  prevent guest click
              setSelectedChannel(channel);
              }}
              title={locked ? "Login required to access this channel" : ""}
      >
          <div className="channel-item-content">
           <span className="channel-name">{channel.name}</span>
            {!locked && channel.ownerId === currentUser.id && ( // show delete button only for owners
              <button
                className="delete-button"
                onClick={(e) => {
                e.stopPropagation();
                deleteChannel(channel.id);  // call delete function with channel id
              }}
                title="Delete channel"
      >
              Delete 
            </button>
    )}
  </div>
</div>
  );
})}
      </div>

      <div className="sidebar-footer">
      {showCreateChannel ? (
    <div className="create-channel-form">
      <input
        type="text"
        placeholder="Channel name" // input for new channel name
        value={newChannelName}  // bind to state
        onChange={(e) => setNewChannelName(e.target.value)} // update state on change
      />
      <label className="guest-toggle">
        <input
          type="checkbox" // toggle for guest access
          checked={guestAccess} // bind to state
          onChange={(e) => setGuestAccess(e.target.checked)} // update state on change
        />
        Guest Access
      </label>

      <div className="button-group">
        <button
          onClick={handleCreateChannel} // create channel on click
          className="create-btn" 
          disabled={loading} // disable while loading
        >
          Create
        </button>
        <button
          onClick={() => {
            setShowCreateChannel(false); // cancel creation
            setNewChannelName(""); // reset name
            setGuestAccess(false); // reset guest access
          }}
          className="cancel-btn" 
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setShowCreateChannel(true)} // show creation form
      className="create-toggle-btn" 
    >
      + Create
    </button>
  )}

  <button
    onClick={() => {
      localStorage.removeItem("token"); // remove token on logout
      localStorage.removeItem("user"); // remove user data on logout
      window.location.href = "/"; // redirect to login
    }}
    className="logout-btn"
  >
    Log out
  </button>

  <button
  onClick={async () => {
    const confirmDelete = window.confirm( // confirm before deleting replace this with real valdiation message
      "Are you sure you want to permanently delete your account?"
    );
    if (!confirmDelete) return; // abort if not confirmed

    const token = localStorage.getItem("token"); // get auth token
    const userStr = localStorage.getItem("user");  // get user data
    const user = userStr ? JSON.parse(userStr) : null; // parse user data
    const userId = user?.userId || user?.id; // extract user ID

    if (!userId || !token) {  // check if user ID and token exist
      console.log("You must be logged in to delete your account.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:1337/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) { // check if deletion was successful
        console.log("Your account has been deleted.");
        localStorage.removeItem("token"); // remove token on account deletion
        localStorage.removeItem("user"); // remove user data on account deletion
        window.location.href = "/"; // redirect to login
      } else {
        console.log(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      console.log("Something went wrong while deleting your account.");
    }
  }}
  className="delete-account-btn"
>
  Delete Account
</button>
</div>
    </div>
  );
};

export default Sidebar;
