import { z } from "zod";

export const isoDateTime = z.union([
	z.iso.datetime().transform((val) => new Date(val)),
	z.date(),
]);

export type IsoDateTime = z.infer<typeof isoDateTime>;
