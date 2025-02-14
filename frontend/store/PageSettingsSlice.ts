// store/pageSettingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PageSettingsState {
    avatarID: string;
    assistantID: string;
    voiceID: string;
    knowledgebaseID: string;
    backgroundUrl: string;
    logoUrl: string;
    route: string;
}

const initialState: PageSettingsState = {
    avatarID: "",
    assistantID: "",
    voiceID: "",
    knowledgebaseID: "",
    backgroundUrl: "",
    logoUrl: "",
    route: ""
};

export const pageSettingsSlice = createSlice({
  name: 'pageSettings',
  initialState,
  reducers: {
    setPageSettings(state, action: PayloadAction<PageSettingsState>) {
      return {
        ...state,
        ...action.payload
      };
    },
  },
});

export const { setPageSettings } = pageSettingsSlice.actions;

export default pageSettingsSlice.reducer;