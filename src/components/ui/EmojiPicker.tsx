import React, { useState, useMemo } from 'react';
import { Search, Smile, ThumbsUp, Sparkles, Heart } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: { emoji: string; name: string }[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    id: 'frequent',
    name: 'Quick Reactions',
    icon: <Sparkles className="w-4 h-4" />,
    emojis: [
      { emoji: '👍', name: '+1' },
      { emoji: '❤️', name: 'heart' },
      { emoji: '😂', name: 'joy' },
      { emoji: '🎉', name: 'tada' },
      { emoji: '🚀', name: 'rocket' },
      { emoji: '👀', name: 'eyes' },
      { emoji: '🔥', name: 'fire' },
      { emoji: '👏', name: 'clap' },
      { emoji: '💯', name: '100' },
      { emoji: '🙌', name: 'raised hands' },
      { emoji: '☕', name: 'coffee' },
      { emoji: '🍕', name: 'pizza' }
    ]
  },
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: <Smile className="w-4 h-4" />,
    emojis: [
      { emoji: '😀', name: 'grinning' },
      { emoji: '😃', name: 'smiley' },
      { emoji: '😄', name: 'smile' },
      { emoji: '😁', name: 'beam' },
      { emoji: '😆', name: 'laughing' },
      { emoji: '😅', name: 'sweat smile' },
      { emoji: '😂', name: 'joy' },
      { emoji: '🤣', name: 'rofl' },
      { emoji: '😊', name: 'blush' },
      { emoji: '😇', name: 'innocent' },
      { emoji: '🙂', name: 'slight smile' },
      { emoji: '😉', name: 'wink' },
      { emoji: '😍', name: 'heart eyes' },
      { emoji: '🥰', name: 'smiling hearts' },
      { emoji: '😘', name: 'kissing' },
      { emoji: '😋', name: 'yum' },
      { emoji: '😜', name: 'winking tongue' },
      { emoji: '🤔', name: 'thinking' },
      { emoji: '🤫', name: 'shushing' },
      { emoji: '😐', name: 'neutral' },
      { emoji: '🙄', name: 'roll eyes' },
      { emoji: '😬', name: 'grimace' },
      { emoji: '😴', name: 'sleeping' },
      { emoji: '🥳', name: 'party' },
      { emoji: '😎', name: 'cool' }
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: <ThumbsUp className="w-4 h-4" />,
    emojis: [
      { emoji: '👍', name: 'thumbs up' },
      { emoji: '👎', name: 'thumbs down' },
      { emoji: '👊', name: 'fist' },
      { emoji: '🤛', name: 'left fist' },
      { emoji: '🤜', name: 'right fist' },
      { emoji: '✌️', name: 'peace' },
      { emoji: '🤞', name: 'crossed fingers' },
      { emoji: '🤟', name: 'love you' },
      { emoji: '🤘', name: 'rock on' },
      { emoji: '👌', name: 'ok' },
      { emoji: '👈', name: 'point left' },
      { emoji: '👉', name: 'point right' },
      { emoji: '👆', name: 'point up' },
      { emoji: '👇', name: 'point down' },
      { emoji: '✋', name: 'raised hand' },
      { emoji: '👋', name: 'wave' },
      { emoji: '🤙', name: 'call me' },
      { emoji: '💪', name: 'flex' },
      { emoji: '🙏', name: 'pray' }
    ]
  },
  {
    id: 'objects',
    name: 'Symbols & Objects',
    icon: <Heart className="w-4 h-4" />,
    emojis: [
      { emoji: '❤️', name: 'red heart' },
      { emoji: '💙', name: 'blue heart' },
      { emoji: '💚', name: 'green heart' },
      { emoji: '💜', name: 'purple heart' },
      { emoji: '🔥', name: 'fire' },
      { emoji: '✨', name: 'sparkles' },
      { emoji: '🌟', name: 'star' },
      { emoji: '💡', name: 'bulb' },
      { emoji: '💻', name: 'laptop' },
      { emoji: '📱', name: 'phone' },
      { emoji: '📦', name: 'package' },
      { emoji: '🎯', name: 'target' },
      { emoji: '🚀', name: 'rocket' },
      { emoji: '🏆', name: 'trophy' },
      { emoji: '🎨', name: 'art' },
      { emoji: '📚', name: 'books' },
      { emoji: '🔔', name: 'bell' },
      { emoji: '📌', name: 'pushpin' },
      { emoji: '⚙️', name: 'gear' },
      { emoji: '🛠️', name: 'tools' },
      { emoji: '✅', name: 'check' },
      { emoji: '❌', name: 'cross' }
    ]
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('frequent');
  const [hoveredEmoji, setHoveredEmoji] = useState<{ emoji: string; name: string } | null>(null);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const query = search.toLowerCase();
    const matches: { emoji: string; name: string }[] = [];
    CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((e) => {
        if (e.name.toLowerCase().includes(query)) {
          matches.push(e);
        }
      });
    });
    return matches;
  }, [search]);

  return (
    <div
      className="w-72 sm:w-80 rounded-xl bg-[#222529] border border-[#383F45] shadow-2xl overflow-hidden flex flex-col z-50 text-[#D1D2D3]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="p-2.5 border-b border-[#383F45] bg-[#1A1D21]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D9197]" />
          <input
            type="text"
            placeholder="Search emoji (e.g. fire, smile, rocket)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#282B30] border border-[#383F45] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8D9197] focus:outline-none focus:border-[#1264A3]"
            autoFocus
          />
        </div>
      </div>

      {/* Category Tab Bar (if not searching) */}
      {!search && (
        <div className="flex items-center justify-around border-b border-[#383F45] bg-[#1E2228] px-1 py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-md transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#1264A3] text-white'
                  : 'text-[#8D9197] hover:text-[#D1D2D3] hover:bg-[#2D3136]'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-60 overflow-y-auto p-2">
        {filteredEmojis ? (
          <div>
            <div className="text-[11px] font-semibold text-[#8D9197] uppercase px-1 mb-1">
              Search Results ({filteredEmojis.length})
            </div>
            {filteredEmojis.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8D9197]">
                No emojis found for "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filteredEmojis.map((e, idx) => (
                  <button
                    key={`${e.name}-${idx}`}
                    onClick={() => {
                      onSelectEmoji(e.emoji);
                      onClose?.();
                    }}
                    onMouseEnter={() => setHoveredEmoji(e)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    className="w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-[#2D3136] hover:scale-125 transition-transform"
                    title={e.name}
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {CATEGORIES.filter((c) => c.id === activeCategory).map((cat) => (
              <div key={cat.id}>
                <div className="text-[11px] font-semibold text-[#8D9197] uppercase px-1 mb-1.5">
                  {cat.name}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cat.emojis.map((e, idx) => (
                    <button
                      key={`${e.name}-${idx}`}
                      onClick={() => {
                        onSelectEmoji(e.emoji);
                        onClose?.();
                      }}
                      onMouseEnter={() => setHoveredEmoji(e)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      className="w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-[#2D3136] hover:scale-125 transition-transform"
                      title={e.name}
                    >
                      {e.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Preview Bar */}
      <div className="p-2 border-t border-[#383F45] bg-[#1A1D21] flex items-center justify-between text-xs text-[#8D9197] h-9">
        {hoveredEmoji ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{hoveredEmoji.emoji}</span>
            <span className="font-mono text-white text-xs">:{hoveredEmoji.name}:</span>
          </div>
        ) : (
          <span className="text-[11px]">Pick a reaction emoji</span>
        )}
      </div>
    </div>
  );
};
