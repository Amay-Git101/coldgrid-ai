// Helper functions for map rendering

export const calculateOffsetPositions = (p1, p2, offsetIndex, totalRoutes) => {
  // If only 1 route, no offset
  if (totalRoutes <= 1) return [p1, p2];

  // We want offsets like: -1, 0, 1 for 3 routes
  // Or -0.5, 0.5 for 2 routes
  const centerIndex = (totalRoutes - 1) / 2;
  const offsetMultiplier = offsetIndex - centerIndex;

  if (offsetMultiplier === 0) return [p1, p2];

  const dx = p2[1] - p1[1]; // lng diff
  const dy = p2[0] - p1[0]; // lat diff
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return [p1, p2];

  // Perpendicular vector normalized
  const px = -dy / length;
  const py = dx / length;

  // Offset magnitude (e.g., 0.05 degrees, which is roughly 5km)
  const offsetMagnitude = 0.06;

  const ox = px * offsetMagnitude * offsetMultiplier;
  const oy = py * offsetMagnitude * offsetMultiplier;

  return [
    [p1[0] + oy, p1[1] + ox],
    [p2[0] + oy, p2[1] + ox]
  ];
};

export const getRouteColor = (rName, isBlocked, isLateral) => {
  if (isBlocked) return 'var(--critical)';
  if (isLateral) return 'var(--amber)';
  return 'var(--success)'; // Active available route
};
