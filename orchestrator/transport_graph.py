import heapq
from typing import List, Dict, Optional

class TransportGraph:
    def __init__(self):
        self.edges: Dict[str, Dict[str, List[dict]]] = {}
        self.blocked_roads: set = set()
        self._counter = 0  # tie‑breaker for heap

    def add_edge(self, from_node: str, to_node: str, route_name: str, weight: float, **metadata):
        for u, v in [(from_node, to_node), (to_node, from_node)]:
            if u not in self.edges:
                self.edges[u] = {}
            if v not in self.edges[u]:
                self.edges[u][v] = []
            self.edges[u][v].append({
                "route_name": route_name,
                "weight": weight,
                "metadata": metadata
            })

    def get_best_route(self, start: str, end: str) -> Optional[List[dict]]:
        self._counter = 0
        pq = [(0, self._counter, start, [])]
        self._counter += 1
        visited = set()
        while pq:
            cost, _, current, path = heapq.heappop(pq)
            if current == end:
                return path
            if current in visited:
                continue
            visited.add(current)
            for next_node, routes in self.edges.get(current, {}).items():
                for route in routes:
                    if self.is_blocked(current, next_node, route["route_name"]):
                        continue
                    new_cost = cost + route["weight"]
                    new_path = path + [{
                        "from": current,
                        "to": next_node,
                        "route_name": route["route_name"],
                        "weight": route["weight"],
                        "metadata": route["metadata"]
                    }]
                    heapq.heappush(pq, (new_cost, self._counter, next_node, new_path))
                    self._counter += 1
        return None

    def is_blocked(self, node1: str, node2: str, route_name: str) -> bool:
        return (node1, node2, route_name) in self.blocked_roads or \
               (node2, node1, route_name) in self.blocked_roads

    def block_road(self, node1: str, node2: str, route_name: str):
        self.blocked_roads.add((node1, node2, route_name))

    def unblock_road(self, node1: str, node2: str, route_name: str):
        self.blocked_roads.discard((node1, node2, route_name))