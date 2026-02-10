"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { FileText, Pause, Play } from "lucide-react";
import type { Workflow } from "@/types/workflow";

export function Actions({
  workflow,
}: {
  workflow: Workflow;
}) {
  return (
    <div className="flex space-x-2">
      <Button
        variant={"outline"}
        onClick={async () => {
          await fetch(
            `http://localhost:3000/api/workflows/${workflow.id}/${workflow.stts ? "pause" : "resume"}`,
            {
              method: "PATCH",
            },
          ).then(() =>
            toast.info(
              `Workflow has been ${workflow.stts ? "paused" : "resumed"}. `,
            ),
          );
        }}
      >
        {workflow.stts ? (
          <Pause className="mr-2 h-4 w-4 text-yellow-600" />
        ) : (
          <Play className="mr-2 h-4 w-4 text-green-600" />
        )}

        {workflow.stts ? "Pause" : "Resume"}
      </Button>

      <Button asChild variant={"secondary"}>
        <Link href={`/workflows/${workflow.id}/logs`}>
          <FileText /> Logs
        </Link>
      </Button>
    </div>
  );
}
