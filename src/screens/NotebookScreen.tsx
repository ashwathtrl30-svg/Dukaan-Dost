import React, { useRef, useState } from 'react';
import { ArrowLeft, Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { VoiceMicButton } from '../components/VoiceMicButton';
import { generateId, useStore } from '../store';
import { NotebookNote } from '../types';

type NotebookScreenProps = {
  onClose: () => void;
};

export function NotebookScreen({ onClose }: NotebookScreenProps) {
  const { state, dispatch } = useStore();
  const lang = state.language || 'en';
  const hindi = lang === 'hi';
  const notes = [...(state.notebookNotes || [])].sort((a, b) => b.updatedAt - a.updatedAt);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const voiceBaseContent = useRef('');

  const openNewNote = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setVoiceStatus('');
    voiceBaseContent.current = '';
    setEditorOpen(true);
  };

  const openExistingNote = (note: NotebookNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setVoiceStatus('');
    voiceBaseContent.current = note.content;
    setEditorOpen(true);
  };

  const saveNote = () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle && !cleanContent) {
      setVoiceStatus(hindi ? 'पहले कुछ लिखें या बोलें।' : 'Write or dictate something before saving.');
      return;
    }
    const firstLine = cleanContent.split(/\r?\n/).find(line => line.trim())?.trim() || '';
    const noteTitle = (cleanTitle || firstLine || (hindi ? 'दुकान की नोट' : 'Shop note')).slice(0, 80);
    const now = Date.now();
    if (editingId) {
      const existing = notes.find(note => note.id === editingId);
      const updated: NotebookNote = {
        id: editingId,
        title: noteTitle,
        content: cleanContent,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      dispatch({ type: 'UPDATE_NOTE', payload: updated });
    } else {
      dispatch({
        type: 'ADD_NOTE',
        payload: { id: generateId(), title: noteTitle, content: cleanContent, createdAt: now, updatedAt: now },
      });
    }
    setEditorOpen(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setVoiceStatus(hindi ? 'नोट सेव हो गई।' : 'Note saved.');
  };

  const deleteNote = (noteId: string) => {
    const confirmed = window.confirm(hindi ? 'क्या आप यह नोट हटाना चाहते हैं?' : 'Delete this note?');
    if (!confirmed) return;
    dispatch({ type: 'DELETE_NOTE', payload: noteId });
    if (editingId === noteId) {
      setEditorOpen(false);
      setEditingId(null);
    }
  };

  const cancelEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setVoiceStatus('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-in">
      <header className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
        <button
          type="button"
          onClick={editorOpen ? cancelEditor : onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-bg shrink-0"
          aria-label={hindi ? 'वापस जाएँ' : 'Go back'}
        >
          <ArrowLeft size={21} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text whitespace-nowrap">{hindi ? 'दुकान की नोटबुक' : 'Shop notebook'}</h1>
          <p className="text-[10px] sm:text-xs text-text-secondary whitespace-nowrap tracking-tight">
            {hindi ? 'याद रखने वाली बातें यहाँ सेव करें' : 'Keep shop reminders and notes in one place'}
          </p>
        </div>
        {!editorOpen && (
          <button
            type="button"
            onClick={openNewNote}
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center p-0 sm:h-auto sm:w-auto sm:px-4"
            aria-label={hindi ? 'नई नोट' : 'New note'}
            title={hindi ? 'नई नोट' : 'New note'}
          >
            <Plus size={18} /> <span className="hidden sm:inline">{hindi ? 'नई नोट' : 'New note'}</span>
          </button>
        )}
      </header>

      {editorOpen ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text mb-2" htmlFor="notebook-note-title">
              {hindi ? 'शीर्षक (ज़रूरी नहीं)' : 'Title (optional)'}
            </label>
            <input
              id="notebook-note-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              maxLength={80}
              placeholder={hindi ? 'जैसे: कल क्या खरीदना है' : 'e.g. Things to buy tomorrow'}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2" htmlFor="notebook-note-content">
              {hindi ? 'आपकी नोट' : 'Your note'}
            </label>
            <textarea
              id="notebook-note-content"
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={10}
              maxLength={12000}
              placeholder={hindi ? 'यहाँ कुछ भी लिखें… जैसे 50 पैकेट मैदा खरीदना है' : 'Write anything to remember… e.g. Buy 50 packets of maida'}
              className="input-field w-full resize-y min-h-[240px]"
            />
            <p className="text-xs text-text-secondary mt-1">
              {hindi ? 'वॉइस से बोली गई बात भी पहले टेक्स्ट में आएगी। सेव करने से पहले उसे जाँच लें।' : 'Voice dictation appears as editable text first. Review it before saving.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <VoiceMicButton
              language={lang}
              shape="rounded"
              label={isListening ? (hindi ? 'रिकॉर्डिंग रोकें' : 'Stop recording') : (hindi ? 'बोलकर लिखें' : 'Dictate a note')}
              onRecordingChange={recording => {
                setIsListening(recording);
                if (recording) voiceBaseContent.current = content.trim();
              }}
              onTranscript={transcript => {
                const base = voiceBaseContent.current;
                setContent([base, transcript.trim()].filter(Boolean).join('\n'));
              }}
              onStatus={setVoiceStatus}
            />
            <button
              type="button"
              onClick={saveNote}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              <Save size={18} /> {hindi ? 'नोट सेव करें' : 'Save note'}
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-card text-text-secondary"
              aria-label={hindi ? 'रद्द करें' : 'Cancel'}
            >
              <X size={20} />
            </button>
          </div>

          {voiceStatus && (
            <p className="text-sm text-text-secondary" role="status" aria-live="polite">{voiceStatus}</p>
          )}
          {isListening && (
            <p className="text-sm text-primary" role="status">{hindi ? 'बोलना पूरा होने पर माइक्रोफ़ोन रोकें, फिर टेक्स्ट जाँचें।' : 'When finished speaking, stop the microphone and review the text.'}</p>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {notes.length === 0 ? (
            <div className="max-w-sm mx-auto py-16 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-base font-semibold text-text">{hindi ? 'अभी कोई नोट नहीं है' : 'No notes yet'}</h2>
              <p className="text-sm text-text-secondary mt-2 mb-5">
                {hindi ? 'खरीदारी, सप्लायर या दुकान की कोई भी ज़रूरी बात यहाँ लिखें या बोलें।' : 'Write or dictate anything to remember about stock, suppliers, or your shop.'}
              </p>
              <button type="button" onClick={openNewNote} className="btn-primary inline-flex items-center gap-2">
                <Plus size={18} /> {hindi ? 'पहली नोट बनाएँ' : 'Create your first note'}
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex items-center justify-between pb-1">
                <p className="text-sm text-text-secondary">{hindi ? `${notes.length} सेव नोट` : `${notes.length} saved ${notes.length === 1 ? 'note' : 'notes'}`}</p>
                <button type="button" onClick={openNewNote} className="text-sm font-semibold text-primary flex items-center gap-1">
                  <Plus size={17} /> {hindi ? 'जोड़ें' : 'Add note'}
                </button>
              </div>
              {notes.map(note => (
                <article key={note.id} className="card">
                  <button type="button" onClick={() => openExistingNote(note)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-text break-words">{note.title}</h2>
                        <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap break-words line-clamp-5">{note.content}</p>
                        <p className="text-xs text-text-secondary mt-3">
                          {new Date(note.updatedAt).toLocaleString(hindi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <Edit2 size={18} className="text-primary flex-shrink-0 mt-1" />
                    </div>
                  </button>
                  <div className="flex justify-end mt-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="text-sm text-problem font-medium px-2 py-1 flex items-center gap-1"
                    >
                      <Trash2 size={15} /> {hindi ? 'हटाएँ' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      <footer className="border-t border-border bg-card px-4 py-2 text-xs text-text-secondary text-center">
        {hindi ? 'नोट्स इसी डिवाइस के सेव डेटा में रखे जाते हैं।' : 'Notes are saved with this app’s local data on this device.'}
      </footer>
    </div>
  );
}
