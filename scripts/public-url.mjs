export function stripCdnCredentials(text) {
  return text.replace(/https?:\/\/(?:[a-z0-9-]+\.)*(?:kakaocdn\.net|daumcdn\.net)\/[^\s"'<>]*/gi, reference => {
    const url = new URL(reference.replaceAll('&amp;', '&'));
    if (!url.searchParams.has('credential') && !url.searchParams.has('signature')) return reference;
    for (const name of ['credential', 'signature', 'expires', 'allow_ip', 'allow_referer']) url.searchParams.delete(name);
    return url.href;
  });
}
