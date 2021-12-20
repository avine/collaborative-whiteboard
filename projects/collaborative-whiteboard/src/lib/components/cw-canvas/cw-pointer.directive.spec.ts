import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator/jest';

import { CwPointerDirective } from './cw-pointer.directive';

describe('CwPointerDirective ', () => {
  let spectator: SpectatorDirective<CwPointerDirective>;
  const createDirective = createDirectiveFactory(CwPointerDirective);

  it('should change the background color', () => {
    spectator = createDirective(`<div highlight>Testing CwPointerDirective</div>`);

    spectator.dispatchMouseEvent(spectator.element, 'mouseover');

    expect(spectator.element).toHaveStyle({
      backgroundColor: 'rgba(0,0,0, 0.1)',
    });

    spectator.dispatchMouseEvent(spectator.element, 'mouseout');
    expect(spectator.element).toHaveStyle({
      backgroundColor: '#fff',
    });
  });
});
