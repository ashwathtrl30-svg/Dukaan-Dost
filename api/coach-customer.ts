import { createClient } from '@supabase/supabase-js';
import {
  buildCoachSimulationSystemPrompt,
  selectCoachSimulationPlan,
  validateCoachGeneratedTurn,
} from '../src/coach/coachSimulation';

function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return res.status(503).json({
    error: 'The live customer simulation is not enabled in this development preview.',
    code: 'COACH_SIMULATION_NOT_CONFIGURED',
  });
}
