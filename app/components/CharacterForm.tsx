import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Typography,
} from "@mui/material";

export interface CharacterFormData {
  name: string;
  race: string;
  className: string;
  description: string;
  skills: string;
  statistics: string;
  items: string;
}

interface CharacterFormProps {
  suggestions?: { races: string[]; classes: string[]; skills: string[]; items: string[] };
  initial?: Partial<CharacterFormData>;
  onSubmit: (data: CharacterFormData) => void;
  submitting?: boolean;
}

const defaultData: CharacterFormData = {
  name: "",
  race: "",
  className: "",
  description: "",
  skills: "",
  statistics: "",
  items: "",
};

export function CharacterForm({
  suggestions,
  initial,
  onSubmit,
  submitting,
}: CharacterFormProps) {
  const [form, setForm] = useState<CharacterFormData>({ ...defaultData, ...initial });

  useEffect(() => {
    if (initial) setForm((f) => ({ ...defaultData, ...f, ...initial }));
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          fullWidth
        />
        <Autocomplete
          freeSolo
          options={suggestions?.races ?? []}
          value={form.race}
          onInputChange={(_, v) => setForm((f) => ({ ...f, race: v }))}
          renderInput={(props) => <TextField {...props} label="Race" />}
        />
        <Autocomplete
          freeSolo
          options={suggestions?.classes ?? []}
          value={form.className}
          onInputChange={(_, v) => setForm((f) => ({ ...f, className: v }))}
          renderInput={(props) => <TextField {...props} label="Class" />}
        />
        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          multiline
          rows={3}
          fullWidth
        />
        <TextField
          label="Skills (comma-separated or JSON)"
          value={form.skills}
          onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
          fullWidth
        />
        <TextField
          label="Statistics (JSON object)"
          value={form.statistics}
          onChange={(e) => setForm((f) => ({ ...f, statistics: e.target.value }))}
          fullWidth
        />
        <TextField
          label="Items (comma-separated or JSON array)"
          value={form.items}
          onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Saving…" : "Save character"}
        </Button>
      </Box>
    </form>
  );
}
