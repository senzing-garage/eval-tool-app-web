import { SzGrpcEnvironment, SzEngineFlags } from '@senzing/sz-sdk-typescript-grpc';

const GRPC_HOST = process.env['GRPC_HOST'] ?? '0.0.0.0:8261';

let _env: SzGrpcEnvironment | null = null;

function getEnv(): SzGrpcEnvironment {
  if (!_env) {
    _env = new SzGrpcEnvironment({ connectionString: GRPC_HOST });
  }
  return _env;
}

/**
 * Look up the resolved entity ID for a given data source + record ID.
 */
export async function getEntityIdByRecordId(dataSource: string, recordId: string): Promise<number> {
  const env = getEnv();
  const raw = await env.engine.getEntityByRecordId(
    dataSource,
    recordId,
    SzEngineFlags.SZ_ENTITY_BRIEF_DEFAULT_FLAGS
  );
  const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return result.RESOLVED_ENTITY.ENTITY_ID;
}
