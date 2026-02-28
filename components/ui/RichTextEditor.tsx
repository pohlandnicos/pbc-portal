import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  fontSize?: "sm" | "base";
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  fontSize = "sm",
}: Props) {
  const minHeight = rows * 24;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastHtmlRef = useRef<string>("");
  const selectionRef = useRef<Range | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const next = value || "";
    
    // Always set value on first render, even if it matches lastHtmlRef
    if (isFirstRenderRef.current) {
      el.innerHTML = next;
      lastHtmlRef.current = next;
      isFirstRenderRef.current = false;
      return;
    }
    
    if (next === lastHtmlRef.current) return;

    // Only sync DOM when the value changes from the outside.
    // This prevents selection/caret jumps while typing (esp. on Enter).
    el.innerHTML = next;
    lastHtmlRef.current = next;
  }, [value]);

  function saveSelection() {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return;
    selectionRef.current = range.cloneRange();
  }

  function restoreSelection() {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel) return;

    sel.removeAllRanges();

    if (selectionRef.current) {
      sel.addRange(selectionRef.current);
      return;
    }

    // If we don't have a saved selection yet, place caret at end.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.addRange(range);
  }

  function exec(command: string) {
    // execCommand is deprecated but still the most compatible way to implement
    // simple rich-text controls without additional dependencies.
    document.execCommand(command);
  }

  function syncFromDom() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtmlRef.current = html;
    onChange(html);
  }

  function insertListFallback(listType: "ul" | "ol") {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel) return;

    let range: Range | null = null;
    if (sel.rangeCount > 0) range = sel.getRangeAt(0);
    if (!range || !el.contains(range.startContainer) || !el.contains(range.endContainer)) {
      // put caret at end if selection isn't inside editor
      const endRange = document.createRange();
      endRange.selectNodeContents(el);
      endRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(endRange);
      range = endRange;
    }

    const listEl = document.createElement(listType);
    const li = document.createElement("li");
    li.appendChild(document.createElement("br"));
    listEl.appendChild(li);

    try {
      range.deleteContents();
      range.insertNode(listEl);
    } catch {
      el.appendChild(listEl);
    }

    // Move caret into the new list item
    const caretRange = document.createRange();
    caretRange.selectNodeContents(li);
    caretRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caretRange);
    selectionRef.current = caretRange.cloneRange();

    syncFromDom();
  }

  function execInEditor(command: string) {
    const el = editorRef.current;
    if (!el) return;

    el.focus();
    restoreSelection();

    const before = el.innerHTML;
    exec(command);
    const after = el.innerHTML;

    if (
      before === after &&
      (command === "insertUnorderedList" || command === "insertOrderedList")
    ) {
      insertListFallback(command === "insertUnorderedList" ? "ul" : "ol");
      return;
    }

    saveSelection();
    syncFromDom();
  }

  return (
    <div
      className="w-full rounded-lg border border-zinc-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
    >
      <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1.5 border-b border-zinc-200">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execInEditor("bold");
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-sm font-semibold text-zinc-600 hover:bg-white/70"
          title="Fett"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execInEditor("italic");
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-sm italic text-zinc-600 hover:bg-white/70"
          title="Kursiv"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execInEditor("underline");
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-sm underline text-zinc-600 hover:bg-white/70"
          title="Unterstrichen"
        >
          U
        </button>
        <span className="w-px h-4 bg-zinc-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execInEditor("insertUnorderedList");
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 hover:bg-white/70"
          title="Liste"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="7" r="1" />
            <circle cx="5" cy="12" r="1" />
            <circle cx="5" cy="17" r="1" />
            <path d="M9 7h12" />
            <path d="M9 12h12" />
            <path d="M9 17h12" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execInEditor("insertOrderedList");
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 hover:bg-white/70"
          title="Nummerierte Liste"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 7h11" />
            <path d="M10 12h11" />
            <path d="M10 17h11" />
            <path d="M3 8h2V5" />
            <path d="M5 8V5" />
            <path d="M3 13h2l-2 3h2" />
            <path d="M3 18h2" />
          </svg>
        </button>
      </div>

      <div
        contentEditable
        suppressContentEditableWarning
        ref={editorRef}
        onInput={(e) => {
          const html = (e.currentTarget as HTMLDivElement).innerHTML;
          lastHtmlRef.current = html;
          onChange(html);
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        className={`w-full px-3 py-2 ${fontSize === "base" ? "text-base" : "text-sm"} outline-none whitespace-pre-wrap [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1`}
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
