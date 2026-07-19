import { verifyAccess } from './_lib/access';

interface Env {
  MEDIA_ACCESS_EMAIL?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const rejected = await verifyAccess(context.request, context.env);
  return rejected ?? context.next();
};
