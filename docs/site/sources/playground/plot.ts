export function drawPlot(canvas: HTMLCanvasElement, values: readonly number[]): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (values.length === 0) return;
  context.strokeStyle = '#19a590';
  context.lineWidth = 2;
  appendCurve({ context, canvas, values });
  context.stroke();
}

function appendCurve(input: {
  readonly context: CanvasRenderingContext2D;
  readonly canvas: HTMLCanvasElement;
  readonly values: readonly number[];
}): void {
  input.context.beginPath();
  const maximum = Math.max(1, ...input.values);
  input.values.forEach((value, index) => {
    const horizontal =
      (index / Math.max(1, input.values.length - 1)) * (input.canvas.width - 16) + 8;
    const vertical = input.canvas.height - 8 - (value / maximum) * (input.canvas.height - 16);
    input.context.lineTo(horizontal, vertical);
  });
}
