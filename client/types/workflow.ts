export type Workflow = {
  id: string;
  name: string;
  expr: string;
  stts: boolean;
  next: string;
  prev: string;
  files: string[];
};
