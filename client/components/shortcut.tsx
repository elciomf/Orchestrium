"use client";

import {
  Ellipsis,
  Pencil,
  Play,
  Pause,
  Trash2,
  FileText,
  Copy,
  Files,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Workflow } from "@/types/workflow";

export function Shortcut({
  workflow,
}: {
  workflow: Workflow;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          Workflow Actions
        </DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link
            href={`/workflows/${workflow.id}`}
            className="cursor-pointer w-full flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit details</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={`/workflows/${workflow.id}/logs`}
            className="cursor-pointer w-full flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>View logs</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {workflow.stts ? (
            <DropdownMenuItem
              onClick={async () => {
                await fetch(
                  `http://localhost:3000/api/workflows/${workflow.id}/pause`,
                  {
                    method: "PATCH",
                  },
                ).then(() =>
                  toast("Workflow has been paused."),
                );
              }}
            >
              <Pause className="mr-2 h-4 w-4 text-yellow-600" />
              <span>Pause workflow</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={async () => {
                await fetch(
                  `http://localhost:3000/api/workflows/${workflow.id}/resume`,
                  {
                    method: "PATCH",
                  },
                ).then(() =>
                  toast("Workflow has been resumed."),
                );
              }}
            >
              <Play className="mr-2 h-4 w-4 text-green-600" />
              <span>Resume workflow</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <Files className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy ID</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete workflow</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
