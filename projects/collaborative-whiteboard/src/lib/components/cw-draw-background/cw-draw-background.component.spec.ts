import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { CwDrawBackgroundComponent } from './cw-draw-background.component';

describe('CwDrawBackgroundComponent', () => {
  let spectator: Spectator<CwDrawBackgroundComponent>;
  const createComponent = createComponentFactory(CwDrawBackgroundComponent);

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
