import { Box, Typography } from "@mui/material";
import styles from "./CampaignChat.module.css";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  streamingContent?: string;
}

export function MessageList({ messages, streamingContent }: MessageListProps) {
  return (
    <div className={styles.messageList}>
      {messages.length === 0 && !streamingContent && (
        <Typography color="text.secondary" sx={{ alignSelf: "center", mt: 4 }}>
          Send a message to start the game.
        </Typography>
      )}
      {messages.map((m) => (
        <Box
          key={m.id}
          className={`${styles.messageBubble} ${m.role === "user" ? styles.messageUser : styles.messageAssistant}`}
        >
          <Typography variant="body2" component="span">
            {m.content}
          </Typography>
        </Box>
      ))}
      {streamingContent !== undefined && streamingContent !== "" && (
        <Box className={`${styles.messageBubble} ${styles.messageAssistant}`}>
          <Typography variant="body2" component="span">
            {streamingContent}
          </Typography>
        </Box>
      )}
    </div>
  );
}
