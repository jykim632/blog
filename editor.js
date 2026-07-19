import { Editor } from 'https://esm.sh/@tiptap/core@3';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@3';

const draftKey = 'yeobaek-tiptap-draft-v1';
const inputs = { category: document.querySelector('#category'), readTime: document.querySelector('#read-time'), title: document.querySelector('#post-title'), summary: document.querySelector('#post-summary') };
const status = document.querySelector('.editor-status');
const preview = document.querySelector('#editor-preview');
const toggle = document.querySelector('#preview-toggle');
const count = document.querySelector('#word-count');
const toolbar = document.querySelector('.editor-toolbar');
const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const saved = localStorage.getItem(draftKey);
let draft = {};
try { draft = saved ? JSON.parse(saved) : {}; } catch { localStorage.removeItem(draftKey); }
Object.entries(inputs).forEach(([key, input]) => { if (draft[key]) input.value = draft[key]; });

// Keep the local draft in the same shape the future post API expects.
// `body` is the legacy HTML-only format and is read once for a non-breaking upgrade.
const initialContent = draft.contentJson || draft.body || '<p></p>';

const editor = new Editor({
  element: document.querySelector('#post-body'), extensions: [StarterKit], content: initialContent,
  editorProps: { attributes: { class: 'tiptap', 'aria-label': '본문' } },
  onUpdate: () => { render(); save(true); }, onSelectionUpdate: updateToolbar,
});
function data() {
  return {
    ...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])),
    contentJson: editor.getJSON(),
    contentText: editor.getText().trim(),
  };
}
function render() {
  const value = data();
  document.querySelector('#preview-category').textContent = `${value.category} · ${value.readTime || 1} MIN READ`;
  document.querySelector('#preview-title').textContent = value.title || '제목을 적어주세요';
  document.querySelector('#preview-summary').textContent = value.summary || '이 글을 읽기 전에 알면 좋은 한 문장을 적어보세요.';
  const html = editor.getHTML();
  document.querySelector('#preview-body').innerHTML = html === '<p></p>' ? '<p>본문을 작성하면 여기에서 읽기 화면을 미리 볼 수 있습니다.</p>' : html;
  count.textContent = `${value.contentText.length.toLocaleString('ko-KR')}자`;
}
function save(silent = false) { localStorage.setItem(draftKey, JSON.stringify(data())); status.textContent = silent ? '자동 저장됨' : '임시 저장됨'; window.setTimeout(() => { status.textContent = '새 글'; }, 1600); }
function updateToolbar() {
  toolbar.querySelectorAll('[data-command]').forEach((button) => {
    const command = button.dataset.command;
    const active = (command === 'heading' && editor.isActive('heading', { level: 2 })) || (command !== 'heading' && command !== 'undo' && command !== 'redo' && editor.isActive(command));
    button.classList.toggle('is-active', active);
  });
}
function runCommand(command) {
  const chain = editor.chain().focus();
  const commands = { bold: () => chain.toggleBold().run(), italic: () => chain.toggleItalic().run(), heading: () => chain.toggleHeading({ level: 2 }).run(), bulletList: () => chain.toggleBulletList().run(), blockquote: () => chain.toggleBlockquote().run(), undo: () => chain.undo().run(), redo: () => chain.redo().run() };
  commands[command]?.(); updateToolbar();
}
function exportHtml() {
  const value = data();
  const article = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(value.title || '새 글')}</title><style>body{max-width:720px;margin:64px auto;padding:0 24px;font:18px/1.9 system-ui,sans-serif;color:#182226}h1{font-size:44px;line-height:1.2;letter-spacing:-.05em}h2{margin-top:64px}blockquote{margin:40px 0;padding:24px;border-left:3px solid #809d31;background:#f4f4ee}.meta{font:12px monospace;color:#657175}.summary{font-size:21px;color:#4e595d}</style><p class="meta">${escapeHtml(value.category)} · ${escapeHtml(value.readTime)} MIN READ</p><h1>${escapeHtml(value.title)}</h1><p class="summary">${escapeHtml(value.summary)}</p><main>${editor.getHTML()}</main></html>`;
  const url = URL.createObjectURL(new Blob([article], { type: 'text/html' })); const link = document.createElement('a');
  link.href = url; link.download = `${(value.title || 'draft').replace(/[\\/:*?"<>|]/g, '-')}.html`; link.click(); URL.revokeObjectURL(url); status.textContent = 'HTML 파일을 만들었습니다';
}
document.querySelector('#writing-date').textContent = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('-', '.');
Object.values(inputs).forEach((input) => input.addEventListener('input', () => { render(); save(true); }));
toolbar.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => runCommand(button.dataset.command)));
document.querySelector('#save-draft').addEventListener('click', () => save());
document.querySelector('#export-html').addEventListener('click', exportHtml);
toggle.addEventListener('click', () => { const active = preview.hidden; preview.hidden = !active; document.querySelector('#writer-form').hidden = active; toggle.textContent = active ? '계속 쓰기' : '미리보기'; if (active) render(); });
render(); updateToolbar();
