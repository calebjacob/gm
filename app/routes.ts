import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("rulesets", "routes/rulesets.tsx"),
  route("rulesets/new", "routes/rulesets.new.tsx"),
  route("rulesets/:id", "routes/rulesets.$id.tsx"),
  route("worlds", "routes/worlds.tsx"),
  route("worlds/new", "routes/worlds.new.tsx"),
  route("worlds/:id", "routes/worlds.$id.tsx"),
  route("campaigns", "routes/campaigns.tsx"),
  route("campaigns/new", "routes/campaigns.new.tsx"),
  route("campaigns/:id", "routes/campaigns.$id.tsx"),
  route("campaigns/:id/characters/new", "routes/campaigns.$id.characters.new.tsx"),
  route("campaigns/:id/characters/:characterId", "routes/campaigns.$id.characters.$characterId.tsx"),
  route("api/campaigns/:campaignId/messages", "routes/api.campaigns.$campaignId.messages.ts"),
  route("api/campaigns/:campaignId/character-suggestions", "routes/api.campaigns.$campaignId.character-suggestions.ts"),
  route("api/campaigns/:campaignId/characters/chat", "routes/api.campaigns.$campaignId.characters.chat.ts"),
] satisfies RouteConfig;
