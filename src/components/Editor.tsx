"use client";
import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { createEditor, Descendant, Transforms, Editor } from "slate";
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  ReactEditor,
  RenderLeafProps,
} from "slate-react";
import { withHistory } from "slate-history";
import { withScreenplayLogic, handleTabKey } from "@/hooks/useScreenplayLogic";
import { saveToDisk } from "@/utils/fileSystem";
import { exportToPdf } from "@/utils/pdfExporter";
import { ScreenplayType } from "@/types/screenplay";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { useRouter } from "next/navigation";
import {
  Save,
  FileText,
  FolderOpen,
  FileJson,
  Bold,
  Italic, 
  Underline,
} from "lucide-react";
import Link from "next/link";

interface EditorProps {
  projectId: string;
  setLoading: (loading: boolean) => void;
}

export default function ScreenplayEditor({ projectId, setLoading }: EditorProps) {  const router = useRouter();
  const [projectTitle, setProjectTitle] = useState("Untitled");
  // --- HELPERS (Copied exactly from your code) ---
  const isBoldMarkActive = (editor: Editor) => {
    const marks = Editor.marks(editor);
    return marks ? marks.bold === true : false;
  };

  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    // @ts-ignore 
    return marks ? marks[format] === true : false;
  };

  const toggleMark = (editor: Editor, format: string) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children, attributes, leaf } = props;
    if (leaf.bold) children = <strong>{children}</strong>;
    if (leaf.italic) children = <em>{children}</em>;
    if (leaf.underline) children = <u>{children}</u>;
    return <span {...attributes}>{children}</span>;
  }, []);

  // --- STATE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const editor = useMemo(
    () => withScreenplayLogic(withHistory(withReact(createEditor()))),
    []
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("Invalid file format");
      setValue(json);
      saveToCloud(json);
      alert("Script loaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to load file. Is it a valid JSON?");
    } finally {
      if (e.target) e.target.value = ''; 
    }
  };

  const { content, title, updateTitle, loading, saveToCloud, saveStatus } = useCloudStorage(projectId);
  const INITIAL_EMPTY_STATE = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  } as any
];

const [value, setValue] = useState<Descendant[]>(INITIAL_EMPTY_STATE);

  // Add this right after your useState lines
