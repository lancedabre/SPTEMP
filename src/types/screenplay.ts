// src/types/screenplay.ts
import { BaseEditor, BaseSelection } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

// 1. Define your Text Types
export type ScreenplayText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

// 2. Define your Element Types (Action, Dialogue, etc.)
export type ScreenplayType = 
  | 'paragraph'
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'slugline';

export type ScreenplayElement = {
  type: ScreenplayType;
  children: ScreenplayText[];
  align?: string; // Optional: for center alignment logic
};

// 3. Aliases for standard Slate names
// This stops the "Type mismatch" error by making them synonymous
export type CustomElement = ScreenplayElement;
export type CustomText = ScreenplayText;

// 4. Module Augmentation (The Global Override)
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement; // ✅ We use the standard name 'CustomElement' here
    Text: CustomText;
  }
}