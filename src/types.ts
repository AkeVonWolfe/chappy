export interface User {
  id: string;
  name: string;
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