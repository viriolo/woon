import React, { useMemo, useRef, useState, useEffect } from 'react';

interface MentionableUser {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
}

interface MentionInputProps {
    mentionableUsers: MentionableUser[];
    isSubmitting: boolean;
    onSubmit: (payload: { text: string; mentionedUserIds: string[] }) => Promise<void> | void;
}

interface ActiveMention {
    start: number;
    end: number;
    query: string;
}

const sanitizeHandle = (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, '');

export const MentionInput: React.FC<MentionInputProps> = ({ mentionableUsers, isSubmitting, onSubmit }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState('');
    const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<MentionableUser[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const mentionUsersByHandle = useMemo(() => {
        return new Map(mentionableUsers.map(user => [user.handle.toLowerCase(), user]));
    }, [mentionableUsers]);

    useEffect(() => {
        if (activeMention) {
            const query = sanitizeHandle(activeMention.query);
            const candidates = mentionableUsers.filter(user => {
                if (!query) return true;
                const handle = user.handle.toLowerCase();
                return handle.startsWith(query) || user.name.toLowerCase().includes(activeMention.query.toLowerCase());
            });
            setFilteredUsers(candidates.slice(0, 5));
            setHighlightedIndex(0);
        } else {
            setFilteredUsers([]);
        }
    }, [activeMention, mentionableUsers]);

    const detectMention = (value: string, cursorPosition: number): ActiveMention | null => {
        const atIndex = value.lastIndexOf('@', cursorPosition - 1);
        if (atIndex === -1) {
            return null;
        }

        if (atIndex > 0 && !/\s/.test(value.charAt(atIndex - 1))) {
            return null;
        }

        const substring = value.slice(atIndex + 1, cursorPosition);
        if (substring.includes(' ') || substring.includes('@')) {
            return null;
        }

        return {
            start: atIndex,
            end: cursorPosition,
            query: substring,
        };
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const { value, selectionStart } = event.target;
        setText(value);
        const mention = selectionStart !== null ? detectMention(value, selectionStart) : null;
        setActiveMention(mention);
    };

    const replaceActiveMention = (user: MentionableUser) => {
        if (!activeMention) return;
        const cursorEnd = activeMention.end;
        const before = text.slice(0, activeMention.start);
        const after = text.slice(cursorEnd);
        const mentionInsertion = `@${user.handle}`;
        const trailingSpace = after.length === 0 || after.startsWith(' ') ? '' : ' ';
        const newValue = `${before}${mentionInsertion}${trailingSpace}${after}`;

        setText(newValue);
        setActiveMention(null);
        setFilteredUsers([]);

        requestAnimationFrame(() => {
            const element = inputRef.current;
            if (element) {
                const newCursor = before.length + mentionInsertion.length + trailingSpace.length;
                element.focus();
                element.setSelectionRange(newCursor, newCursor);
            }
        });
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (filteredUsers.length > 0) {
            if (event.key === 'ArrowDown' || event.key === 'Tab') {
                event.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % filteredUsers.length);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                replaceActiveMention(filteredUsers[highlightedIndex]);
                return;
            }
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitComment();
        }
    };

    const submitComment = async () => {
        const trimmed = text.trim();
        if (!trimmed || isSubmitting) {
            return;
        }

        const mentionMatches = trimmed.match(/@([a-z0-9_]+)/gi) ?? [];
        const uniqueMentionHandles = new Set(mentionMatches.map(match => match.slice(1).toLowerCase()));
        const mentionedUserIds = [...uniqueMentionHandles]
            .map(handle => mentionUsersByHandle.get(handle))
            .filter((user): user is MentionableUser => Boolean(user))
            .map(user => user.id);

        try {
            await onSubmit({ text: trimmed, mentionedUserIds });
            setText('');
            setActiveMention(null);
            setFilteredUsers([]);
        } catch (error) {
            console.error('Failed to submit comment with mentions', error);
        }
    };

    return (
        <div className="relative flex gap-2">
            <div className="flex-1 relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a comment..."
                    disabled={isSubmitting}
                    className="w-full p-3 bg-white border border-neutral-300 rounded-full placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                />
                {filteredUsers.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredUsers.map((user, index) => (
                            <li
                                key={user.id}
                                className={`px-4 py-2 cursor-pointer flex items-center gap-2 text-sm ${
                                    index === highlightedIndex ? 'bg-special-primary text-white' : 'hover:bg-neutral-100'
                                }`}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    replaceActiveMention(user);
                                }}
                            >
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs opacity-80">@{user.handle}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                type="button"
                onClick={submitComment}
                disabled={isSubmitting || !text.trim()}
                className="px-4 py-2 bg-special-primary text-white font-bold rounded-full hover:opacity-90 transition disabled:opacity-50"
            >
                {isSubmitting ? 'Posting...' : 'Post'}
            </button>
        </div>
    );
};
