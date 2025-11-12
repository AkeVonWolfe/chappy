import React, { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/sidebar";
import ChatArea from "./components/chatArea";
import type { Channel, Message, User } from "./types";

const API_BASE_URL = "http://localhost:3000";

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

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/channels`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.items);
        if (data.items.length > 0 && !selectedChannel) {
          setSelectedChannel(data.items[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      const mockChannels: Channel[] = [
        { id: "1", name: "Channel 1", ownerId: "user-1" },
        { id: "2", name: "Channel 2", ownerId: "user-1" },
        { id: "3", name: "Channel 3", ownerId: "user-2" },
        { id: "4", name: "Channel 4", ownerId: "user-2" }
      ];
      setChannels(mockChannels);
      setSelectedChannel(mockChannels[0]);
    }
  };

  const fetchMessages = async (channelId: string) => {
    const mockMessages: Message[] = [
      {
        id: "1",
        senderId: "user-456",
        message: "Hi, how are you?",
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: "2",
        senderId: CURRENT_USER.id,
        message: "I am good, thanks!",
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(mockMessages);
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChannelName,
          userId: CURRENT_USER.id
        })
      });
      const data = await response.json();
      if (data.success) {
        setChannels((prev) => [...prev, data.item]);
      }
    } catch (error) {
      console.error("Error creating channel:", error);
      const newChannel: Channel = {
        id: String(channels.length + 1),
        name: newChannelName,
        ownerId: CURRENT_USER.id
      };
      setChannels((prev) => [...prev, newChannel]);
    } finally {
      setNewChannelName("");
      setShowCreateChannel(false);
      setLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    e && "preventDefault" in e && e.preventDefault();
    if (!messageInput.trim() || !selectedChannel) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/channel/${selectedChannel.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageInput,
          senderId: CURRENT_USER.id
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.item]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const newMessage: Message = {
        id: String(messages.length + 1),
        senderId: CURRENT_USER.id,
        message: messageInput,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMessage]);
    } finally {
      setMessageInput("");
      setLoading(false);
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: CURRENT_USER.id })
      });
      const data = await response.json();
      if (data.success) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        if (selectedChannel?.id === channelId) {
          setSelectedChannel(channels[0] ?? null);
        }
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

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
      />
    </div>
  );
}
