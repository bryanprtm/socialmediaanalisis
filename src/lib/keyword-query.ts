// Boolean expression evaluator supporting IF, AND, OR, NOT, parentheses and quoted phrases.
// Examples:
//   jakarta AND (banjir OR macet) NOT politik
//   IF "kapolri" AND korupsi
//   pemilu OR pilkada NOT hoaks

export type Token = string;

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const re = /\s*(\(|\)|"[^"]+"|[^\s()]+)\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) tokens.push(m[1]);
  return tokens;
}

const KEYWORDS = new Set(["AND", "OR", "NOT", "IF"]);

export function extractTerms(expr: string): string[] {
  return Array.from(
    new Set(
      tokenize(expr)
        .filter((t) => t !== "(" && t !== ")" && !KEYWORDS.has(t.toUpperCase()))
        .map((t) => (t.startsWith('"') ? t.slice(1, -1) : t))
        .map((t) => t.toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function validateExpression(expr: string): { ok: boolean; error?: string } {
  if (!expr.trim()) return { ok: false, error: "Ekspresi kosong" };
  const tokens = tokenize(expr);
  if (tokens.length === 0) return { ok: false, error: "Tidak ada token" };
  // Quick paren balance
  let depth = 0;
  for (const t of tokens) {
    if (t === "(") depth++;
    else if (t === ")") depth--;
    if (depth < 0) return { ok: false, error: "Tanda kurung tidak seimbang" };
  }
  if (depth !== 0) return { ok: false, error: "Tanda kurung tidak seimbang" };
  try {
    evalExpression(expr, "");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function evalExpression(expr: string, text: string): boolean {
  const haystack = text.toLowerCase();
  const tokens = tokenize(expr);
  if (tokens[0]?.toUpperCase() === "IF") tokens.shift();
  if (tokens.length === 0) return true;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseOr(): boolean {
    let left = parseAnd();
    while (peek()?.toUpperCase() === "OR") {
      consume();
      const r = parseAnd();
      left = left || r;
    }
    return left;
  }
  function parseAnd(): boolean {
    let left = parseNot();
    while (peek() && peek()?.toUpperCase() !== "OR" && peek() !== ")") {
      const next = peek()!.toUpperCase();
      if (next === "AND") consume();
      // implicit AND if next token is not a binary operator
      const r = parseNot();
      left = left && r;
    }
    return left;
  }
  function parseNot(): boolean {
    if (peek()?.toUpperCase() === "NOT") {
      consume();
      return !parseNot();
    }
    return parseAtom();
  }
  function parseAtom(): boolean {
    const t = consume();
    if (!t) return false;
    if (t === "(") {
      const v = parseOr();
      if (peek() === ")") consume();
      return v;
    }
    const term = t.startsWith('"') ? t.slice(1, -1) : t;
    if (!term) return false;
    return haystack.includes(term.toLowerCase());
  }

  return parseOr();
}
