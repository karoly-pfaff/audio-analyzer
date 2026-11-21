import { runProfile } from './run-profile.ts';
import { drawPlot } from './plot.ts';

export function connectPlayground(): void {
  const form = document.querySelector<HTMLFormElement>('#playground-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitDemo(form);
  });
}

async function submitDemo(form: HTMLFormElement): Promise<void> {
  const output = document.querySelector<HTMLElement>('#demo-output');
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]');
  if (!output || !button) return;
  button.disabled = true;
  try {
    await displayDemo(form, output);
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : 'Example failed.';
  } finally {
    button.disabled = false;
  }
}

async function displayDemo(form: HTMLFormElement, output: HTMLElement): Promise<void> {
  const fields = new FormData(form);
  const result = await runProfile(
    form.querySelector<HTMLSelectElement>('select')?.value ?? 'signal',
    {
      frequencyHz: Number(fields.get('frequency')),
      amplitude: Number(fields.get('amplitude')),
      bpm: Number(fields.get('bpm')),
    },
  );
  output.replaceChildren(JSON.stringify(result.summary, null, 2));
  const canvas = document.querySelector<HTMLCanvasElement>('#demo-plot');
  const caption = document.querySelector<HTMLElement>('#plot-caption');
  if (canvas) drawPlot(canvas, result.plot);
  if (caption) caption.textContent = result.caption;
}
