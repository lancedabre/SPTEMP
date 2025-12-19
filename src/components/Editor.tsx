"use client";
import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { createEditor, Descendant, Transforms } from "slate";
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  ReactEditor,
} from "slate-react";
import { withHistory } from "slate-history";
import { withScreenplayLogic, handleTabKey } from "@/hooks/useScreenplayLogic";
import { saveToDisk, loadFromDisk } from "@/utils/fileSystem";
import { exportToPdf } from "@/utils/pdfExporter";
import { ScreenplayType } from "@/types/screenplay";
import { useCloudStorage } from "@/hooks/useCloudStorage";
const initialValue: Descendant[] = [
  { type: "scene-heading", children: [{ text: "" }] },
];

interface EditorProps {
  projectId: string;
}

export default function ScreenplayEditor({ projectId }: { projectId: string }) {
    const editor = useMemo(
    () => withScreenplayLogic(withHistory(withReact(createEditor()))),
    []
  );
  // 1. Hook into the Cloud
  const { content, loading, saveToCloud, saveStatus } =
    useCloudStorage(projectId);

  // 2. Local State (Slate needs its own state to be fast)
  const [value, setValue] = useState<Descendant[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (content && value.length === 0) {
      setValue(content);
    }
  }, [content]);
  const handleEditorChange = (newValue: Descendant[]) => {
    setValue(newValue);

    // Basic Debounce: Save after 1.5 seconds of no typing
    // Note: Real-world apps use a proper 'useDebounce' hook,
    // but we can pass the raw value to the hook if we updated useCloudStorage to handle debounce (which we did!)
    saveToCloud(newValue);
  };
  // The CSS Renderer
  // The Renderer: Converts Slate nodes into HTML with correct styles
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;

    // Safety check: If the node is broken, render a plain paragraph to prevent crashing
    if (!element) return <p {...attributes}>{children}</p>;

    switch (element.type) {
      case "scene-heading":
        return (
          <h3
            {...attributes}
            className="mt-8 mb-4 text-left w-full"
            style={{ textTransform: "uppercase" }} // Forces Uppercase
          >
            {children}
          </h3>
        );

      case "action":
        return (
          <p {...attributes} className="mb-4 text-left">
            {children}
          </p>
        );

      case "character":
        return (
          <p
            {...attributes}
            className="mt-4 mb-0"
            style={{
              marginLeft: "2.2in", // 2.2" Indent + 1.5" Page Padding = 3.7" Total
              textTransform: "uppercase", // Forces Uppercase
            }}
          >
            {children}
          </p>
        );

      case "dialogue":
        return (
          <div
            {...attributes}
            className="mb-0"
            style={{
              marginLeft: "1.0in", // 1.0" Indent + 1.5" Page Padding = 2.5" Total
              maxWidth: "35ch", // Restricts width so it looks like a column
            }}
          >
            {children}
          </div>
        );

      case "parenthetical":
        return (
          <p
            {...attributes}
            className="mb-0 italic text-sm text-gray-600"
            style={{
              marginLeft: "1.6in", // 1.6" Indent + 1.5" Page Padding = 3.1" Total
              maxWidth: "20ch",
            }}
          >
            {children}
          </p>
        );

      case "transition":
        return (
          <p
            {...attributes}
            className="text-right mt-4 mb-4"
            style={{ textTransform: "uppercase" }}
          >
            {children}
          </p>
        );

      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  const handleLoadProject = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newContent = await loadFromDisk(file);

      // Basic Validation
      if (!Array.isArray(newContent) || newContent.length === 0) {
        throw new Error("Invalid file structure");
      }

      setValue(newContent);
      setEditorKey((prev) => prev + 1);

      // Clear history so "Undo" doesn't revert to the old file
      editor.history.undos = [];
      editor.history.redos = [];
    } catch (error) {
      console.error(error);
      alert("Error loading file. It might be corrupted.");
    } finally {
      if (event.target) event.target.value = "";
    }
  };
  const toggleBlock = useCallback(
    (format: ScreenplayType) => {
      Transforms.setNodes(editor, { type: format });
      ReactEditor.focus(editor);
    },
    [editor]
  );
  if (loading || value.length === 0) {
  return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Script...</div>;
}

  // Make sure you have these imports at the top:
  // import { Transforms } from 'slate';
  // import { ReactEditor } from 'slate-react';
  // import { ScreenplayType } from '@/types/screenplay';

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-8">
      {/* --- MAIN TOOLBAR --- */}
      <div className="fixed top-4 flex flex-col gap-2 z-50">
        {/* Show Cloud Status */}
        <span className="text-xs text-gray-400 mr-4">
          {saveStatus === 'saving' ? '☁️ Saving...' : saveStatus === 'saved' ? '✅ Saved' : ''}
        </span>
        {/* Row 1: File Actions (Save/Load/Export) */}
        <div className="bg-gray-800 text-white p-2 rounded shadow-lg flex justify-center gap-4 items-center border border-gray-700">
          <button
            onClick={() => saveToDisk(value)}
            className="hover:text-green-400 font-medium text-sm"
          >
            Save
          </button>
          <div className="w-px h-4 bg-gray-600"></div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-blue-400 font-medium text-sm"
          >
            Load
          </button>
          <div className="w-px h-4 bg-gray-600"></div>
          <button
            onClick={() => exportToPdf(value)}
            className="hover:text-red-400 font-bold text-sm"
          >
            PDF
          </button>
        </div>

        {/* Row 2: Formatting Buttons (The new feature) */}
        <div className="bg-gray-800 text-white p-1 rounded shadow-lg flex gap-1 items-center border border-gray-700">
          <FormatButton
            label="Heading"
            format="scene-heading"
            onToggle={toggleBlock}
          />
          <FormatButton label="Action" format="action" onToggle={toggleBlock} />
          <FormatButton
            label="Char"
            format="character"
            onToggle={toggleBlock}
          />
          <FormatButton label="Dial" format="dialogue" onToggle={toggleBlock} />
          <FormatButton
            label="Paren"
            format="parenthetical"
            onToggle={toggleBlock}
          />
          <FormatButton
            label="Trans"
            format="transition"
            onToggle={toggleBlock}
          />
        </div>
      </div>

      {/* Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".screenplay,.json"
        onChange={handleLoadProject}
      />

      {/* The Paper */}
      <div className="screenplay-page mt-28 font-courier text-[12pt] leading-tight text-black selection:bg-yellow-200 shadow-2xl">
        <Slate 
        editor={editor} 
        initialValue={value} 
        onChange={handleEditorChange} // <--- Updated Handler
     >
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
// -------------------------------------------------------------------------
// Helper Component: FormatButton
// Place this OUTSIDE your main ScreenplayEditor function (at the bottom of the file)
// -------------------------------------------------------------------------

interface FormatButtonProps {
  label: string;
  format: ScreenplayType;
  onToggle: (format: ScreenplayType) => void;
}

const FormatButton = ({ label, format, onToggle }: FormatButtonProps) => {
  return (
    <button
      onMouseDown={(event) => {
        event.preventDefault(); // Prevents the editor from losing focus
        onToggle(format);
      }}
      className="
        px-3 py-1 
        text-[10px] font-bold uppercase tracking-wider 
        bg-gray-700 text-gray-300 
        hover:bg-gray-600 hover:text-white 
        rounded transition-colors
      "
    >
      {label}
    </button>
  );
};
