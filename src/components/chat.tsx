import React, { useState } from "react";
import "../App.css";
import Sidebar from "./sidebar";
import ChatArea from "./chatArea";
import type { Channel, Message, User } from "../types";

const CURRENT_USER: User = {
  id: "user-123",
  name: "Current User"
};

export default function ChatApp(): React.ReactElement {
  const [channels] = useState<Channel[]>([
    { id: "1", name: "Channel 1", ownerId: "user-123" },
    { id: "2", name: "Channel 2", ownerId: "user-456" },
    { id: "3", name: "Channel 3", ownerId: "user-789" },
    { id: "4", name: "Channel 4", ownerId: "user-000" }
  ]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels[0]);
  const [messages] = useState<Message[]>([
    { id: "m1", senderId: "user-456", message: "Hi, how are you?", timestamp: new Date().toISOString() },
    { id: "m2", senderId: "user-123", message: "Hi, how are you?", timestamp: new Date().toISOString() }
  ]);
  const [messageInput, setMessageInput] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [loading, setLoading] = useState(false);

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
      />
    </div>
  );
}
