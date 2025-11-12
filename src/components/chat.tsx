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

  // Fetch channels
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

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:1337/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setUsers(data.items);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Fetch channel messages
  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:1337/messages/${channelId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setMessages(data.items);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch direct messages between current user and another
  const fetchDirectMessages = async (userId: string) => {
  // remove DynamoDB key prefix if present
  const cleanUserId = userId.startsWith("USER#") ? userId.replace("USER#", "") : userId;

  try {
    setLoading(true);
    const res = await fetch(
      `http://localhost:1337/messages/direct/${CURRENT_USER.id}/${cleanUserId}`
    );
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setMessages(data.items);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error fetching direct messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  // Fetch messages when switching between chat modes
  useEffect(() => {
    if (isDirectChat && selectedUser) {
      fetchDirectMessages(selectedUser.sk || selectedUser.id);
    } else if (!isDirectChat && selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel, selectedUser, isDirectChat]);

  // sendMessage handles both channels and DMs
  const sendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    try {
      setLoading(true);
      let url = "";
      let body = {
        message: messageInput,
        senderId: CURRENT_USER.id,
      };

      if (isDirectChat && selectedUser) {
        url = `http://localhost:1337/messages/direct/${selectedUser.sk || selectedUser.id}`;
      } else if (selectedChannel) {
        url = `http://localhost:1337/messages/${selectedChannel.id}`;
      } else {
        return;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.item]);
        setMessageInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async () => {};
  const deleteChannel = async (id: string) => {};

  return (
    <div className="app-container">
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        setSelectedChannel={(ch) => {
          setIsDirectChat(false);
          setSelectedChannel(ch);
        }}
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
