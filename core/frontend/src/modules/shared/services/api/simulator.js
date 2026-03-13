/**
 * Simulator API - generate test data and run scenarios
 */
import { apiRequest } from './apiBase.js';

export async function generateSimulatorData(params = {}) {
  return apiRequest('/v1/simulator/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSimulatorScenarios() {
  return apiRequest('/v1/simulator/scenarios');
}

export async function runSimulatorScenario(scenarioId, options = {}) {
  return apiRequest('/v1/simulator/run-scenario', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, options }),
  });
}
