export function howItWorksHtml(): string {
  return `
    <div class="how-overlay" id="how-overlay" role="dialog" aria-label="How to play">
      <div class="how-card screen-enter">
        <h2>How it works</h2>
        <ol class="how-steps">
          <li>
            <span class="how-icon">🔢</span>
            <span><strong>Solve</strong> the equation</span>
          </li>
          <li>
            <span class="how-icon">🎨</span>
            <span><strong>Pick</strong> the matching color</span>
          </li>
          <li>
            <span class="how-icon">👆</span>
            <span><strong>Tap</strong> the number on the picture</span>
          </li>
          <li>
            <span class="how-icon">🏆</span>
            <span><strong>Color</strong> the whole picture to win!</span>
          </li>
        </ol>
        <button class="btn btn--primary" id="btn-how-dismiss">Let's go!</button>
      </div>
    </div>`;
}

export function bindHowItWorks(root: HTMLElement, onDismiss: () => void): void {
  root.querySelector('#btn-how-dismiss')?.addEventListener('click', () => {
    root.querySelector('#how-overlay')?.remove();
    onDismiss();
  });
  root.querySelector('#how-overlay')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'how-overlay') {
      root.querySelector('#how-overlay')?.remove();
      onDismiss();
    }
  });
}
