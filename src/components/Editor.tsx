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
import { useRouter } from 'next/navigation';
// Note: If you don't have lucide-react installed, remove the Icon components inside the menu or install it.
import { Save, FileText, FolderOpen, Download, FileJson } from 'lucide-react'; 

interface EditorProps {
  projectId: string;
}

export default function ScreenplayEditor({ projectId }: EditorProps) {
  const router = useRouter();
  
  // State for the popup menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const editor = useMemo(
    () => withScreenplayLogic(withHistory(withReact(createEditor()))),
    []
  );

  // 1. Hook into the Cloud
  const { content, title, updateTitle, loading, saveToCloud, saveStatus } =
    useCloudStorage(projectId);

  // 2. Local State
  const [value, setValue] = useState<Descendant[]>([]);
  
  // (We removed setEditorKey as discussed)

  useEffect(() => {
    if (content && value.length === 0) {
      setValue(content);
    }
  }, [content]);

  const handleEditorChange = (newValue: Descendant[]) => {
    setValue(newValue);
    // Auto-save to cloud
    saveToCloud(newValue);
  };

  // The CSS Renderer
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    if (!element) return <p {...attributes}>{children}</p>;

    switch (element.type) {
      case "scene-heading":
        return (
          <h3
            {...attributes}
            className="mt-8 mb-4 text-left w-full"
            style={{ textTransform: "uppercase" }}
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
              marginLeft: "2.2in",
              textTransform: "uppercase",
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
              marginLeft: "1.0in",
              maxWidth: "35ch",
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
              marginLeft: "1.6in",
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

  const toggleBlock = useCallback(
    (format: ScreenplayType) => {
      Transforms.setNodes(editor, { type: format });
      ReactEditor.focus(editor);
    },
    [editor]
  );

  if (loading || value.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading Script...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-8">
      
      {/* Title Input */}
      <div className="mb-6 border-b border-gray-800 pb-4 w-full max-w-4xl">
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 outline-none text-center"
          placeholder="Untitled Screenplay"
        />
      </div>

      {/* --- MAIN TOOLBAR --- */}
      <div className="fixed top-4 flex flex-col gap-2 z-50 items-center">
        
        {/* Cloud Status Indicator */}
        <span className="text-xs text-gray-400 mb-1">
          {saveStatus === "saving"
            ? "☁️ Saving..."
            : saveStatus === "saved"
            ? "✅ Saved"
            : ""}
        </span>

        {/* --- NEW FILE MENU & FORMAT BUTTONS CONTAINER --- */}
        <div className="bg-gray-800 p-1 rounded shadow-lg flex gap-2 items-center border border-gray-700">
          
          {/* 1. THE FILE MENU BUTTON */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2"
            >
              📁 File
            </button>

            {/* THE POPUP MENU */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className="absolute left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden text-sm">
                  
                  {/* Save to Cloud (Manual Trigger) */}
                  <button
                    onClick={() => {
                      saveToCloud(value);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                  >
                    <Save size={14} /> <span>Save (Cloud)</span>
                  </button>

                  {/* Load / Open (Go to Dashboard) */}
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                  >
                    <FolderOpen size={14} /> <span>Open Project...</span>
                  </button>

                  <div className="border-t border-gray-700 my-1"></div>
                  <div className="px-4 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Export
                  </div>

                  {/* Export PDF */}
                  <button
                    onClick={() => {
                      exportToPdf(value);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                  >
                    <FileText size={14} /> <span>Download PDF</span>
                  </button>

                  {/* Export JSON / .screenplay */}
                  <button
                    onClick={() => {
                      saveToDisk(value);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                  >
                    <FileJson size={14} /> <span>Download JSON</span>
                  </button>

                </div>
              </>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-4 bg-gray-600 mx-1"></div>

          {/* 2. FORMATTING BUTTONS (Row 2 moved here to be side-by-side or keep below if preferred) */}
          <FormatButton label="Heading" format="scene-heading" onToggle={toggleBlock} />
          <FormatButton label="Action" format="action" onToggle={toggleBlock} />
          <FormatButton label="Char" format="character" onToggle={toggleBlock} />
          <FormatButton label="Dial" format="dialogue" onToggle={toggleBlock} />
          <FormatButton label="Paren" format="parenthetical" onToggle={toggleBlock} />
          <FormatButton label="Trans" format="transition" onToggle={toggleBlock} />
          
        </div>
      </div>

      {/* The Paper */}
      <div className="screenplay-page mt-28 font-courier text-[12pt] leading-tight text-black selection:bg-yellow-200 shadow-2xl">
        <Slate
          editor={editor}
          initialValue={value}
          onChange={handleEditorChange}
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
        event.preventDefault();
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