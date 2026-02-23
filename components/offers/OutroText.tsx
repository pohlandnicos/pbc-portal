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

      <div>
        <textarea
          value={outroBody}
          onChange={(e) => onOutroBodyChange(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
        />
      </div>
    </div>
  );
}
