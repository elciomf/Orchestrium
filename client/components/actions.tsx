"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";
import { Pause, Play } from "lucide-react";
import type { Workflow } from "@/types/workflow";

export function Actions({
  workflow,
}: {
  workflow: Workflow;
}) {
  return (
    <>
      {workflow.stts ? (
        <Button
          variant={"outline"}
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
          Pause workflow
        </Button>
      ) : (
        <Button
          variant={"outline"}
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
          Resume workflow
        </Button>
      )}
    </>
  );
}
