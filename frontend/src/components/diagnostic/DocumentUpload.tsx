"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";

export interface UploadedFile {
  file: File;
  id: string;
}

interface DocumentUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function DocumentUpload({
  files,
  onFilesChange,
  accept = "*",
  maxFiles = 10,
  maxSizeMb = 20,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxBytes = maxSizeMb * 1024 * 1024;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    const valid = selected.filter((f) => f.size <= maxBytes);
    const newEntries: UploadedFile[] = valid.slice(0, maxFiles - files.length).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }));
    onFilesChange([...files, ...newEntries]);
    e.target.value = "";
  };

  const remove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <Label className="text-ink">Upload documents for assessment (optional)</Label>
      <p className="text-sm text-ink-muted">
        e.g. audit reports, financial statements, current reports. Any file type, max {maxSizeMb}MB per file, up to {maxFiles} files.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleSelect}
        className="hidden"
        aria-label="Choose files to upload"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= maxFiles}
      >
        <Upload className="mr-2 h-4 w-4" />
        Choose files
      </Button>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map(({ id, file }) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
              <span className="min-w-0 truncate flex-1" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-ink-muted">{(file.size / 1024).toFixed(1)} KB</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => remove(id)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
