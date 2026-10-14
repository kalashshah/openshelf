import { getAuth } from '@/server/auth';
import { getEnv } from '@/server/env';

const handler = (request: Request) => getAuth(getEnv()).handler(request);
export { handler as GET, handler as POST };
