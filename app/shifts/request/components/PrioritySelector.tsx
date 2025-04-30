"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (value: Priority) => void;
  className?: string;
}

export function PrioritySelector({
  value,
  onChange,
  className,
}: PrioritySelectorProps) {
  const priorityOptions = [
    { value: "HIGH", label: "高", description: "最優先希望" },
    { value: "MEDIUM", label: "中", description: "希望" },
    { value: "LOW", label: "低", description: "可能であれば" },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor="priority">優先度</Label>
      <Select value={value} onValueChange={(value) => onChange(value as Priority)}>
        <SelectTrigger>
          <SelectValue placeholder="優先度を選択" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 