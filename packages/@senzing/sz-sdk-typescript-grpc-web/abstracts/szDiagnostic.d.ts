export interface SzDiagnostic {
    checkRepositoryPerformance(secondsToRun: number): void;
    getRepositoryInfo(): void;
    getFeature(featureId: number): void;
    purgeRepository(): void;
    reinitialize(configId: number): void;
}
