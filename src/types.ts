export interface User {
  id: string;
  name: string;
  sk?: string; // unique user key, e.g., "USER#1"
  pk?: string;
  Guest?: boolean;
  password?: string;
}

export interface Channel {
  id: string;
  name: string;
  ownerId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
}