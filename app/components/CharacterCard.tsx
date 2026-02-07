import { Card, CardContent, Typography } from "@mui/material";
import type { CharacterSummary } from "./CampaignChat";

interface CharacterCardProps {
  character: CharacterSummary;
  onInsertMention: (name: string) => void;
  onOpenDetails: (character: CharacterSummary) => void;
}

export function CharacterCard({ character, onInsertMention, onOpenDetails }: CharacterCardProps) {
  return (
    <Card
      className="cardClickable"
      sx={{ cursor: "pointer" }}
      onClick={() => onInsertMention(character.name)}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          onOpenDetails(character);
        }
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 1 }, py: 1.5, "&.MuiCardContent-root": { py: 1.5 } }}>
        <Typography variant="subtitle2" noWrap title={character.name}>
          {character.name}
        </Typography>
        {(character.race || character.className) && (
          <Typography variant="caption" color="text.secondary" display="block">
            {[character.race, character.className].filter(Boolean).join(" · ")}
          </Typography>
        )}
        {character.statistics && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {typeof character.statistics === "string"
              ? character.statistics
              : JSON.stringify(character.statistics)}
          </Typography>
        )}
        <Typography
          variant="caption"
          component="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(character);
          }}
          sx={{ display: "block", mt: 0.5, textAlign: "left", border: 0, background: "none", cursor: "pointer", color: "primary.main" }}
        >
          Details
        </Typography>
      </CardContent>
    </Card>
  );
}
