// page.tsx
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { Timer } from "@/components/timer";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Actions } from "@/components/actions";
import type { Workflow } from "@/types/workflow";
import { Pipeline } from "@/components/pipeline";

export default async function Workflow({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const response = await fetch(
    `http://localhost:3000/api/workflows/${id}`,
    {
      cache: "no-store",
    },
  );

  const workflow: Workflow = await response.json();

  return (
    <Tabs
      defaultValue="flow"
      className="flex-1 overflow-hidden"
    >
      <div className="pb-2 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <p className="text-2xl font-medium">
              {workflow.name}
            </p>
            <Button variant={"ghost"}>
              <Pencil />
            </Button>
          </div>
          <Actions workflow={workflow} />
        </div>
        <TabsList>
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="flow" className="flex">
        <div className="flex-1 flex gap-4 h-full">
          <Pipeline workflow={workflow} />
          <Timer
            locale={locale}
            expression={workflow.expr}
          />
        </div>
      </TabsContent>
      <TabsContent value="editor" className="flex">
        <Editor workflow={workflow} />
      </TabsContent>
    </Tabs>
  );
}
