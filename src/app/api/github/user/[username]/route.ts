import { NextResponse } from 'next/server';
import { getGithubUniverse, GithubUniverseError } from '@/lib/github/client';
import { parseGithubUsername } from '@/lib/github/username';
import { getFixture } from '@/lib/fixtures/profiles';

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  const { username: raw } = await context.params;
  const username = parseGithubUsername(raw);
  if (!username) return NextResponse.json({ error: 'invalid_username' }, { status: 400 });
  const fixtureName = new URL(request.url).searchParams.get('fixture');
  if (process.env.NODE_ENV === 'development' && fixtureName) {
    const fixture = getFixture(fixtureName);
    if (fixture) return NextResponse.json(fixture);
  }
  try {
    return NextResponse.json(await getGithubUniverse(username), { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } });
  } catch (error) {
    const code = error instanceof GithubUniverseError ? error.code : 'unavailable';
    if (!(error instanceof GithubUniverseError)) console.error('Unexpected universe error', error);
    return NextResponse.json({ error: code }, { status: code === 'not_found' ? 404 : code === 'rate_limited' ? 429 : 502 });
  }
}
