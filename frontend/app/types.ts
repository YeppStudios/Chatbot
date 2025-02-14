export interface UserMessage {
  text: string;
  sender: string;
}
export interface RootState {
  session: {
    id: string;
  };
  language: {
    language: string;
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


export interface RepeatType {
  session_id: any;
  text: any;
}