"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import type { Workflow } from "@/types/workflow";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Loader2,
  Save,
  X,
  Copy,
  Check,
  FilePlusCorner,
} from "lucide-react";
import { Input } from "./ui/input";

type FileContent = {
  id: string;
  filename: string;
  content: string;
};

export function Editor({
  workflow,
}: {
  workflow: Workflow;
}) {
  const [newFile, setNewFile] = React.useState(false);
  const [newFilename, setNewFilename] = React.useState("");
  const [file, setFile] = React.useState<string | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(
    null,
  );
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [content, setContent] = React.useState<string>("");
  const [hasChanges, setHasChanges] = React.useState(false);
  const [original, setOriginal] =
    React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const textareaRef =
    React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!file) {
      setContent("");
      setOriginal("");
      setError(null);
      setHasChanges(false);
      return;
    }

    const fetchFileContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/workflows/${workflow.id}/file/${file}`,
        );

        if (!response.ok) {
          throw new Error(
            `Erro ao carregar arquivo: ${response.status}`,
          );
        }

        const data: FileContent = await response.json();
        setContent(data.content);
        setOriginal(data.content);
        setHasChanges(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro desconhecido",
        );
        setContent("");
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [file, workflow.id]);

  React.useEffect(() => {
    setHasChanges(content !== original);
  }, [content, original]);

  const handleSave = async () => {
    if (!file) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workflows/${workflow.id}/file/${file}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao salvar arquivo: ${response.status}`,
        );
      }

      setOriginal(content);
      setHasChanges(false);
      toast("File saved successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar arquivo",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex gap-4">
      <div className="flex-4 flex flex-col rounded-lg border">
        {file ? (
          <>
            <div className="flex flex-row items-center justify-between px-4 py-3 border-b rounded-t-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-neutral-400 shrink-0" />
                <p className="text-sm font-semibold truncate">
                  {file}
                </p>
                {hasChanges && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs mr-2">
                  {content.split("\n").length}
                  {""}
                  {content.split("\n").length === 1
                    ? "line"
                    : "lines"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  title="Copy file content"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    Save
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFile(null)}
                  disabled={saving}
                >
                  <X className="h-4 w-4 hover:text-rose-400" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2 bg-red-950 border-b border-red-900">
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 flex min-h-0">
                <div className="shrink-0 border-r px-3 py-4 select-none">
                  <div className="text-right text-sm leading-relaxed font-mono">
                    {Array.from(
                      {
                        length: content.split("\n").length,
                      },
                      (_, i) => (
                        <div key={i + 1}>{i + 1}</div>
                      ),
                    )}
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  className="flex-1 p-4 font-mono text-sm focus:outline-none resize-none overflow-auto"
                  spellCheck="false"
                  style={{
                    lineHeight: "1.5rem",
                    tabSize: 2,
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center select-none">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-lg  flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 " />
              </div>
              <div>
                <p className="text-neutral-400 font-medium">
                  No file selected
                </p>
                <p className="text-sm">
                  Choose a file from the list to start
                  editing
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col rounded-lg border">
        <div className="flex flex-row items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-lg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files
            <span className="ml-auto text-xs  px-2 py-1 rounded">
              {workflow.files.length}
            </span>
          </p>
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={() => setNewFile(true)}
          >
            <FilePlusCorner />
          </Button>
        </div>
        <ScrollArea>
          <div className="space-y-1 p-2">
            {workflow.files.length > 0 ? (
              workflow.files.map((fileName, index) => (
                <button
                  key={index}
                  onClick={() => setFile(fileName)}
                  className={`w-full text-left px-3 py-2 text-sm break-all rounded hover:bg-neutral-100 transition-colors cursor-pointer ${
                    file === fileName && "bg-neutral-200"
                  }`}
                >
                  {fileName}
                </button>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-sm ">
                No files yet
              </p>
            )}
            {newFile && (
              <Input
                autoFocus
                placeholder="Enter the file name."
                onChange={(event) =>
                  setNewFilename(event.target.value)
                }
                onBlur={() => {
                  setNewFile(false);
                  setNewFilename("");
                }}
                onKeyDown={async (event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();

                    try {
                      await fetch(
                        `/api/workflows/${workflow.id}/file/${newFilename}`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type":
                              "application/json",
                          },
                        },
                      );

                      setNewFilename("");

                      setNewFile(false);
                    } catch (error) {
                      console.error(
                        "Failed to create file",
                        error,
                      );
                    }
                  }
                }}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
