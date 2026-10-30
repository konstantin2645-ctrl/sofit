import { schema as s } from "@/db";
import { crud } from "@/lib/crud";
import { TAGS } from "@/lib/data";
import { artistInput } from "@/lib/validation";

export const api = crud({
  table: s.artists,
  input: artistInput,
  tags: [TAGS.artists],
  orderBy: [{ column: s.artists.name, dir: "asc" }],
});
