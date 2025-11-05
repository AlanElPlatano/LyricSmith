import React from 'react';

interface FileUploadButtonProps {
  accept: string;
  onFileSelect: (content: string) => void;
  className: string;
  children: React.ReactNode;
}

export function FileUploadButton({ accept, onFileSelect, className, children }: FileUploadButtonProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onFileSelect(result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <label className={`block px-4 py-2 rounded cursor-pointer text-center ${className}`}>
      {children}
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}