import { router } from '@/app/router/index.js';

describe('router configuration', () => {
  test('includes character sheet and drive load routes', () => {
    const routeNames = router.getRoutes().map((route) => route.name);
    expect(routeNames).toContain('character-sheet');
    expect(routeNames).toContain('drive-load');
  });

  test('drive load route points to expected path', () => {
    const driveLoadRoute = router.getRoutes().find((route) => route.name === 'drive-load');
    expect(driveLoadRoute?.path).toBe('/drive/load');
  });
});
