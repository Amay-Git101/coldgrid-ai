def compute_reward(outcome):
    reward = 0
    if outcome.get("stockout_avoided"):
        reward += 50
    if outcome.get("waste_reduced"):
        reward += 30
    if outcome.get("cost_saved", 0) > 0:
        reward += outcome["cost_saved"] * 0.01
    if outcome.get("stockout_occurred"):
        reward -= 100
    if outcome.get("spoilage_occurred"):
        reward -= 80
    if outcome.get("unnecessary_restock"):
        reward -= 20
    if outcome.get("escalation_required"):
        reward -= 40
    return reward