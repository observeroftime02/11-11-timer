import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit3,
  Shuffle,
  Calendar,
  Clock,
  Pin,
  Check,
  Copy,
  X,
  Heart,
  Smile,
  Feather,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hash,
  FileText,
} from 'lucide-react';
import { JournalEntry, TrackerMode } from '../types';
import {
  MINDFULNESS_PROMPTS,
  MOOD_PRESETS_1111,
  MOOD_PRESETS_420,
  ALL_MOOD_PRESETS,
  getRandomPrompt,
} from '../data/mindfulnessPrompts';

interface MindfulnessJournalViewProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onBack: () => void;
  activeMode: TrackerMode;
  initialNewEntry?: boolean;
}

export const MindfulnessJournalView: React.FC<MindfulnessJournalViewProps> = ({
  entries,
  onSaveEntry,
  onDeleteEntry,
  onBack,
  activeMode,
  initialNewEntry = false,
}) => {
  const is420 = activeMode === '420';

  // Screen View Mode: 'list' (gallery of reflections) or 'editor' (dedicated spacious writing screen)
  const [viewMode, setViewMode] = useState<'list' | 'editor'>(
    initialNewEntry ? 'editor' : 'list'
  );

  // Search & Filter State in list view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('All');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'all' | '1111' | '420'>('all');

  // Active Inspiration Prompt for the header banner in list view
  const [currentInspirationPrompt, setCurrentInspirationPrompt] = useState(() =>
    getRandomPrompt(activeMode)
  );

  // Editor State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorSelectedTags, setEditorSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [editorModeContext, setEditorModeContext] = useState<TrackerMode>(activeMode);
  const [editorPromptUsed, setEditorPromptUsed] = useState<string>('');
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [editorRandomPrompt, setEditorRandomPrompt] = useState(() =>
    getRandomPrompt(activeMode).text
  );
  const [isPromptExpanded, setIsPromptExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle shuffling inspiration prompt in list view
  const handleShuffleInspiration = () => {
    let next = getRandomPrompt(activeMode);
    while (next.id === currentInspirationPrompt.id && MINDFULNESS_PROMPTS.length > 1) {
      next = getRandomPrompt(activeMode);
    }
    setCurrentInspirationPrompt(next);
  };

  // Open dedicated editor for a brand new entry
  const handleOpenNewEntry = (prefilledPrompt?: string) => {
    const promptToUse = prefilledPrompt || getRandomPrompt(activeMode).text;
    const defaultTag = is420 ? 'Relaxed' : 'Grateful';
    setEditingEntryId(null);
    setEditorTitle('');
    setEditorContent(prefilledPrompt ? `Prompt reflection: ${promptToUse}\n\n` : '');
    setEditorSelectedTags([defaultTag]);
    setCustomTagInput('');
    setEditorModeContext(activeMode);
    setEditorPromptUsed(prefilledPrompt ? promptToUse : '');
    setEditorRandomPrompt(promptToUse);
    setEditorIsPinned(false);
    setIsPromptExpanded(true);
    setViewMode('editor');
  };

  // Open dedicated editor to edit an existing entry
  const handleOpenEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditorTitle(entry.title);
    setEditorContent(entry.content);
    // Combine existing tags or fallback to mood
    const existingTags = entry.tags && entry.tags.length > 0 ? entry.tags : [entry.mood || (is420 ? 'Relaxed' : 'Grateful')];
    setEditorSelectedTags(existingTags);
    setCustomTagInput('');
    setEditorModeContext(entry.modeContext || activeMode);
    setEditorPromptUsed(entry.promptUsed || '');
    setEditorRandomPrompt(entry.promptUsed || getRandomPrompt(entry.modeContext).text);
    setEditorIsPinned(Boolean(entry.isPinned));
    setIsPromptExpanded(Boolean(entry.promptUsed));
    setViewMode('editor');
  };

  // Toggle a mood / vibe tag in the editor
  const handleToggleTag = (tag: string) => {
    setEditorSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      } else {
        return [...prev, tag];
      }
    });
  };

  // Remove a specific tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditorSelectedTags((prev) =>
      prev.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase())
    );
  };

  // Add custom tags (supports comma separation)
  const handleAddCustomTag = () => {
    const raw = customTagInput.trim();
    if (!raw) return;

    // Split by comma in case user typed multiple tags
    const newTags = raw
      .split(',')
      .map((t) => t.trim().replace(/^#+/, ''))
      .filter((t) => t.length > 0);

    if (newTags.length > 0) {
      setEditorSelectedTags((prev) => {
        const next = [...prev];
        newTags.forEach((tag) => {
          if (!next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
            next.push(tag);
          }
        });
        return next;
      });
      setCustomTagInput('');
    }
  };

  // Save current entry and return to list view
  const handleSaveCurrentEntry = () => {
    // If user has unsubmitted text in customTagInput, include it
    let finalTags = [...editorSelectedTags];
    const rawCustom = customTagInput.trim().replace(/^#+/, '');
    if (rawCustom && !finalTags.some((t) => t.toLowerCase() === rawCustom.toLowerCase())) {
      finalTags.push(rawCustom);
    }

    if (finalTags.length === 0) {
      finalTags = [editorModeContext === '420' ? 'Relaxed' : 'Grateful'];
    }

    const primaryMood = finalTags[0] || (editorModeContext === '420' ? 'Relaxed' : 'Grateful');

    const newOrUpdated: JournalEntry = {
      id: editingEntryId || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: editorTitle.trim() || 'Untitled Reflection',
      content: editorContent.trim(),
      mood: primaryMood,
      tags: finalTags,
      createdAt: editingEntryId
        ? entries.find((e) => e.id === editingEntryId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
      modeContext: editorModeContext,
      promptUsed: editorPromptUsed || undefined,
      isPinned: editorIsPinned,
    };

    onSaveEntry(newOrUpdated);
    setViewMode('list');
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'editor' && (e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCurrentEntry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, editorTitle, editorContent, editorSelectedTags, customTagInput, editorModeContext, editorPromptUsed, editorIsPinned, editingEntryId]);

  const handleCopyEntryText = (entry: JournalEntry) => {
    const tagsStr = entry.tags?.length ? `\nTags: ${entry.tags.map((t) => `#${t}`).join(' ')}` : '';
    const text = `${entry.title}\n${new Date(entry.createdAt).toLocaleString()}\nMood: ${entry.mood}${tagsStr}\n\n${entry.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted Entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Mode filter
        if (selectedModeFilter !== 'all' && entry.modeContext !== selectedModeFilter) {
          return false;
        }

        // Mood / tag filter
        if (selectedMoodFilter !== 'All') {
          const filterLower = selectedMoodFilter.toLowerCase();
          const hasMood = entry.mood?.toLowerCase() === filterLower;
          const hasTag = entry.tags?.some((t) => t.toLowerCase() === filterLower);
          if (!hasMood && !hasTag) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = entry.title?.toLowerCase().includes(q);
          const matchesContent = entry.content?.toLowerCase().includes(q);
          const matchesMood = entry.mood?.toLowerCase().includes(q);
          const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          return matchesTitle || matchesContent || matchesMood || matchesTags;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned first, then newest
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [entries, searchQuery, selectedMoodFilter, selectedModeFilter]);

  // Aggregate all unique tags used across existing entries + presets for the filter pills
  const availableFilterMoods = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => {
      if (e.mood) tagSet.add(e.mood);
      e.tags?.forEach((t) => tagSet.add(t));
    });
    // Add default presets
    (is420 ? MOOD_PRESETS_420 : MOOD_PRESETS_1111).forEach((m) => tagSet.add(m));
    return ['All', ...Array.from(tagSet)];
  }, [entries, is420]);

  const activeMoodPresets = editorModeContext === '420' ? MOOD_PRESETS_420 : MOOD_PRESETS_1111;

  // Live writing metrics
  const wordCount = useMemo(() => {
    const trimmed = editorContent.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [editorContent]);

  const estimatedReadingTime = useMemo(() => {
    if (wordCount === 0) return '0 min';
    const minutes = Math.ceil(wordCount / 200);
    return `~${minutes} min read`;
  }, [wordCount]);

  // ==========================================
  // VIEW 1: FULL SCREEN DEDICATED WRITING CANVAS
  // ==========================================
  if (viewMode === 'editor') {
    const isEditor420 = editorModeContext === '420';

    return (
      <div
        className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col ${
          isEditor420
            ? 'selection:bg-emerald-500/30 selection:text-emerald-200'
            : 'selection:bg-amber-500/30 selection:text-amber-200'
        }`}
      >
        {/* Dedicated Editor Navigation Top Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/90 border-b border-neutral-800/90 px-4 lg:px-8 py-3.5 transition-colors">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            {/* Left Back / Cancel button */}
            <div className="flex items-center gap-3">
              <button
                id="btn-editor-back-to-list"
                onClick={() => setViewMode('list')}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-semibold"
                title="Return to Journal List"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Journal Gallery</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
                <span className="text-neutral-700">/</span>
                <span className="font-medium">
                  {editingEntryId ? 'Edit Reflection' : 'New Reflection'}
                </span>
              </div>
            </div>

            {/* Center Mode Switcher */}
            <div className="inline-flex rounded-xl bg-neutral-900 p-1 border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setEditorModeContext('1111')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  editorModeContext === '1111'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ✨ 11:11 Wish
              </button>
              <button
                type="button"
                onClick={() => setEditorModeContext('420')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  editorModeContext === '420'
                    ? 'bg-emerald-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🌿 4:20 Vibe
              </button>
            </div>

            {/* Right Quick Actions & Save Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorIsPinned(!editorIsPinned)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  editorIsPinned
                    ? isEditor420
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
                title={editorIsPinned ? 'Pinned to top' : 'Pin reflection'}
              >
                <Pin className={`w-4 h-4 ${editorIsPinned ? 'fill-current' : ''}`} />
              </button>

              <button
                id="btn-editor-save-entry"
                onClick={handleSaveCurrentEntry}
                className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer text-neutral-950 ${
                  isEditor420
                    ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
                    : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                <span>{editingEntryId ? 'Save Changes' : 'Save Reflection'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Spacious Writing Canvas */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8 space-y-6 flex flex-col">
          {/* Inspiration Prompt Collapsible Bar */}
          <div
            className={`rounded-2xl border transition-all overflow-hidden ${
              isEditor420
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles
                  className={`w-4 h-4 ${isEditor420 ? 'text-emerald-400' : 'text-amber-400'}`}
                />
                <span className={isEditor420 ? 'text-emerald-300' : 'text-amber-300'}>
                  Mindfulness Prompt Inspiration
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorRandomPrompt(getRandomPrompt(editorModeContext).text)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Shuffle prompt"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  title={isPromptExpanded ? 'Minimize prompt' : 'Expand prompt'}
                >
                  {isPromptExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isPromptExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-neutral-800/50 space-y-2">
                <p className="text-sm sm:text-base text-neutral-100 font-display italic leading-relaxed">
                  "{editorRandomPrompt}"
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditorPromptUsed(editorRandomPrompt);
                      const prefix = `Prompt reflection: "${editorRandomPrompt}"\n\n`;
                      if (!editorContent.includes(editorRandomPrompt)) {
                        setEditorContent((prev) => prefix + prev);
                      }
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className={`text-xs font-semibold underline cursor-pointer ${
                      isEditor420
                        ? 'text-emerald-400 hover:text-emerald-300'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    + Insert prompt into text body
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title Box */}
          <div className="space-y-1">
            <input
              type="text"
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              placeholder="Title your moment (e.g. Afternoon Stillness, Releasing Expectations...)"
              className={`w-full px-5 py-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-white font-display font-bold text-lg sm:text-2xl placeholder:text-neutral-600 focus:outline-none transition-colors ${
                isEditor420
                  ? 'focus:border-emerald-500/70'
                  : 'focus:border-amber-500/70'
              }`}
              autoFocus
            />
          </div>

          {/* Vibes & Mood Tags Palette (Multi-select + Custom vibes) */}
          <div className="rounded-2xl bg-neutral-900/60 p-4 md:p-5 border border-neutral-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag
                  className={`w-4 h-4 ${isEditor420 ? 'text-emerald-400' : 'text-amber-400'}`}
                />
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Moods & Vibe Tags
                </h4>
                <span className="text-[11px] text-neutral-400">
                  (Select multiple or type custom vibes)
                </span>
              </div>

              {editorSelectedTags.length > 0 && (
                <div className="text-[11px] text-neutral-400">
                  <strong className="text-neutral-200">{editorSelectedTags.length}</strong> active{' '}
                  {editorSelectedTags.length === 1 ? 'vibe' : 'vibes'}
                </div>
              )}
            </div>

            {/* Active Selected Tags Display */}
            {editorSelectedTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mr-1">
                  Selected:
                </span>
                {editorSelectedTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      isEditor420
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="p-0.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                      title={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Clickable Preset Mood/Vibe Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-neutral-400 font-medium">Quick Preset Vibes:</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeMoodPresets.map((preset) => {
                  const isSelected = editorSelectedTags.some(
                    (t) => t.toLowerCase() === preset.toLowerCase()
                  );
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleToggleTag(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? isEditor420
                            ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md font-bold'
                            : 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Hash className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Type custom feeling, intention, or tag and press Enter (e.g. Mountain Hike, Morning Coffee)..."
                  className={`w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                    isEditor420
                      ? 'focus:border-emerald-500/60'
                      : 'focus:border-amber-500/60'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isEditor420
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                }`}
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Large Expansive Editor Text Canvas */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Feather
                  className={`w-3.5 h-3.5 ${
                    isEditor420 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span>Your Mindfulness Sanctuary Canvas</span>
              </label>

              <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{editorContent.length} chars</span>
                <span>•</span>
                <span className="text-neutral-500">{estimatedReadingTime}</span>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Let your thoughts flow freely without rush or judgment. Write your affirmations, insights, gratitude, or whatever is alive in your mind right now..."
                className={`w-full flex-1 min-h-[380px] sm:min-h-[460px] md:min-h-[520px] p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 text-neutral-100 text-base sm:text-lg placeholder:text-neutral-600 focus:outline-none transition-colors leading-relaxed resize-y font-sans shadow-inner ${
                  isEditor420
                    ? 'focus:border-emerald-500/60'
                    : 'focus:border-amber-500/60'
                }`}
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800/80">
            <div className="text-xs text-neutral-500 flex items-center gap-2">
              <span>Shortcuts: Press</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px]">
                Ctrl + S
              </kbd>
              <span>or</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px]">
                Cmd + S
              </kbd>
              <span>to save instantly</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white text-xs sm:text-sm font-semibold border border-neutral-800 cursor-pointer transition-colors"
              >
                Cancel / Return
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentEntry}
                className={`px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-transform active:scale-95 cursor-pointer text-neutral-950 ${
                  isEditor420
                    ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
                    : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
                }`}
              >
                {editingEntryId ? 'Save Changes' : 'Save Reflection'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: JOURNAL GALLERY & TIMELINE VIEW
  // ==========================================
  return (
    <div
      className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col ${
        is420
          ? 'selection:bg-emerald-500/30 selection:text-emerald-200'
          : 'selection:bg-amber-500/30 selection:text-amber-200'
      }`}
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-neutral-950/85 border-b border-neutral-800/80 px-4 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="btn-journal-back-dashboard"
              onClick={onBack}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to World Clock Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Clock</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md ${
                  is420
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <span>{is420 ? '🌿 Vibe Mindfulness Journal' : '✨ Wish Mindfulness Journal'}</span>
                </h1>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  Unified space for intentions, reflections, and mindful moments
                </p>
              </div>
            </div>
          </div>

          <button
            id="btn-journal-new-entry-header"
            onClick={() => handleOpenNewEntry()}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer text-neutral-950 ${
              is420
                ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
                : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
            }`}
          >
            <Plus className="w-4 h-4 text-neutral-950" />
            <span>New Reflection</span>
          </button>
        </div>
      </header>

      {/* Main Journal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Dynamic Mindfulness Inspiration Banner */}
        <section
          className={`rounded-3xl p-5 md:p-6 backdrop-blur-md border relative overflow-hidden transition-all shadow-xl ${
            is420
              ? 'bg-gradient-to-r from-neutral-900/90 via-emerald-950/20 to-neutral-900/90 border-emerald-500/25'
              : 'bg-gradient-to-r from-neutral-900/90 via-amber-950/20 to-neutral-900/90 border-amber-500/25'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    is420
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Mindfulness Prompt
                </span>
                <span className="text-xs text-neutral-500">• {currentInspirationPrompt.category}</span>
              </div>
              <p className="font-display font-medium text-base sm:text-lg md:text-xl text-neutral-100 italic pt-1 leading-snug">
                "{currentInspirationPrompt.text}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-journal-shuffle-prompt"
                onClick={handleShuffleInspiration}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Get another random mindfulness prompt"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New Prompt</span>
              </button>

              <button
                id="btn-journal-write-with-prompt"
                onClick={() => handleOpenNewEntry(currentInspirationPrompt.text)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  is420
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Write with this</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections by title, thoughts, mood, or tags..."
              className={`w-full pl-9 pr-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-neutral-100 text-xs sm:text-sm placeholder:text-neutral-500 focus:outline-none transition-colors ${
                is420 ? 'focus:border-emerald-500/60' : 'focus:border-amber-500/60'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Filter Selector */}
            <div className="inline-flex rounded-xl bg-neutral-900 p-1 border border-neutral-800 text-xs">
              <button
                onClick={() => setSelectedModeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedModeFilter === 'all'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({entries.length})
              </button>
              <button
                onClick={() => setSelectedModeFilter('1111')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedModeFilter === '1111'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ✨ 11:11
              </button>
              <button
                onClick={() => setSelectedModeFilter('420')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedModeFilter === '420'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🌿 4:20
              </button>
            </div>
          </div>
        </div>

        {/* Mood & Tag Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter Tags:</span>
          </span>
          {availableFilterMoods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMoodFilter(mood)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedMoodFilter === mood
                  ? is420
                    ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400'
                    : 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {mood === 'All' ? 'All Tags' : `#${mood}`}
            </button>
          ))}
        </div>

        {/* Entries List / Grid */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-12 text-center space-y-4 max-w-lg mx-auto my-8">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-inner ${
                is420
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {is420 ? '🌿' : '✨'}
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">
                {searchQuery || selectedMoodFilter !== 'All'
                  ? 'No matching reflections found'
                  : 'Your Mindfulness Sanctuary Awaits'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {searchQuery || selectedMoodFilter !== 'All'
                  ? 'Try adjusting your search terms or filter selection to find your entries.'
                  : 'Begin by writing down your first intention, gratitude reflection, or mindful thought in our dedicated editor.'}
              </p>
            </div>
            <button
              id="btn-journal-empty-create"
              onClick={() => handleOpenNewEntry()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer text-neutral-950 transition-transform active:scale-95 ${
                is420
                  ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
                  : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Write First Reflection</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => {
              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const isEntry420 = entry.modeContext === '420';
              const displayTags = entry.tags && entry.tags.length > 0 ? entry.tags : [entry.mood];

              return (
                <div
                  key={entry.id}
                  onClick={() => handleOpenEditEntry(entry)}
                  className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:shadow-xl ${
                    entry.isPinned
                      ? is420
                        ? 'bg-neutral-900/90 border-emerald-500/40 shadow-emerald-950/20'
                        : 'bg-neutral-900/90 border-amber-500/40 shadow-amber-950/20'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  {/* Card Top Details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                            isEntry420
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                              : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          {isEntry420 ? '🌿 4:20' : '✨ 11:11'}
                        </span>

                        {entry.isPinned && (
                          <span
                            className={`p-1 rounded-md text-[10px] ${
                              is420 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                            title="Pinned Reflection"
                          >
                            <Pin className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-500 font-mono">
                        {dateStr}
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base text-white group-hover:text-neutral-100 transition-colors leading-snug line-clamp-1">
                      {entry.title || 'Untitled Reflection'}
                    </h3>

                    {entry.promptUsed && (
                      <div className="text-[11px] text-neutral-400 italic bg-neutral-950/50 px-2.5 py-1.5 rounded-lg border border-neutral-850 line-clamp-1">
                        Prompt: "{entry.promptUsed}"
                      </div>
                    )}

                    <p className="text-xs text-neutral-300/90 line-clamp-4 leading-relaxed font-sans whitespace-pre-line">
                      {entry.content || '(No additional text)'}
                    </p>
                  </div>

                  {/* Card Bottom / Tags & Quick Actions */}
                  <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 gap-2">
                    <div className="flex items-center gap-1 overflow-hidden truncate flex-wrap">
                      {displayTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-300 text-[10px] font-medium border border-neutral-850 truncate max-w-[90px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {displayTags.length > 3 && (
                        <span className="text-[10px] text-neutral-500 font-medium">
                          +{displayTags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyEntryText(entry);
                        }}
                        className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy reflection"
                      >
                        {copiedId === entry.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        className="p-1 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">Delete this reflection?</h3>
              <p className="text-xs text-neutral-400">
                This action will remove the reflection from your journal permanently.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Keep it
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
