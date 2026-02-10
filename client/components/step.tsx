"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCw, FileCode } from "lucide-react";
import type { Step, Workflow } from "@/types/workflow";

interface StepNodeData {
  step: Step;
  workflow: Workflow;
}

export const StepNode = memo(
  ({ data }: NodeProps<StepNodeData>) => {
    const { step } = data;

    return (
      <Card className="min-w-70 w-full shadow-md hover:border-primary/50 transition-all duration-200">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-background! border-2! border-primary! hover:bg-primary! transition-colors"
        />

        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <FileCode className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-semibold tracking-tight">
              {step.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {step.script}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Dependencies
            </h4>
            {step.depends && step.depends.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {step.depends.map((dep) => (
                  <Badge
                    key={dep}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {dep}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground/70 font-normal"
              >
                None
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium">
                {step.timeout}s
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded">
              <RotateCw className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-medium">
                {step.attempts}x
              </span>
            </div>
          </div>
        </CardContent>

        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-background! border-2! border-primary! hover:bg-primary! transition-colors"
        />
      </Card>
    );
  },
);

StepNode.displayName = "StepNode";
