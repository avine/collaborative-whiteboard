import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let spectator: SpectatorService<StorageService>;
  const createService = createServiceFactory(StorageService);

  beforeEach(() => (spectator = createService()));

  it('should...', () => {
    expect(spectator.service).toBeTruthy();
  });
});
