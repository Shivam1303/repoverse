const USERNAME_PATTERN = /^(?!.*--)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function parseGithubUsername(input: string): string | null {
  let value = input.trim();
  if (!value) return null;
  value = value.replace(/^@/, '');
  if (/^(?:https?:\/\/)?(?:www\.)?github\.com\//i.test(value)) {
    try {
      const url = new URL(value.startsWith('http') ? value : `https://${value}`);
      if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return null;
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length !== 1) return null;
      value = segments[0];
    } catch {
      return null;
    }
  }
  return USERNAME_PATTERN.test(value) ? value.toLowerCase() : null;
}
