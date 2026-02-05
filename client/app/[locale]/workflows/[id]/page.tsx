import { Timer } from "@/components/timer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Editor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  type Workflow = {
    id: string;
    name: string;
    expr: string;
    stts: boolean;
    files: string[];
  };

  const workflow: Workflow = await response.json();

  return (
    <Tabs defaultValue="flow">
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
          <Badge
            className={`text-white
              ${
                workflow.stts
                  ? "bg-blue-600 hover:bg-blue-600"
                  : "bg-amber-600 hover:bg-amber-600"
              }
            `}
          >
            {workflow.stts ? "Active" : "Paused"}
          </Badge>
        </div>
        <TabsList>
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="flow">
        <div className="flex-1 flex flex-row gap-6">
          <div className="flex-5 flex flex-col space-y-6">
            <Timer
              locale={locale}
              expression={workflow.expr}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="editor">
        <Editor workflow={workflow} />
      </TabsContent>
    </Tabs>
  );
}
