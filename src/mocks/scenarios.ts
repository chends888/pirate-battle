export const NETWORK_SCENARIOS = [
  'success',
  'empty',
  'slow',
  'error',
  'timeout-on-submit',
] as const

export type NetworkScenario = (typeof NETWORK_SCENARIOS)[number]

const SCENARIO_KEY = 'pirate-battle:network-scenario'

export function loadNetworkScenario(): NetworkScenario {
  const value = localStorage.getItem(SCENARIO_KEY)
  if (NETWORK_SCENARIOS.includes(value as NetworkScenario)) {
    return value as NetworkScenario
  }
  return 'success'
}

export function saveNetworkScenario(scenario: NetworkScenario): void {
  localStorage.setItem(SCENARIO_KEY, scenario)
}
