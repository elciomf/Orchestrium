"use client";

import React from "react";
import Link from "next/link";
import { cron } from "@/lib/cron";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, CircleQuestionMark, X } from "lucide-react";

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
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between pb-4">
        <div className="flex flex-row items-center gap-1">
          {isValid ? (
            <Check className="text-emerald-500" />
          ) : (
            <X className="text-rose-500" />
          )}

          <p className="text-lg">
            {isValid
              ? `Run ${cron(currentExpression, locale).toLowerCase()}`
              : "Invalid values"}
          </p>
        </div>
        <Button
          asChild
          size="icon"
          variant="outline"
          className="rounded-full"
        >
          <Link
            rel="noopener noreferrer"
            href={"https://crontab.guru/"}
            title="Abrir crontab.guru"
            target="_blank"
          >
            <CircleQuestionMark className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Configuração
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {fields.map(({ id, label, value, setter }) => (
            <div key={id} className="flex flex-col gap-2">
              <label
                htmlFor={id}
                className="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >
                {label}
              </label>
              <Input
                id={id}
                value={value}
                placeholder={id}
                onChange={(e) => setter(e.target.value)}
                className={`text-center text-sm transition-colors ${
                  !isValidCronField(
                    value,
                    id as keyof typeof RANGES,
                  )
                    ? "border-red-500 bg-red-50 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Predefined expressions
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              size="sm"
              key={preset.expr}
              onClick={() => handlePresetClick(preset.expr)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
