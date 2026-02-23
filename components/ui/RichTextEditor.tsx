type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
}: Props) {
  const minHeight = rows * 24;

  function exec(command: string) {
    // execCommand is deprecated but still the most compatible way to implement
    // simple rich-text controls without additional dependencies.
    document.execCommand(command);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className="p-1 text-sm text-zinc-600 hover:bg-zinc-100 rounded"
          title="Fett"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          className="p-1 text-sm italic text-zinc-600 hover:bg-zinc-100 rounded"
          title="Kursiv"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("underline");
          }}
          className="p-1 text-sm underline text-zinc-600 hover:bg-zinc-100 rounded"
          title="Unterstrichen"
        >
          U
        </button>
        <span className="w-px h-4 bg-zinc-200" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          className="p-1 text-sm text-zinc-600 hover:bg-zinc-100 rounded"
          title="Liste"
        >
          •
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
          className="p-1 text-sm text-zinc-600 hover:bg-zinc-100 rounded"
          title="Nummerierte Liste"
        >
          1.
        </button>
      </div>

      <div
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
}
