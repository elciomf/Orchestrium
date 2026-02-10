import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cron } from "@/lib/cron";
import { Badge } from "@/components/ui/badge";
import { Shortcut } from "@/components/shortcut";
import type { Workflow } from "@/types/workflow";

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
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="hover:underline"
                >
                  {workflow.name}
                </Link>
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
                <Shortcut workflow={workflow} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
