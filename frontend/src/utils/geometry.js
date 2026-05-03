/**
 * Calculates parallel offset for a given array of [lat, lng] points.
 * 
 * @param {Array} points Array of [lat, lng] coordinates
 * @param {number} offsetDistance Offset magnitude (in degrees approx)
 * @returns {Array} Offset array of [lat, lng] coordinates
 */
export function offsetPolyline(points, offsetDistance) {
  if (!points || points.length < 2) return points;

  const result = [];
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const current = points[i];
    let normal = [0, 0];

    if (i === 0) {
      // First point
      const next = points[i + 1];
      const dx = next[1] - current[1];
      const dy = next[0] - current[0];
      const dist = Math.sqrt(dx * dx + dy * dy);
      normal = [-dy / dist, dx / dist];
    } else if (i === len - 1) {
      // Last point
      const prev = points[i - 1];
      const dx = current[1] - prev[1];
      const dy = current[0] - prev[0];
      const dist = Math.sqrt(dx * dx + dy * dy);
      normal = [-dy / dist, dx / dist];
    } else {
      // Interior point - average the two normals
      const prev = points[i - 1];
      const next = points[i + 1];
      
      const dx1 = current[1] - prev[1];
      const dy1 = current[0] - prev[0];
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
      const n1 = [-dy1 / dist1, dx1 / dist1];

      const dx2 = next[1] - current[1];
      const dy2 = next[0] - current[0];
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
      const n2 = [-dy2 / dist2, dx2 / dist2];

      normal = [
        (n1[0] + n2[0]) / 2,
        (n1[1] + n2[1]) / 2
      ];
      const nDist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]) || 1;
      normal = [normal[0] / nDist, normal[1] / nDist];
    }

    result.push([
      current[0] + normal[0] * offsetDistance,
      current[1] + normal[1] * offsetDistance
    ]);
  }

  return result;
}

/**
 * Calculates a point along a path given a progress percentage 0.0 to 1.0.
 */
export function getPointAlongPath(points, progress) {
  if (!points || points.length < 2) return null;
  if (progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  // Calculate total distance
  let totalDist = 0;
  const segments = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2[1] - p1[1];
    const dy = p2[0] - p1[0];
    const dist = Math.sqrt(dx*dx + dy*dy);
    segments.push({ p1, p2, dist, dx, dy });
    totalDist += dist;
  }

  const targetDist = totalDist * progress;
  let currentDist = 0;

  for (const seg of segments) {
    if (currentDist + seg.dist >= targetDist) {
      // Point is on this segment
      const remaining = targetDist - currentDist;
      const ratio = remaining / seg.dist;
      return [
        seg.p1[0] + seg.dy * ratio,
        seg.p1[1] + seg.dx * ratio
      ];
    }
    currentDist += seg.dist;
  }

  return points[points.length - 1];
}

/**
 * Calculates angle between two adjacent points for chevron rotation
 */
export function getAngleAlongPath(points, progress) {
    if (!points || points.length < 2) return 0;
    
    // Find the segment we are on
    let totalDist = 0;
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i+1][1] - points[i][1];
      const dy = points[i+1][0] - points[i][0];
      const dist = Math.sqrt(dx*dx + dy*dy);
      segments.push({ dx, dy, dist });
      totalDist += dist;
    }
  
    const targetDist = totalDist * progress;
    let currentDist = 0;
  
    for (const seg of segments) {
      if (currentDist + seg.dist >= targetDist) {
        return Math.atan2(seg.dx, seg.dy) * (180 / Math.PI); // Leaflet angle
      }
      currentDist += seg.dist;
    }
    
    const lastSeg = segments[segments.length - 1];
    return Math.atan2(lastSeg.dx, lastSeg.dy) * (180 / Math.PI);
}
