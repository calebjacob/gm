import { serverEnv } from "./env";

export function getCurrentUserId() {
	return serverEnv.DEFAULT_USER_ID;
}
