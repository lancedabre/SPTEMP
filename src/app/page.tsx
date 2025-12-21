"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Plus, Trash2, FileText } from "lucide-react"; // Make sure you have these icons

// Define what a "Project" looks like in our DB
type Project = {
  id: string;
  title: string;
  updated_at: string;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  

  // 1. Fetch Projects on Load
  useEffect(() => {
    fetchProjects();
  }, []);

  

  async function fetchProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });

    if (error) console.error("Error fetching:", error);
    else setProjects(data || []);
    setLoading(false);
  }

  // 2. Create New Project Function
  // 1. Make sure the function is async
const createProject = async () => {  
    setLoading(true); // Optional: Show loading state

    // 2. Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Insert the project with the user's ID
    const { data, error } = await supabase
        .from('projects')
        .insert([{ 
            title: 'Untitled Screenplay', 
            content: [{ type: 'paragraph', children: [{ text: '' }] }], // Safe initial state
            user_id: user?.id 
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating project:", error);
    } else if (data) {
        // Redirect to the new project
        router.push(`/project/${data.id}`);
    }
    
    setLoading(false);
};

  // 3. Delete Project Function
  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Stop the link from clicking
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this script?")) return;

    await supabase.from("projects").delete().eq("id", id);
    fetchProjects(); // Refresh list
  };

  // 4. Import Project Function
  const handleImportProject = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Create a project using the FILE CONTENT
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: file.name.replace(".cinehoria", "").replace(".json", ""), // Use filename as title
            content: json,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        router.push(`/project/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to import. Is this a valid script file?");
    } finally {
      if (e.target) e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="flex h-screen w-full bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('/bg2.jpg')] bg-cover bg-center bg-fixed text-white font-sans overflow-hidden">
      <div className="w-16 h-full flex flex-col items-center justify-center select-none z-20 shrink-0">
        {/*<div className="flex flex-col gap-3 items-center text-sm font-bold tracking-widest text-white drop-shadow-[0_0_5px_rgba(235,96,195,0.5)]">         
          <span>C</span>
          <span>I</span>
          <span>N</span>
          <span>E</span>
          <span>H</span>
          <span>O</span>
          <span>R</span>
          <span>I</span>
          <span>A</span>
        </div>*/}
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">

            <div
              className="
    h-16 w-48                  /* Height and Width of your logo */
    bg-contain bg-no-repeat bg-left /* proper scaling */
    mb-2
"
            ><p className="text-6xl text-gray-200 font-bold px-0 py-3 tracking-wider">CINEHORIA</p>
</div> 
            <div className="flex gap-3">
              {/* IMPORT BUTTON */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2  hover:bg-[#eb60c3]/20 text-gray-200 rounded-2xl transition-all "
              >
                <Upload size={18} />
                <span>Import</span>
              </button>

              {/* NEW PROJECT BUTTON */}
              <button
                onClick={createProject}
                className=" hover:bg-[#eb60c3]/20 text-gray-200 px-4 py-2 rounded-2xl font-bold transition-colors shadow-lg flex items-center gap-2"
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Hidden Input for Import */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json,.cinehoria"
            onChange={handleImportProject}
          />
          <div className="text-gray-400 mb-4"><p>screenplay collection</p></div>

          {/* Project Grid */}
          {loading ? (
            <div className="text-gray-400 animate-pulse">
              Loading your work...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="block group relative"
                >
                  <div
                    className="
  bg-black/30 backdrop-blur-md 
  border border-white/10 
  p-6 rounded-2xl 
  
 
  hover:border-[#eb60c3]-500/80 
  hover:shadow-[0_0_30px_-5px_rgba(235,96,195,0.6)]
  
  transition-all duration-300    
  h-full flex flex-col justify-between group
"
                  >
                    {/* Top Row: Icon + Delete */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-gray-700/50 rounded text-gray-400">
                        <FileText size={20} />
                      </div>
                      <button
                        onClick={(e) => deleteProject(project.id, e)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                        title="Delete Script"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Title & Date */}
                    <div>
                      {/* FONT FIX: We apply the font variable here to stop the warning */}
                      <h3
                        className="text-xl font-semibold text-white group-hover:text-white truncate mb-2"
                        style={{ fontFamily: "var(--font-courier), monospace" }}
                      >
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Last edited:{" "}
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
                  No scripts yet. Click "New Project" to start writing!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
