import { Descendant } from 'slate';

export const saveToDisk = (content: Descendant[], filename: string = "script") => {
  const data = JSON.stringify(content, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.screenplay`; // Custom extension
  a.click();
  URL.revokeObjectURL(url);
};

export const loadFromDisk = (file: File): Promise<Descendant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};