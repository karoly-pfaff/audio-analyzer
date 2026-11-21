export function connectTheme(): void {
  const button = document.querySelector<HTMLButtonElement>('#theme-toggle');
  button?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    button.setAttribute('aria-pressed', String(dark));
    button.textContent = dark ? 'Light theme' : 'Dark theme';
  });
}

export function connectReferenceSearch(): void {
  const field = document.querySelector<HTMLInputElement>('#api-search');
  field?.addEventListener('input', () => {
    const query = field.value.trim().toLowerCase();
    const entries = document.querySelectorAll<HTMLElement>('[data-api-symbol]');
    entries.forEach((entry) => {
      entry.toggleAttribute('hidden', !entry.textContent.toLowerCase().includes(query));
    });
    const status = document.querySelector<HTMLElement>('#api-search-status');
    if (status)
      status.textContent = `${String(Array.from(entries).filter((entry) => !entry.hidden).length)} matching exports`;
  });
}

export function connectCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      void copySnippet(button);
    });
  });
}

async function copySnippet(button: HTMLButtonElement): Promise<void> {
  const code = button.parentElement?.querySelector('code')?.textContent;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    button.replaceChildren('Copied');
  } catch {
    button.replaceChildren('Select code to copy');
  }
}
