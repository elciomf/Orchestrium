"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Workflow, Step } from "@/types/workflow";
import { StepNode } from "./step";

interface WorkflowPipelineProps {
  workflow: Workflow;
}

const nodeTypes = {
  stepNode: StepNode,
};

export function Pipeline({
  workflow,
}: WorkflowPipelineProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    [],
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!workflow.steps || workflow.steps.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const levels: Map<string, number> = new Map();
    const stepMap: Map<string, Step> = new Map(
      workflow.steps.map((step) => [step.name, step]),
    );

    // Detectar e remover dependências circulares
    const getValidDependencies = (step: Step): string[] => {
      if (!step.depends) return [];
      return step.depends.filter((dep) => {
        // Remover auto-dependências
        if (dep === step.name) {
          console.warn(
            `Dependência circular detectada: ${step.name} depende de si mesmo`,
          );
          return false;
        }
        // Verificar se a dependência existe
        if (!stepMap.has(dep)) {
          console.warn(
            `Dependência não encontrada: ${dep} (referenciada por ${step.name})`,
          );
          return false;
        }
        return true;
      });
    };

    const calculateLevel = (
      stepName: string,
      visited = new Set<string>(),
      recursionStack = new Set<string>(),
    ): number => {
      if (levels.has(stepName)) {
        return levels.get(stepName)!;
      }

      // Detectar ciclos
      if (recursionStack.has(stepName)) {
        console.warn(
          `Ciclo detectado envolvendo: ${stepName}`,
        );
        return 0;
      }

      const step = stepMap.get(stepName);
      if (!step) {
        return 0;
      }

      const validDeps = getValidDependencies(step);

      if (validDeps.length === 0) {
        levels.set(stepName, 0);
        return 0;
      }

      visited.add(stepName);
      recursionStack.add(stepName);

      const depLevels = validDeps.map((dep) => {
        const newVisited = new Set(visited);
        const newRecursionStack = new Set(recursionStack);
        return calculateLevel(
          dep,
          newVisited,
          newRecursionStack,
        );
      });

      recursionStack.delete(stepName);

      const maxDepLevel = Math.max(...depLevels, -1);
      const level = maxDepLevel + 1;
      levels.set(stepName, level);
      return level;
    };

    // Calcular níveis para todos os steps
    workflow.steps.forEach((step) =>
      calculateLevel(step.name),
    );

    // Agrupar steps por nível
    const stepsByLevel: Map<number, Step[]> = new Map();
    workflow.steps.forEach((step) => {
      const level = levels.get(step.name) || 0;
      if (!stepsByLevel.has(level)) {
        stepsByLevel.set(level, []);
      }
      stepsByLevel.get(level)!.push(step);
    });

    const nodes: Node[] = [];
    const horizontalSpacing = 350;
    const verticalSpacing = 150;

    // Criar nós
    stepsByLevel.forEach((steps, level) => {
      steps.forEach((step, index) => {
        const yOffset =
          (index - (steps.length - 1) / 2) *
          verticalSpacing;
        nodes.push({
          id: step.name,
          type: "stepNode",
          position: {
            x: level * horizontalSpacing,
            y: 200 + yOffset,
          },
          data: {
            step,
            workflow,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    });

    // Criar arestas (apenas dependências válidas)
    const edges: Edge[] = [];
    workflow.steps.forEach((step) => {
      const validDeps = getValidDependencies(step);

      validDeps.forEach((dependency) => {
        edges.push({
          id: `${dependency}-${step.name}`,
          source: dependency,
          target: step.name,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: "#6366f1",
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [workflow]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!workflow.steps || workflow.steps.length === 0) {
    return (
      <div className="flex-4 flex items-center justify-center rounded-lg border bg-muted/50">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum step configurado
          </p>
          <p className="text-sm text-muted-foreground">
            Configure steps no arquivo conf.yaml para
            visualizar o pipeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-4 rounded-lg border overflow-hidden">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        minZoom={0.5}
        maxZoom={1.5}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return "#6366f1";
          }}
          className="bg-background!"
        />
      </ReactFlow>
    </div>
  );
}
