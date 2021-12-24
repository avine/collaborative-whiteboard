import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { CwFillBackgroundComponent } from './cw-fill-background.component';

describe('CwFillBackgroundComponent', () => {
  let spectator: Spectator<CwFillBackgroundComponent>;
  const createComponent = createComponentFactory(CwFillBackgroundComponent);

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
