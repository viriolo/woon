export type TodaySheetMode = "preview" | "detail";

export interface TodaySheetState {
  isOpen: boolean;
  mode: TodaySheetMode;
}
