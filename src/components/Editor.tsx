'use client'
import React, { useMemo, useCallback, useState } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { withScreenplayLogic, handleTabKey } from '@/hooks/useScreenplayLogic';
import { saveToDisk, loadFromDisk } from '@/utils/fileSystem';
import { exportToPdf } from '@/utils/pdfExporter';
const initialValue: Descendant[] = [{ type: 'scene-heading', children: [{ text: 'INT. START HERE' }] }];

export default function ScreenplayEditor() {
  const editor = useMemo(() => withScreenplayLogic(withHistory(withReact(createEditor()))), []);
  const [value, setValue] = useState<Descendant[]>(initialValue);

  // The CSS Renderer
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case 'scene-heading': return <h3 {...attributes} className="font-bold uppercase mt-8 mb-4">{children}</h3>;
      case 'action':        return <p {...attributes} className="mb-4">{children}</p>;
      case 'character':     return <p {...attributes} className="mt-4 mb-0 ml-character-indent font-bold uppercase">{children}</p>;
      case 'dialogue':      return <div {...attributes} className="ml-dialogue-indent max-w-dialogue mb-0">{children}</div>;
      case 'parenthetical': return <p {...attributes} className="ml-parenthetical-indent max-w-parenthetical italic text-sm mb-0">{children}</p>;
      case 'transition':    return <p {...attributes} className="text-right uppercase font-bold mt-4 mb-4">{children}</p>;
      default:              return <p {...attributes}>{children}</p>;
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-8">
      {/* Toolbar */}
      <div className="fixed top-4 bg-gray-800 text-white p-2 rounded shadow-lg flex gap-4 z-50">
        <button onClick={() => saveToDisk(value)} className="hover:text-green-400">Save Project</button>
        <label className="cursor-pointer hover:text-blue-400">
          Load Project
          <input type="file" className="hidden" accept=".screenplay" onChange={async (e) => {
            if (e.target.files?.[0]) setValue(await loadFromDisk(e.target.files[0]));
          }}/>
        </label>
        <div className="w-px bg-gray-600"></div>
        <button onClick={() => exportToPdf(value)} className="hover:text-red-400 font-bold">Export PDF</button>
      </div>

      {/* The Paper */}
      <div className="screenplay-page font-courier text-[12pt] leading-tight">
        <Slate editor={editor} initialValue={value} onChange={setValue}>
          <Editable 
            renderElement={renderElement}
            onKeyDown={(e) => handleTabKey(editor, e)}
            spellCheck={false}
            className="outline-none min-h-[10in]"
          />
        </Slate>
      </div>
      <button 
  onClick={() => exportToPdf(value)} // 'value' is your Slate state
  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
>
  Export PDF
</button>
    </div>
  );
}