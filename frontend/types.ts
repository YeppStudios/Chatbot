export interface Avatar {
  name: string;
  img: string;
  avatarId: string;
}

export interface Options {
  name: string;
  value: string;
}

export interface Codes {
  code: string;
  role: string;
}

type Message = {
  messenger: "User" | "Avatar";
  text: string;
};

export interface Conversation {
  threadId: string;
  user: string;
  chatbot: string;
  startTime: string;
  lastUpdated: string;
  title: string;
}

export interface UserMessage {
  text: string;
  sender: string;
}

interface Session {
  _id: string;
  table_number: number;
  user_orders: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  _id: string;
  user_id: string;
  user_name: string;
  items: any[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface APIOrder {
  session: Session;
  orders: OrderItem[];
}

export interface WebSocketMessage {
  type: "new_item" | "session_updated";
  order_id: string; // ID of the specific order being updated
  session_id: string; // ID of the parent session
  table_number?: number;
  item?: any; // The new item being added
  order?: OrderItem; // The complete updated order
}

export interface RootState {
  session: {
    id: string;
    isTalking: boolean;
    speechEndTime: number | null;
  };
  conversation: {
    id: string;
  };
  pageSettings: {
    avatarID: string;
    assistantID: string;
    voiceID: string;
    knowledgebaseID: string;
    backgroundUrl: string;
    logoUrl: string;
    route: string;
  };
  user: {
    userId: string;
    name: string;
    userRole: string;
    token: string;
    language: string;
  };
}

export interface Conversation {
  threadId: string;
  user: string;
  chatbot: string;
  startTime: string;
  lastUpdated: string;
  title: string;
}


export interface LoginResponse {
  success: boolean;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    language: string;
    code: string;
  };
  access_token?: string;
  error?: string;
}