useEffect(() => {
  // Only update if we actually have content from the hook
  if (content && content.length > 0) {
    setValue(content);
  }
  
  // Sync the title too
  if (title) {
    setProjectTitle(title);
  }
}, [content, title]); // <--- Reruns whenever the hook finishes loading


  const handleEditorChange = (newValue: Descendant[]) => {
    setValue(newValue);
    saveToCloud(newValue);
  };

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    if (!element) return <p {...attributes}>{children}</p>;

    switch (element.type) {
      case "scene-heading":
        return <h3 {...attributes} className="mt-8 mb-4 text-left w-full" style={{ textTransform: "uppercase" }}>{children}</h3>;
      case "action":
        return <p {...attributes} className="mb-4 text-left">{children}</p>;
      case "character":
        return <p {...attributes} className="mt-4 mb-0" style={{ marginLeft: "2.2in", textTransform: "uppercase" }}>{children}</p>;
      case "dialogue":
        return <div {...attributes} className="mb-0" style={{ marginLeft: "1.0in", maxWidth: "35ch" }}>{children}</div>;
      case "parenthetical":
      return (
        <p 
          {...attributes} 
          // 1. Removed 'italic' and 'text-gray-600' (Screenplays should be standard black)
          className="mb-0 text-sm text-black" 
          style={{ marginLeft: "2.0in", maxWidth: "15ch" }} // Tweaked margins slightly to look more standard
        >
          {/* 2. The Opening Bracket (Un-deletable) */}
          <span contentEditable={false} className="select-none mr-1px">(</span>
          
          {/* 3. The Actual Text */}
          {children}
          
          {/* 4. The Closing Bracket (Un-deletable) */}
          <span contentEditable={false} className="select-none ml-1px">)</span>
        </p>
      );
      case "transition":
        return <p {...attributes} className="text-right mt-4 mb-4" style={{ textTransform: "uppercase" }}>{children}</p>;
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
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Script...</div>;
  }

  return (
    // 1. CHANGED: Main Container to Flex Row (Horizontal Layout)
    <div className="flex h-screen w-full bg-black overflow-hidden font-sans">
      
      {/* --- LEFT SIDEBAR (The Taskbar) --- */}
      <aside className="w-24 bg-black border-r border-gray-900 flex flex-col items-center py-4 gap-4 z-50 shadow-xl overflow-y-auto custom-scrollbar">
        
        {/* Cloud Status */}
        <div title={saveStatus === 'saving' ? 'Saving...' : 'Saved'} className="mb-2">
            <span className="text-xs">{saveStatus === "saving" ? "☁️" : "saved ✔️"}</span>
        </div>

        {/* File Menu (Compact) */}
        <div className="relative w-full px-2">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-full aspect-square hover:bg-gray-600/60 rounded-2xl flex flex-col items-center justify-center text-white transition-colors gap-1"
            >
                <FolderOpen size={20} />
            </button>

             {/* POPUP MENU */}
             {isMenuOpen && (
              <>
                {/* Invisible Backdrop to close menu when clicking outside */}
                <div className="fixed inset-0 z-99" onClick={() => setIsMenuOpen(false)}/>
                
                {/* FIX: Changed from 'absolute' to 'fixed'. 
                   'left-28' pushes it right of the w-24 sidebar.
                   'z-[100]' ensures it floats above everything.
                */}
                <div className="fixed left-26 top-20 w-56 bg-black border border-gray-700 rounded-lg shadow-2xl z-100 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { saveToCloud(value); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors">
                    <Save size={14} /> <span>Save (Cloud)</span>
                  </button>
                  <button onClick={() => router.push("/")} className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors">
                    <FolderOpen size={14} /> <span>Open Project...</span>
                  </button>
                  <button 
  onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} 
  className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
>
  {/* Just the Icon, no wrapper div needed anymore */}
  <FileJson size={14} />
  <span>Import</span>
</button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button onClick={() => { exportToPdf(value); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors">
                    <FileText size={14} /> <span>Export PDF</span>
                  </button>
                  <button 
  onClick={() => { 
    // Pass the title as the second argument
    saveToDisk(value, projectTitle); 
    setIsMenuOpen(false); 
  }} className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors">
                    <FileJson size={14} /> <span>Export</span>
                  </button>
                </div>
              </>
            )}
        </div>

        <div className="w-10 h-px bg-gray-700"></div>

        {/* Format Buttons (Stacked Vertically) */}
        <div className="flex flex-col w-full px-2 gap-2">
            <FormatButton label="HEAD" format="scene-heading" onToggle={toggleBlock} />
            <FormatButton label="ACTION" format="action" onToggle={toggleBlock} />
            <FormatButton label="CHARACTER" format="character" onToggle={toggleBlock} />
            <FormatButton label="DIALOGUE" format="dialogue" onToggle={toggleBlock} />
            <FormatButton label="PARENTHESES" format="parenthetical" onToggle={toggleBlock} />
            <FormatButton label="TRANSITION" format="transition" onToggle={toggleBlock} />
        </div>

        <div className="w-10 h-px bg-gray-700"></div>

        {/* Style Icons (Vertical or Grid) */}
        <div className="flex flex-col gap-2 w-full px-4">
            <FormatIconButton icon={<Bold size={16} />} isActive={isMarkActive(editor, 'bold')} onToggle={() => toggleMark(editor, 'bold')} />
            <FormatIconButton icon={<Italic size={16} />} isActive={isMarkActive(editor, 'italic')} onToggle={() => toggleMark(editor, 'italic')} />
            <FormatIconButton icon={<Underline size={16} />} isActive={isMarkActive(editor, 'underline')} onToggle={() => toggleMark(editor, 'underline')} />
        </div>

      </aside>

      {/* --- RIGHT CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full relative">

        {/* 2. MOVED: Title Input to Top Right (Absolute Position) */}
        <div className="absolute top-6 right-10 flex flex-col items-end z-40">
           {/* Brand Logo */}
           <Link 
  href="/" 
  className="flex items-center gap-2 mb-1 opacity-50 hover:opacity-100 transition-opacity select-none cursor-pointer"
>
  <span className="text-[10px] font-bold tracking-[0.3em] text-[#ff99cc]">CINEHORIA</span>
  <div className="h-4 w-4 mb-0 bg-contain bg-no-repeat bg-left" style={{ backgroundImage: "url('/logo6.png')" }}>
            </div> 
</Link>
           <div className="w-50 h-px bg-gray-700 my-2"></div>
           <input
            type="text"
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            className="w-[400px] bg-transparent text-right text-1xl font-bold text-white placeholder-gray-700 outline-none"
            placeholder="Untitled Screenplay"
          />
        </div>

        {/* 3. CENTERED PAPER: Scrollable Container */}
        <div className="flex-1 h-full w-full overflow-y-auto p-8 pb-96 scroll-smooth relative">
            {/* I removed the 'mt-28' from here because the toolbar is no longer fixed at the top.
               Everything else about the paper is EXACTLY as you had it.
            */}
            <div className="screenplay-page mx-auto my-10 font-courier text-[12pt] leading-tight text-black selection:bg-gray-200 shadow-2xl bg-white min-h-[11in] w-[8.5in]">
                <Slate 
    // CRITICAL FIX: The key changes when data arrives, forcing a refresh
    key={JSON.stringify(value)} 
    editor={editor} 
    initialValue={value} 
    onChange={handleEditorChange}
>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    className="outline-none focus:outline-none focus:ring-0 min-h-[10in]" // Added padding inside the paper so text doesn't hit edge
                    placeholder="INT. SCENE HEADING - DAY"
                    spellCheck={false}
                    onKeyDown={(e) => {
    // 🛡️ SAFETY CHECK: If editor is empty or invalid, stop immediately.
    if (!editor.children || editor.children.length === 0) return;
    
    // Your existing shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleMark(editor, 'bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); toggleMark(editor, 'italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); toggleMark(editor, 'underline'); }
    handleTabKey(editor, e);
}}
                />
                </Slate>
            </div>
        </div>

      </main>

      {/* Hidden Input for loading files */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json,.screenplay,.cinehoria"
        onChange={handleLoadLocalFile}
      />
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
        w-full py-2 
        text-[9px] font-bold uppercase tracking-wider 
        text-gray-400 
        hover:bg-gray-600 hover:text-white 
        rounded-2xl transition-colors
      "
    >
      {label}
    </button>
  );
};

// -------------------------------------------------------------------------
// Helper Component: FormatIconButton
// -------------------------------------------------------------------------
interface IconBtnProps {
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

const FormatIconButton = ({ icon, isActive, onToggle }: IconBtnProps) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault(); 
      onToggle();
    }}
    className={`
      p-2 w-full flex justify-center rounded transition-colors
      ${isActive 
        ? "bg-white text-black shadow-sm" 
        : "text-gray-400 hover:text-white hover:bg-gray-700"
      }
    `}
  >
    {icon}
  </button>
);