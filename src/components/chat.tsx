import React, { useEffect, useState } from "react";
import "../App.css";
import Sidebar from "./sidebar";
import ChatArea from "./chatArea";
import type { Channel, Message, User } from "../types";

export default function ChatApp(): React.ReactElement {
  // user info from localStorage
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;

  const CURRENT_USER: User = parsedUser
    ? {
        id: parsedUser.userId || parsedUser.id,
        userId: parsedUser.userId || parsedUser.id,
        name: parsedUser.name || "Unknown User",
      }
    : { id: "guest", userId: "guest", name: "Guest User" };

  //  STATE VARIABLES
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isDirectChat, setIsDirectChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // -------------------- FETCH CHANNELS --------------------
  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:1337/channels");
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setChannels(data.items);
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

  // FETCH USERS 
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:1337/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  //  FETCH MESSAGES CHANNEL 
  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:1337/messages/${channelId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setMessages(data.items);
      } else {
        setMessages([]);
        console.error("Failed to fetch messages:", data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // FETCH MESSAGES (DIRECT CHAT) 
  const fetchDirectMessages = async (targetId: string) => {
    try {
      setLoading(true);
    const currentId = CURRENT_USER.userId || CURRENT_USER.id;
    console.log(" Fetching DMs for:", { currentId, targetId });
    const url = `http://localhost:1337/messages/direct/${currentId}/${targetId}`;
    console.log(" GET", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log(" Fetched direct messages:", data);

      if (data.success && Array.isArray(data.items)) {
        console.log("Fetched direct messages:", data.items);
        setMessages(data.items);
        
      } else {
        setMessages([]);
        console.error("Failed to fetch direct messages:", data);
      }
    } catch (err) {
      console.error("Error fetching direct messages:", err);
    } finally {
      setLoading(false);
    }
    
  };

  //  EFFECTS 
  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      setIsDirectChat(false);
      setMessages([]);
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  // SEND MESSAGE 
  const sendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
  e?.preventDefault();
  if (!messageInput.trim()) return;

  try {
    setLoading(true);

    const senderId = CURRENT_USER.userId || CURRENT_USER.id;
    let endpoint = "";

    if (isDirectChat && selectedUser) {
        const cleanTargetId = (selectedUser.sk || selectedUser.id || "").replace("USER#", "");
        const senderId = CURRENT_USER.userId || CURRENT_USER.id;
      endpoint = `http://localhost:1337/messages/direct/${senderId}/${cleanTargetId}`;
    } else if (selectedChannel) {
      // Channel message 
      endpoint = `http://localhost:1337/messages/${selectedChannel.id}`;
    } else {
      console.warn("No target channel or user selected");
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageInput,
        senderId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessageInput("");
      // Refresh messages after sending
      if (isDirectChat && selectedUser) {
        // Refresh direct messages
        const cleanTargetId = (selectedUser.sk || selectedUser.id || "").replace(/^USER#/, "");
        await fetchDirectMessages(cleanTargetId);
      } else if (selectedChannel) {
        // Refresh channel messages
        await fetchMessages(selectedChannel.id);
      }
    } else {
      console.error("Failed to send message:", data);
    }
  } catch (err) {
    console.error("Error sending message:", err);
  } finally {
    setLoading(false);
  }
};

  // CHANNEL MANAGEMENT 
  const createChannel = async () => {
  if (!newChannelName.trim()) return;

  try {
    setLoading(true);

    const Guest = (window as any).newChannelGuest || false;
    const res = await fetch("http://localhost:1337/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newChannelName,
        ownerId: CURRENT_USER.userId || CURRENT_USER.id,
        Guest,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setChannels((prev) => [...prev, data.item]);
      setNewChannelName("");
      setShowCreateChannel(false);
    } else {
      console.error("Failed to create channel:", data);
    }
  } catch (err) {
    console.error("Error creating channel:", err);
  } finally {
    setLoading(false);
  }
};
  const deleteChannel = async (id: string) => {};

  // RENDER 
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
        isDirectChat={isDirectChat}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setIsDirectChat={setIsDirectChat}
        fetchDirectMessages={fetchDirectMessages}
      />
    </div>
  );
}
