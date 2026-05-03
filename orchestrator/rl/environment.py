import gymnasium as gym
from gymnasium import spaces
import numpy as np

class ColdGridEnv(gym.Env):
    def __init__(self):
        super().__init__()
        self.action_space = spaces.Discrete(6)
        self.observation_space = spaces.Box(low=0, high=1, shape=(8,), dtype=np.float32)
        self.state = np.zeros(8, dtype=np.float32)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.state = np.random.rand(8) * 0.5 + 0.25
        return self.state, {}

    def step(self, action):
        reward = 0
        stock = self.state[0] * 100
        demand = self.state[1] * 3
        if action == 1:
            stock += 20; reward -= 5
        elif action == 2:
            stock += 40; reward -= 10
        elif action == 3:
            stock += 15; reward -= 3
        elif action == 4:
            stock -= 30; reward -= 2
        elif action == 5:
            reward -= 8
        fulfilled = min(stock, demand)
        stock -= fulfilled
        stock = max(0, stock)
        if fulfilled < demand:
            reward -= 50
        else:
            reward += 20
        self.state = np.array([
            stock / 100, demand / 3, 0.5, 0.5, 0.5, 0.5, 0, 0
        ], dtype=np.float32)
        return self.state, reward, False, False, {}