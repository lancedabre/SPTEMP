import { Editor, Transforms, Element as SlateElement, Range } from 'slate';
import { ScreenplayType } from '@/types/screenplay';

export const withScreenplayLogic = (editor: Editor) => {
  const { insertBreak } = editor;

  // 1. Handle "Enter" Key (The Sequence Predictor)
  editor.insertBreak = () => {
    const { selection } = editor;
    if (!selection) return insertBreak();

    const [match] = Editor.nodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
      mode: 'lowest',
    });

    if (match) {
      const [node] = match;
      const type = (node as any).type as ScreenplayType;

      let nextType: ScreenplayType = 'action'; // Default fallback

      // The State Machine Rules
      switch (type) {
        case 'scene-heading': nextType = 'character'; break;
        case 'character':     nextType = 'dialogue'; break;
        case 'parenthetical': nextType = 'dialogue'; break;
        case 'dialogue':      nextType = 'character'; break; // Fast dialogue switching
        case 'transition':    nextType = 'scene-heading'; break;
        default:              nextType = 'action';
      }

      insertBreak();
      
      // Transform the NEW line into the predicted type
      Transforms.setNodes(editor, { type: nextType });
      return;
    }
    
    insertBreak();
  };

  return editor;
};

// 2. Handle "Tab" Key (The Type Switcher)
// Call this inside your onKeyDown handler in the component
export const handleTabKey = (editor: Editor, event: React.KeyboardEvent) => {
  if (event.key !== 'Tab') return;

  event.preventDefault();
  
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
    mode: 'lowest',
  });

  if (!match) return;
  const [node] = match;
  const type = (node as any).type as ScreenplayType;

  let newType: ScreenplayType = type;

  // Logic: Tab cycles through types based on context
  if (type === 'action') newType = 'character';
  else if (type === 'character') newType = 'transition';
  else if (type === 'transition') newType = 'action';
  else if (type === 'dialogue') newType = 'parenthetical';
  else if (type === 'parenthetical') newType = 'dialogue';

  if (newType !== type) {
    Transforms.setNodes(editor, { type: newType });
  }
};