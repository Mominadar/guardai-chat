import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot } from "lucide-react";

export type AIModel = "gpt" | "gemini" | "claude";

interface ModelSelectorProps {
  value: AIModel;
  onChange: (value: AIModel) => void;
}

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Bot className="h-5 w-5 text-primary" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt">GPT-5 (OpenAI)</SelectItem>
          <SelectItem value="gemini">Gemini 2.5 (Google)</SelectItem>
          <SelectItem value="claude">Claude Sonnet (Anthropic)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
