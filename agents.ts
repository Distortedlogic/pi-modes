import { type Static, Type } from "typebox";

export const configurationSchema = Type.Record(
	Type.String({ pattern: "\\S" }),
	Type.String(),
	{
		additionalProperties: false,
	},
);

export type Configuration = Static<typeof configurationSchema>;
