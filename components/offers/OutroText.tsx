import RichTextEditor from "@/components/ui/RichTextEditor";

type Props = {
  outroBody: string;
  onOutroBodyChange: (text: string) => void;
};

export default function OutroText({ outroBody, onOutroBodyChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium">Schlusstext</h2>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Vorlagen
        </button>
      </div>

      <RichTextEditor
        value={outroBody}
        onChange={onOutroBodyChange}
        rows={6}
      />
    </div>
  );
}
