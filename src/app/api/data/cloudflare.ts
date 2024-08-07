
const account_id = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const DB_ID = process.env.CLOUDFLARE_DB_ID;

export const queryAPIURL = `/accounts/${account_id}/d1/database/${DB_ID}/query`;