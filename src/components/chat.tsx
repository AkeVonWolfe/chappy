import React, { useEffect, useState } from "react";
import "../App.css";
import Sidebar from "./sidebar";
import ChatArea from "./chatArea";
import type { Channel, Message, User } from "../types";

const CURRENT_USER: User = {
  id: "user-123",
  name: "Current User"
};

export default function ChatApp(): React.ReactElement {

// state variables
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  //Fetch channels from backend
  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:1337/channels");
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setChannels(data.items);
        // Automatically select the first channel if none selected
        if (!selectedChannel && data.items.length > 0) {
          setSelectedChannel(data.items[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
  try {
    const res = await fetch("http://localhost:1337/users");
    const data = await res.json();

    if (data.success && Array.isArray(data.items)) {
      setUsers(data.items);
    } else {
      console.error("Failed to fetch users: unexpected response", data);
    }
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

  // Fetch channels when the component loads
  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  const createChannel = async () => {};
  const deleteChannel = async (id: string) => {};
  const sendMessage = async () => {};

  return (
    <div className="app-container">
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        showCreateChannel={showCreateChannel}
        setShowCreateChannel={setShowCreateChannel}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        createChannel={createChannel}
        deleteChannel={deleteChannel}
        loading={loading}
        currentUser={CURRENT_USER}
      />

      <ChatArea
        selectedChannel={selectedChannel}
        messages={messages}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        loading={loading}
        currentUser={CURRENT_USER}
        users={users} 
      />
    </div>
  );
}
