'use client'
import React, { useMemo, useCallback, useState, useRef } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { withScreenplayLogic, handleTabKey } from '@/hooks/useScreenplayLogic';
import { saveToDisk, loadFromDisk } from '@/utils/fileSystem';
import { exportToPdf } from '@/utils/pdfExporter';

const initialValue: Descendant[] = [{ type: 'scene-heading', children: [{ text: '' }] }];

export default function ScreenplayEditor() {
  const editor = useMemo(() => withScreenplayLogic(withHistory(withReact(createEditor()))), []);
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The CSS Renderer
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    
    // Guardian against empty nodes
    if (!element) {
      return <p {...attributes}>{children}</p>;
    }

    switch (element.type) {
      case 'scene-heading': 
        return (
          <h3 
            {...attributes} 
            className="font-uppercase mt-8 mb-4 text-left w-full ml-0"
          >
            {children}
          </h3>
        );
      case 'action':        return <p {...attributes} className="mb-4">{children}</p>;
      case 'character':     return <p {...attributes} className="mt-4 mb-0 ml-character-indent font-uppercase">{children}</p>;
      case 'dialogue':      return <p {...attributes} className="ml-dialogue-indent max-w-dialogue mb-0">{children}</p>;
      case 'parenthetical': return <p {...attributes} className="ml-parenthetical-indent max-w-parenthetical italic text-sm mb-0">{children}</p>;
      case 'transition':    return <p {...attributes} className="text-right uppercase font-bold mt-4 mb-4">{children}</p>;
      default:              return <p {...attributes}>{children}</p>;
    }
  }, []);

  const handleLoadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newContent = await loadFromDisk(file);
      
      // Basic Validation
      if (!Array.isArray(newContent) || newContent.length === 0) {
        throw new Error("Invalid file structure");
      }

      setValue(newContent);
      setEditorKey(prev => prev + 1);
      
      // Clear history so "Undo" doesn't revert to the old file
      editor.history.undos = [];
      editor.history.redos = [];

    } catch (error) {
      console.error(error);
      alert("Error loading file. It might be corrupted.");
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-8">
      
      {/* Toolbar */}
      <div className="fixed top-4 bg-gray-800 text-white p-2 rounded shadow-lg flex gap-4 z-50 items-center border border-gray-700">
        <button onClick={() => saveToDisk(value)} className="hover:text-green-400 font-medium transition-colors">
          Save Project
        </button>
        <div className="w-px h-6 bg-gray-600"></div>
        <button onClick={() => fileInputRef.current?.click()} className="hover:text-blue-400 font-medium transition-colors">
          Load Project
        </button>
        <div className="w-px h-6 bg-gray-600"></div>
        <button onClick={() => exportToPdf(value)} className="hover:text-red-400 font-bold transition-colors">
          Export PDF
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept=".screenplay,.json" onChange={handleLoadProject} />

      <div className="screenplay-page mt-16 font-courier text-[12pt] leading-tight text-black selection:bg-yellow-200 shadow-2xl">
        <Slate key={editorKey} editor={editor} initialValue={value} onChange={setValue}>
          <Editable 
            renderElement={renderElement}
            onKeyDown={(e) => handleTabKey(editor, e)}
            spellCheck={false}
            className="outline-none min-h-[10in]"
            placeholder="INT. SCENE HEADING - DAY"
          />
        </Slate>
      </div>
    </div>
  );
}