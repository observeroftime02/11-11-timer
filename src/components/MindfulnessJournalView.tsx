import React, { useState, useMemo, useEffect } from 'react';
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

  // Navigation / Search / Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('All');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'all' | '1111' | '420'>('all');

  // Active Inspiration Prompt for the header banner
  const [currentInspirationPrompt, setCurrentInspirationPrompt] = useState(() =>
    getRandomPrompt(activeMode)
  );

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(initialNewEntry);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorMood, setEditorMood] = useState<string>(is420 ? 'Relaxed' : 'Grateful');
  const [customMoodInput, setCustomMoodInput] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorModeContext, setEditorModeContext] = useState<TrackerMode>(activeMode);
  const [editorPromptUsed, setEditorPromptUsed] = useState<string>('');
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [editorRandomPrompt, setEditorRandomPrompt] = useState(() =>
    getRandomPrompt(activeMode).text
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle shuffling inspiration prompt
  const handleShuffleInspiration = () => {
    let next = getRandomPrompt(activeMode);
    while (next.id === currentInspirationPrompt.id && MINDFULNESS_PROMPTS.length > 1) {
      next = getRandomPrompt(activeMode);
    }
    setCurrentInspirationPrompt(next);
  };

  // Open editor for a brand new entry
  const handleOpenNewEntry = (prefilledPrompt?: string) => {
    const promptToUse = prefilledPrompt || getRandomPrompt(activeMode).text;
    setEditingEntryId(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorMood(is420 ? 'Relaxed' : 'Grateful');
    setCustomMoodInput('');
    setEditorTags([is420 ? 'Relaxed' : 'Grateful']);
    setEditorModeContext(activeMode);
    setEditorPromptUsed(prefilledPrompt ? promptToUse : '');
    setEditorRandomPrompt(promptToUse);
    setEditorIsPinned(false);
    setIsEditorOpen(true);
  };

  // Open editor to edit an existing entry
  const handleOpenEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditorTitle(entry.title);
    setEditorContent(entry.content);
    setEditorMood(entry.mood);
    setCustomMoodInput('');
    setEditorTags(entry.tags || [entry.mood]);
    setEditorModeContext(entry.modeContext || activeMode);
    setEditorPromptUsed(entry.promptUsed || '');
    setEditorRandomPrompt(entry.promptUsed || getRandomPrompt(entry.modeContext).text);
    setEditorIsPinned(Boolean(entry.isPinned));
    setIsEditorOpen(true);
  };

  const handleSaveCurrentEntry = () => {
    const finalMood = customMoodInput.trim() || editorMood || (is420 ? 'Relaxed' : 'Grateful');
    const finalTags = Array.from(
      new Set([...editorTags, finalMood].filter(Boolean))
    );

    const newOrUpdated: JournalEntry = {
      id: editingEntryId || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: editorTitle.trim() || 'Untitled Reflection',
      content: editorContent.trim(),
      mood: finalMood,
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
    setIsEditorOpen(false);
  };

  const handleToggleTag = (tag: string) => {
    setEditorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomMood = () => {
    const trimmed = customMoodInput.trim();
    if (!trimmed) return;
    setEditorMood(trimmed);
    if (!editorTags.includes(trimmed)) {
      setEditorTags((prev) => [...prev, trimmed]);
    }
  };

  const handleCopyEntryText = (entry: JournalEntry) => {
    const text = `${entry.title}\n${new Date(entry.createdAt).toLocaleString()}\nMood: ${entry.mood}\n\n${entry.content}`;
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

        // Mood tag filter
        if (selectedMoodFilter !== 'All') {
          const hasMood = entry.mood.toLowerCase() === selectedMoodFilter.toLowerCase();
          const hasTag = entry.tags?.some(
            (t) => t.toLowerCase() === selectedMoodFilter.toLowerCase()
          );
          if (!hasMood && !hasTag) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = entry.title.toLowerCase().includes(q);
          const matchesContent = entry.content.toLowerCase().includes(q);
          const matchesMood = entry.mood.toLowerCase().includes(q);
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

  // Aggregate all unique tags used across existing entries + presets
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

  const activeMoodPresets = is420 ? MOOD_PRESETS_420 : MOOD_PRESETS_1111;

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
            <span>Moods:</span>
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
              {mood}
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
                  : 'Begin by writing down your first intention, gratitude reflection, or mindful thought.'}
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
              const timeStr = new Date(entry.createdAt).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });
              const isEntry420 = entry.modeContext === '420';

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
                  <div className="space-y-2">
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

                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-medium border border-neutral-700">
                          {entry.mood}
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
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 gap-2">
                    <div className="flex items-center gap-1 overflow-hidden truncate">
                      {entry.tags?.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 text-[10px] border border-neutral-850 truncate max-w-[90px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {(entry.tags?.length || 0) > 3 && (
                        <span className="text-[10px] text-neutral-500">
                          +{(entry.tags?.length || 0) - 3}
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
                        title="Copy to clipboard"
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

      {/* MODAL: Full Screen / Floating Entry Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 my-8 relative transition-all ${
              editorModeContext === '420'
                ? 'bg-neutral-900 border-emerald-500/30'
                : 'bg-neutral-900 border-amber-500/30'
            }`}
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    editorModeContext === '420'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">
                    {editingEntryId ? 'Edit Reflection' : 'New Mindfulness Reflection'}
                  </h3>
                  <div className="text-[11px] text-neutral-400">
                    Unified Mindful Journal • Auto-saved locally
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorIsPinned(!editorIsPinned)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    editorIsPinned
                      ? editorModeContext === '420'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  title={editorIsPinned ? 'Unpin reflection' : 'Pin reflection to top'}
                >
                  <Pin className={`w-4 h-4 ${editorIsPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
                  title="Close editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode context selector */}
            <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
              <span className="text-neutral-400 font-medium">Capture Mode Context:</span>
              <div className="inline-flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditorModeContext('1111')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    editorModeContext === '1111'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  ✨ 11:11 Wish Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEditorModeContext('420')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    editorModeContext === '420'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🌿 4:20 Vibe Mode
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Title / Focus of this moment:
              </label>
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="e.g. Afternoon Clarity, Grateful for Sunshine, Releasing Old Pressure..."
                className={`w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none transition-colors ${
                  editorModeContext === '420'
                    ? 'focus:border-emerald-500/70'
                    : 'focus:border-amber-500/70'
                }`}
                autoFocus
              />
            </div>

            {/* Mood & Vibe Picker Presets + Custom Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-300">
                  Select Mood / Vibe (Acts as tag):
                </label>
                <span className="text-[11px] text-neutral-500">
                  Current: <strong className="text-neutral-200">{editorMood}</strong>
                </span>
              </div>

              {/* Preset Mood Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeMoodPresets.map((preset) => {
                  const isSelected = editorMood.toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditorMood(preset);
                        if (!editorTags.includes(preset)) {
                          setEditorTags((prev) => [...prev, preset]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? editorModeContext === '420'
                            ? 'bg-emerald-400 text-neutral-950 border-emerald-400 shadow-sm'
                            : 'bg-amber-400 text-neutral-950 border-amber-400 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom Mood Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customMoodInput}
                  onChange={(e) => setCustomMoodInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomMood();
                    }
                  }}
                  placeholder="Or enter a custom feeling / vibe..."
                  className={`flex-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none ${
                    editorModeContext === '420'
                      ? 'focus:border-emerald-500/60'
                      : 'focus:border-amber-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomMood}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold border border-neutral-700 cursor-pointer"
                >
                  Set Feeling
                </button>
              </div>
            </div>

            {/* Prompt Inspiration Card for New Entry */}
            <div className="rounded-2xl bg-neutral-950/80 p-3.5 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      editorModeContext === '420' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                  <span>Mindfulness Prompt Inspiration:</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditorRandomPrompt(getRandomPrompt(editorModeContext).text)
                  }
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
                >
                  Shuffle prompt
                </button>
              </div>
              <p className="text-xs text-neutral-300 italic">"{editorRandomPrompt}"</p>
              {!editorContent && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorPromptUsed(editorRandomPrompt);
                    setEditorContent(`Prompt reflection: ${editorRandomPrompt}\n\n`);
                  }}
                  className="text-[10px] font-semibold text-neutral-400 hover:text-white underline cursor-pointer pt-0.5"
                >
                  + Insert prompt into text body
                </button>
              )}
            </div>

            {/* Reflection Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-300">
                  Your Reflection & Mindful Thoughts:
                </label>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {editorContent.length} chars •{' '}
                  {editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={`What's on your mind right now? (${editorRandomPrompt})`}
                rows={6}
                className={`w-full p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none transition-colors resize-y leading-relaxed ${
                  editorModeContext === '420'
                    ? 'focus:border-emerald-500/70'
                    : 'focus:border-amber-500/70'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold border border-neutral-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentEntry}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer text-neutral-950 ${
                  editorModeContext === '420'
                    ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
                    : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
                }`}
              >
                {editingEntryId ? 'Save Changes' : 'Save Reflection'}
              </button>
            </div>
          </div>
        </div>
      )}

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
