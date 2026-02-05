"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  FileText,
  Folder,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

type Workflow = {
  id: string;
  name: string;
  expr: string;
  stts: boolean;
  files: string[];
};

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
  const [file, setFile] = React.useState<string | null>(
    null,
  );
  const [fileContent, setFileContent] =
    React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    null,
  );
  const [success, setSuccess] = React.useState<
    string | null
  >(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalContent, setOriginalContent] =
    React.useState<string>("");

  React.useEffect(() => {
    if (!file) {
      setFileContent("");
      setOriginalContent("");
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
        setFileContent(data.content);
        setOriginalContent(data.content);
        setHasChanges(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro desconhecido",
        );
        setFileContent("");
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [file, workflow.id]);

  React.useEffect(() => {
    setHasChanges(fileContent !== originalContent);
  }, [fileContent, originalContent]);

  const handleSave = async () => {
    if (!file) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/workflows/${workflow.id}/file/${file}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: fileContent,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao salvar arquivo: ${response.status}`,
        );
      }

      const data = await response.json();
      setOriginalContent(fileContent);
      setHasChanges(false);
      setSuccess("Arquivo salvo com sucesso!");

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
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

  return (
    <div className="flex flex-row gap-6">
      <div className="flex-4">
        {file ? (
          <div className="overflow-hidden">
            <div className="flex flex-row items-center justify-between py-1 pl-2">
              <p className="text-sm font-semibold">
                {file}
                {hasChanges && (
                  <span className="ml-2 text-amber-600">
                    *
                  </span>
                )}
              </p>
              <div className="space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  title={
                    hasChanges
                      ? "Salvar alterações"
                      : "Nenhuma alteração"
                  }
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save />
                  )}
                </Button>
                <Button
                  variant={"ghost"}
                  onClick={() => setFile(null)}
                  disabled={saving}
                >
                  <X className="text-rose-500" />
                </Button>
              </div>
            </div>
            {success && (
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700 text-sm">
                  {success}
                </p>
              </div>
            )}
            {error && (
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">
                  {error}
                </p>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center min-h-96">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <textarea
                value={fileContent}
                onChange={(event) =>
                  setFileContent(event.target.value)
                }
                className="w-full min-h-96 p-4 font-mono text-sm focus:outline-none resize-none border"
                spellCheck="false"
                placeholder="Selecione um arquivo..."
              />
            )}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Folder />
              </EmptyMedia>
              <EmptyTitle>No file</EmptyTitle>
              <EmptyDescription>
                Use the explorer on the <br /> right to
                select a file.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <div className="flex-1 overflow-hidden border">
        <div className="px-4 py-2 border-b bg-neutral-50">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files ({workflow.files.length})
          </p>
        </div>
        <ScrollArea>
          <div className="space-y-1 p-2">
            {workflow.files.length > 0 ? (
              workflow.files.map((fileName, index) => (
                <button
                  key={index}
                  onClick={() => setFile(fileName)}
                  className={`w-full text-left px-3 py-2 text-sm break-all rounded transition-colors ${
                    file === fileName
                      ? "bg-neutral-100 text-neutral-900"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  {fileName}
                </button>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-sm text-neutral-500">
                No files yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
