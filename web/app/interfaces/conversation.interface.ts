export interface Message {
  id: string;
  content: string;
  senderId: string;
  propertyId: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  propertyId: string;
  propertyTitle: string;
  agentId?: string;
  messages: Message[];
}

export interface ScheduleVisitPayload {
  senderId: string;
  propertyId: string;
  content?: string;
}
