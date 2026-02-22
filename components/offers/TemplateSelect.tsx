"use client";

import { useState } from "react";
import { Popover } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";

interface Template {
  id: string;
  name: string;
  salutation?: string;
  body_html: string;
  is_default: boolean;
}

interface Props {
  type: "intro" | "outro";
  onSelect: (template: Template) => void;
}

export function TemplateSelect({ type, onSelect }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  // Templates laden beim Öffnen
  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/offer-templates");
      const json = await res.json();
      setTemplates(json.data.filter((t: Template) => t.type === type));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover className="relative">
      <Popover.Button className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md inline-flex items-center gap-1">
        Vorlagen
        <ChevronDownIcon className="w-4 h-4" />
      </Popover.Button>

      <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 rounded-xl border bg-white shadow-lg overflow-hidden">
        <div className="p-2">
          {loading ? (
            <div className="text-sm text-zinc-500 p-3">Laden...</div>
          ) : templates.length === 0 ? (
            <div className="text-sm text-zinc-500 p-3">
              Keine Vorlagen vorhanden
            </div>
          ) : (
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template)}
                  className="w-full text-left p-3 rounded-lg hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{template.name}</span>
                    {template.is_default && (
                      <span className="text-xs text-zinc-500">Standard</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500 line-clamp-2">
                    {template.body_html.replace(/<[^>]*>/g, "")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Popover.Panel>
    </Popover>
  );
}
