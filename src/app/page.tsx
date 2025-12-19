'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  // 1. Fetch Projects on Load
  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false });

    if (error) console.error('Error fetching:', error);
    else setProjects(data || []);
    setLoading(false);
  }

  // 2. Create New Project Function
  async function createProject() {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        title: 'Untitled Screenplay',
        content: [{ type: 'scene-heading', children: [{ text: 'INT. START HERE' }] }] 
      }])
      .select()
      .single();

    if (error) {
      alert("Failed to create project");
      console.error(error);
    } else if (data) {
      // Redirect to the new editor room
      router.push(`/project/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">My Screenplays</h1>
          <button 
            onClick={createProject}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg flex items-center gap-2"
          >
            <span>+</span> New Project
          </button>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="text-gray-400 animate-pulse">Loading your work...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/project/${project.id}`}
                className="block group"
              >
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-blue-500 hover:shadow-blue-900/20 transition-all h-full">
                  <h3 className="text-xl font-bold text-gray-200 group-hover:text-white truncate mb-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Last edited: {new Date(project.updated_at).toLocaleDateString()}
                  </p>
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
  );
}