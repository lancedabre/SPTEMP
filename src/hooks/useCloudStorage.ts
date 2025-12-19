import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Descendant } from 'slate';

export function useCloudStorage(projectId: string) {
  // State
  const [content, setContent] = useState<Descendant[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  // 1. LOAD: Fetch data when the component mounts
  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('content')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error loading:', error);
      } else if (data) {
        // If content is empty/null, provide a default
        setContent(data.content || [{ type: 'scene-heading', children: [{ text: 'INT. START HERE' }] }]);
      }
      setLoading(false);
    }

    if (projectId) fetchProject();
  }, [projectId]);

  // 2. SAVE: Function to trigger updates
  const saveToCloud = async (newContent: Descendant[]) => {
    setSaveStatus('saving');
    const { error } = await supabase
      .from('projects')
      .update({ 
        content: newContent,
        updated_at: new Date()
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
    }
  };

  return { content, loading, saveToCloud, saveStatus };
}