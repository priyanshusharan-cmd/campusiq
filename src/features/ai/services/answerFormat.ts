/** A deliberately small, native-safe Markdown subset. HTML remains plain text. */
export type AnswerBlock =
  | { kind: 'paragraph' | 'heading' | 'quote' | 'code'; text: string }
  | { kind: 'list'; text: string; marker: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export function tableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  return trimmed.split(/(?<!\\)\|(?=(?:[^`]*`[^`]*`)*[^`]*$)/).map(cell => cell.trim().replace(/\\\|/g, '|'));
}
const divider = (line: string) => line.includes('|') && tableCells(line).every(cell => /^:?-{3,}:?$/.test(cell));

export function parseAnswer(source: string): AnswerBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: AnswerBlock[] = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (/^```/.test(line)) {
      const code: string[] = [];
      for (i++; i < lines.length && !/^```/.test(lines[i].trim()); i++) code.push(lines[i]);
      blocks.push({ kind: 'code', text: code.join('\n') }); i++; continue;
    }
    if (line.includes('|') && i + 1 < lines.length && divider(lines[i + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) {
        const cells = tableCells(lines[i]);
        // Retain unexpected extra cells instead of silently dropping model output.
        while (headers.length < cells.length) headers.push('');
        rows.push(cells);
      }
      blocks.push({ kind: 'table', headers, rows }); continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/);
    const list = line.match(/^([-+*]|\d+[.)])\s+(.+)$/);
    if (heading) blocks.push({ kind: 'heading', text: heading[1] });
    else if (list) blocks.push({ kind: 'list', marker: /^\d/.test(list[1]) ? list[1] : '•', text: list[2] });
    else if (line.startsWith('> ')) blocks.push({ kind: 'quote', text: line.slice(2) });
    else {
      const previous = blocks[blocks.length - 1];
      if (previous?.kind === 'paragraph' && i > 0 && lines[i - 1].trim()) previous.text += `\n${line}`;
      else blocks.push({ kind: 'paragraph', text: line });
    }
    i++;
  }
  return blocks;
}

export function inlineParts(text: string): { text: string; style: 'plain' | 'bold' | 'italic' | 'code' }[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*)/g).filter(Boolean).map(part => {
    if (part.startsWith('**') || part.startsWith('__')) return { text: part.slice(2, -2), style: 'bold' };
    if (part.startsWith('`')) return { text: part.slice(1, -1), style: 'code' };
    if (part.startsWith('*')) return { text: part.slice(1, -1), style: 'italic' };
    return { text: part, style: 'plain' };
  });
}
