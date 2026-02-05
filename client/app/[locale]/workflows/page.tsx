import { Actions } from "@/components/actions";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cron } from "@/lib/cron";

export default async function Workflows({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const response = await fetch(
    "http://localhost:3000/api/workflows",
    {
      cache: "no-store",
    },
  );

  type Workflow = {
    id: string;
    name: string;
    expr: string;
    next: string;
    prev: string;
    stts: boolean;
  };

  const workflows: Workflow[] = await response.json();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expression</TableHead>
            <TableHead>Next run</TableHead>
            <TableHead>Previous run</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows?.map((workflow: Workflow) => (
            <TableRow key={workflow.id}>
              <TableCell className="font-medium">
                {workflow.name}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    workflow.stts
                      ? "bg-blue-600 hover:bg-blue-600 text-white"
                      : "bg-amber-600 hover:bg-amber-600 text-white"
                  }
                >
                  {workflow.stts ? "Active" : "Paused"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cron(workflow.expr, locale)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {workflow.next}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {workflow.prev}
              </TableCell>
              <TableCell className="text-right">
                <Actions workflow={workflow} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
