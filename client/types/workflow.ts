export interface Step {
  name: string;
  script: string;
  depends: string[];
  timeout: number;
  attempts: number;
}

export interface Workflow {
  id: string;
  name: string;
  expr: string;
  stts: boolean;
  steps: Step[];
  next?: string;
  prev?: string;
  files: string[];
}
