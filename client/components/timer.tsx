"use client";

import React from "react";
import { cron } from "@/lib/cron";
import { Input } from "./ui/input";
import { CircleQuestionMark, Clock } from "lucide-react";
import { Field, FieldLabel } from "./ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import Link from "next/link";

const RANGES = {
  sec: { min: 0, max: 59 },
  min: { min: 0, max: 59 },
  hou: { min: 0, max: 23 },
  dom: { min: 1, max: 31 },
  mon: { min: 1, max: 12 },
  dow: { min: 0, max: 6 },
} as const;

function isValidCronField(
  value: string,
  field: keyof typeof RANGES,
): boolean {
  if (value === "*") return true;

  if (/^\*\/\d+$/.test(value)) {
    const step = parseInt(value.split("/")[1], 10);
    const { max } = RANGES[field];
    return step > 0 && step <= max;
  }

  if (/^\d+-\d+$/.test(value)) {
    const [start, end] = value.split("-").map(Number);
    const { min, max } = RANGES[field];
    return start >= min && end <= max && start <= end;
  }

  if (/^\d+-\d+\/\d+$/.test(value)) {
    const [range, step] = value.split("/");
    const [start, end] = range.split("-").map(Number);
    const stepNum = parseInt(step, 10);
    const { min, max } = RANGES[field];
    return (
      start >= min &&
      end <= max &&
      start <= end &&
      stepNum > 0
    );
  }

  if (/^\d+(,\d+)*$/.test(value)) {
    const { min, max } = RANGES[field];
    return value.split(",").every((num) => {
      const n = parseInt(num, 10);
      return n >= min && n <= max;
    });
  }

  const num = parseInt(value, 10);
  if (!isNaN(num)) {
    const { min, max } = RANGES[field];
    return num >= min && num <= max;
  }

  return false;
}

export function Timer({
  locale,
  expression,
  onExpressionChange,
}: {
  locale: string;
  expression: string;
  onExpressionChange?: (expr: string) => void;
}) {
  const [sec, setSec] = React.useState("");
  const [min, setMin] = React.useState("");
  const [hou, setHou] = React.useState("");
  const [dom, setDom] = React.useState("");
  const [mon, setMon] = React.useState("");
  const [dow, setDow] = React.useState("");

  React.useEffect(() => {
    const parts = expression.split(" ");
    setSec(parts[0] || "0");
    setMin(parts[1] || "0");
    setHou(parts[2] || "0");
    setDom(parts[3] || "*");
    setMon(parts[4] || "*");
    setDow(parts[5] || "*");
  }, [expression]);

  const currentExpression = `${sec} ${min} ${hou} ${dom} ${mon} ${dow}`;

  const isValid =
    isValidCronField(sec, "sec") &&
    isValidCronField(min, "min") &&
    isValidCronField(hou, "hou") &&
    isValidCronField(dom, "dom") &&
    isValidCronField(mon, "mon") &&
    isValidCronField(dow, "dow");

  React.useEffect(() => {
    if (isValid && onExpressionChange) {
      onExpressionChange(currentExpression);
    }
  }, [currentExpression, isValid, onExpressionChange]);

  const fields = [
    {
      id: "sec",
      label: "Seconds",
      value: sec,
      setter: setSec,
    },
    {
      id: "min",
      label: "Minutes",
      value: min,
      setter: setMin,
    },
    {
      id: "hou",
      label: "Hours",
      value: hou,
      setter: setHou,
    },
    {
      id: "dom",
      label: "Day of Month",
      value: dom,
      setter: setDom,
    },
    {
      id: "mon",
      label: "Month",
      value: mon,
      setter: setMon,
    },
    {
      id: "dow",
      label: "Day of Week",
      value: dow,
      setter: setDow,
    },
  ];

  const PRESETS = [
    {
      name: "Every minute",
      expr: "0 * * * * *",
    },
    {
      name: "Every five minutes",
      expr: "0 */5 * * * *",
    },
    {
      name: "Every hour",
      expr: "0 0 * * * *",
    },
    {
      name: "Daily Midnight",
      expr: "0 0 0 * * *",
    },
    {
      name: "Daily 9am",
      expr: "0 0 9 * * *",
    },
    {
      name: "Every monday 9am",
      expr: "0 0 9 * * 1",
    },
    {
      name: "Weekdays 9am",
      expr: "0 0 9 * * 1-5",
    },
  ];

  const handlePresetClick = (presetExpr: string) => {
    const [s, m, h, d, mo, dw] = presetExpr.split(" ");
    setSec(s);
    setMin(m);
    setHou(h);
    setDom(d);
    setMon(mo);
    setDow(dw);
  };

  return (
    <div className="flex-1 flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-lg">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Cron Configuration
        </p>
        <Button variant={"ghost"} asChild>
          <Link
            href={"https://crontab.guru/"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CircleQuestionMark />
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-between p-4 gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <strong>Running:</strong>
            {isValid ? (
              <p>
                {cron(
                  currentExpression,
                  locale,
                ).toLowerCase()}
              </p>
            ) : (
              <p className="text-red-500">
                Invalid cron expression
              </p>
            )}
          </div>

          <Field>
            <FieldLabel>Predefined expressions</FieldLabel>
            <Select onValueChange={handlePresetClick}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent position={"popper"}>
                {PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.expr}
                    value={preset.expr}
                  >
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ id, label, value, setter }) => (
              <Field key={id} className="space-y-1">
                <FieldLabel htmlFor={id}>
                  {label}
                </FieldLabel>
                <Input
                  id={id}
                  value={value}
                  placeholder={id}
                  onChange={(e) => setter(e.target.value)}
                  className={`${
                    !isValidCronField(
                      value,
                      id as keyof typeof RANGES,
                    )
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
              </Field>
            ))}
          </div>
        </div>

        <Button className="w-full mt-2">
          Submit Configuration
        </Button>
      </div>
    </div>
  );
}
