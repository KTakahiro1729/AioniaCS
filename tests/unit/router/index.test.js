import { router } from '@/app/router/index.js';

describe('router configuration', () => {
  test('includes character sheet route only', () => {
    const routeNames = router.getRoutes().map((route) => route.name);
    expect(routeNames).toContain('character-sheet');
    expect(routeNames).not.toContain('drive-load');
  });
});
