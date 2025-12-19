'use client'
import React from 'react';
import { useParams } from 'next/navigation';
import ScreenplayEditor from '@/components/Editor';

// This 'export default' is what Next.js is looking for!
export default function ProjectPage() {
  const params = useParams();
  
  // Handle the case where params might be waiting to load
  if (!params?.id) {
    return <div className="text-white p-8">Loading Project...</div>;
  }

  return (
    <ScreenplayEditor projectId={params.id as string} />
  );
}