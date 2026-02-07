import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta(): Route.MetaDescriptors {
  return [{ title: "GM — AI Game Master" }];
}

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>GM</h1>
      <p>AI Game Master — your adventures, your data.</p>
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <Link to="/rulesets">Rulesets</Link>
        <Link to="/worlds">Worlds</Link>
        <Link to="/campaigns">Campaigns</Link>
      </nav>
    </main>
  );
}
