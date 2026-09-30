import Editor from '@monaco-editor/react';

function CodeEditor({ value, onChange, language = 'javascript' }) {
  return (
    <div className="editor-shell">
      <Editor
        height="320px"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={(nextValue) => onChange(nextValue || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}

export default CodeEditor;
