// src/utils/pdfExporter.ts
import { ScreenplayType } from '@/types/screenplay';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

type PdfMakeLib = {
  createPdf: (docDefinition: any, tableLayouts?: any, fonts?: any, vfs?: any) => any;
  vfs: Record<string, string>;
};

// Helper: Fetch a file from public folder and convert to Base64
const getBase64FromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // remove the "data:application/octet-stream;base64," prefix
      const base64 = (reader.result as string).split(',')[1]; 
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

export const exportToPdf = async (slateNodes: any[]) => {
  // 1. Dynamic Import
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  
  // 2. Load the Fonts from /public
  // Ensure these files exist in your public/fonts folder!
  const vfs: Record<string, string> = {};
  vfs['CourierPrime-Regular.ttf'] = await getBase64FromUrl('/fonts/CourierPrime-Regular.ttf');
  vfs['CourierPrime-Bold.ttf']    = await getBase64FromUrl('/fonts/CourierPrime-Bold.ttf');
  vfs['CourierPrime-Italic.ttf']  = await getBase64FromUrl('/fonts/CourierPrime-Italic.ttf');
  vfs['CourierPrime-BoldItalic.ttf'] = await getBase64FromUrl('/fonts/CourierPrime-BoldItalic.ttf');

  // 3. Configure the Font Family
  // This object was missing in your previous error
  const fonts = {
    CourierPrime: {
      normal: 'CourierPrime-Regular.ttf',
      bold: 'CourierPrime-Bold.ttf',
      italics: 'CourierPrime-Italic.ttf',
      bolditalics: 'CourierPrime-BoldItalic.ttf',
    }
  };

  // 4. Map Slate Nodes to PDF Structure
  const content: Content[] = slateNodes.map((node: any) => {
    const text = node.children[0]?.text || "";
    const type = node.type as ScreenplayType;

    switch (type) {
      case 'scene-heading':
        return { 
          text: text.toUpperCase(), 
          margin: [0, 24, 0, 12], 
          style: 'scene' 
        };

      case 'action':
        return { 
          text: text, 
          margin: [0, 0, 0, 12] 
        };

      case 'character':
        return { 
          text: text.toUpperCase(), 
          margin: [158, 12, 0, 0], // ~2.2 inches indent
          keepWithNext: true 
        };

      case 'dialogue':
        return { 
          text: text, 
          margin: [72, 0, 72, 0] // 1 inch indent
        };

      case 'parenthetical':
        return { 
          text: `(${text})`, 
          italics: true,
          margin: [115, 0, 0, 0] // ~1.6 inches indent
        };

      case 'transition':
        return {
            text: text.toUpperCase(),
            bold: true,
            alignment: 'right',
            margin: [0, 12, 0, 12]
        };
        
      default:
        return { 
          text: text, 
          margin: [0, 0, 0, 12] 
        };
    }
  });

  // 5. Define the Document
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [108, 72, 72, 72], // 1.5in Left, 1in Top/Right/Bot
    content: content,
    defaultStyle: {
      font: 'CourierPrime',
      fontSize: 12,
      lineHeight: 1,
      alignment: 'left'
    },
    footer: function(currentPage, pageCount) {
      return { 
        text: currentPage.toString() + '.', 
        alignment: 'right',
        margin: [0, 0, 50, 0],
        color: 'gray'
      };
    }
  };

  // 6. Generate (pass docDefinition, layout, fonts, and vfs)
  pdfMake.createPdf(docDefinition, undefined, fonts, vfs).download('screenplay.pdf');
};