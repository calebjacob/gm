import { useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import { Box, Button, Drawer, TextField, Typography } from "@mui/material";
import { Send } from "lucide-react";
import { CharacterCard } from "./CharacterCard";
import { MessageList, type ChatMessage } from "./MessageList";
import styles from "./CampaignChat.module.css";

export interface CharacterSummary {
  id: string;
  name: string;
  race?: string | null;
  className?: string | null;
  description?: string | null;
  imagePath?: string | null;
  skills?: string | null;
  statistics?: string | null;
  items?: string | null;
}

interface CampaignChatProps {
  campaignId: string;
  characters: CharacterSummary[];
  messages: ChatMessage[];
}

export function CampaignChat({ campaignId, characters, messages: initialMessages }: CampaignChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionAnchor, setMentionAnchor] = useState<{ top: number; left: number } | null>(null);
  const [drawerCharacter, setDrawerCharacter] = useState<CharacterSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretPosRef = useRef(0);

  const insertMention = useCallback((name: string) => {
    const text = input;
    const pos = caretPosRef.current;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const hasAt = before.endsWith("@");
    const newText = hasAt ? before + name + " " + after : before + "@" + name + " " + after;
    setInput(newText);
    setMentionOpen(false);
    setMentionAnchor(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInput(v);
    const sel = (e.target as HTMLInputElement).selectionStart ?? v.length;
    caretPosRef.current = sel;
    if (v[sel - 1] === "@") {
      const rect = (e.target as HTMLInputElement).getBoundingClientRect();
      setMentionAnchor({ left: rect.left, top: rect.bottom });
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setStreamingContent("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => prev.slice(0, -1));
        setMessages((prev) => [...prev, userMsg, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${(err as { error?: string }).error ?? res.statusText}` }]);
        return;
      }
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const block of lines) {
          if (block.startsWith("data: ")) {
            try {
              const data = JSON.parse(block.slice(6));
              if (data.content) full += data.content;
              if (data.done) break;
            } catch {}
          }
        }
        setStreamingContent(full);
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: full }]);
      setStreamingContent("");
    } catch (err) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${String(err)}` }]);
      setStreamingContent("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.characterColumn}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          Party
        </Typography>
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            onInsertMention={insertMention}
            onOpenDetails={setDrawerCharacter}
          />
        ))}
      </div>
      <div className={styles.chatColumn}>
        <MessageList messages={messages} streamingContent={streamingContent} />
        <div className={styles.inputRow}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              inputRef={inputRef}
              multiline
              maxRows={4}
              placeholder="Message the GM… (use @ for characters)"
              value={input}
              onChange={handleInputChange}
              onSelect={(e) => {
                caretPosRef.current = (e.target as HTMLInputElement).selectionStart ?? 0;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              fullWidth
              size="small"
              aria-label="Campaign chat input"
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <Send size={20} />
            </Button>
          </Box>
          {mentionOpen && mentionAnchor && (
            <Box
              className={styles.mentionPopover}
              sx={{
                position: "fixed",
                left: mentionAnchor.left,
                top: mentionAnchor.top,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: 2,
                zIndex: 1300,
              }}
            >
              {characters.map((c) => (
                <Box
                  key={c.id}
                  component="button"
                  type="button"
                  onClick={() => insertMention(c.name)}
                  sx={{ display: "block", width: "100%", textAlign: "left", p: 1, border: 0, bgcolor: "transparent", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                >
                  {c.name}
                </Box>
              ))}
            </Box>
          )}
        </div>
      </div>
      <Drawer
        anchor="right"
        open={!!drawerCharacter}
        onClose={() => setDrawerCharacter(null)}
      >
        <Box sx={{ width: 320, p: 2 }}>
          {drawerCharacter && (
            <>
              <Typography variant="h6">{drawerCharacter.name}</Typography>
              {(drawerCharacter.race || drawerCharacter.className) && (
                <Typography variant="body2" color="text.secondary">
                  {[drawerCharacter.race, drawerCharacter.className].filter(Boolean).join(" · ")}
                </Typography>
              )}
              {drawerCharacter.description && (
                <Typography variant="body2" sx={{ mt: 2 }}>{drawerCharacter.description}</Typography>
              )}
              {drawerCharacter.skills && (
                <Typography variant="body2" sx={{ mt: 2 }}><strong>Skills:</strong> {String(drawerCharacter.skills)}</Typography>
              )}
              {drawerCharacter.statistics && (
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Stats:</strong> {String(drawerCharacter.statistics)}</Typography>
              )}
              {drawerCharacter.items && (
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Items:</strong> {String(drawerCharacter.items)}</Typography>
              )}
              <Button component={Link} to={`/campaigns/${campaignId}/characters/${drawerCharacter.id}`} variant="outlined" size="small" sx={{ mt: 2 }}>
                Edit character
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </div>
  );
}
