/** Baseline parameters from AnyLogic Oil Terminal.alp */
export const DEFAULT_PARAMS = {
  storageTankCapacity: 15000,
  storageTankMinAmount: 1000,
  pipelineFlowRate: 2,
  storageTankFlowRate: 0.5,
  tankerTankCapacity: 6000,
  tankerTankFlowRate: 0.5,
  tankerInterarrivalTime: 30,
  trainLeadTime: 8,
  trainCapacity: 600,
  trainUnloadingFlowRate: 0.45,
  /** Minutes of sim time per wall-clock second at x1 */
  minutesPerSecond: 1,
} as const;

export type SimParams = { -readonly [K in keyof typeof DEFAULT_PARAMS]: number };

export function cloneParams(): SimParams {
  return { ...DEFAULT_PARAMS };
}
