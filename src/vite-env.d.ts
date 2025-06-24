/// <reference types="vite/client" />

declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string;
    messages: Array<{ type: string; message: string }>;
  }>;
}

declare module 'xlsx' {
  export function read(data: ArrayBuffer, options: { type: string }): {
    SheetNames: string[];
    Sheets: Record<string, any>;
  };
  export const utils: {
    sheet_to_txt(worksheet: any): string;
  };
}
