import apiClient from '@/services/api-client';
import { ApiError } from '@/lib/api-error';
import {
    Script,
    CreateScriptDTO,
    UpdateScriptDTO,
    GenerationJobStart,
    GenerationJobStatus,
} from '../types';
import { ApiResponse } from '@/types';

class ScriptsService {
    private readonly baseUrl = '/scripts';

    async createScript(data: CreateScriptDTO): Promise<Script> {
        const response = await apiClient.post<ApiResponse<Script>>(this.baseUrl, data);
        return response.data.data;
    }

    /**
     * D5: synchronous deployments answer with the script; async deployments
     * answer 202 with a job handle. Callers must handle both without pretending
     * a queued job is already a finished script.
     */
    async generateScript(projectId: string): Promise<Script | GenerationJobStart> {
        const response = await apiClient.post<ApiResponse<Script | GenerationJobStart>>(
            `${this.baseUrl}/generate`,
            { projectId }
        );
        return response.data.data as Script | GenerationJobStart;
    }

    async getGenerationJob(jobId: string): Promise<GenerationJobStatus> {
        const response = await apiClient.get<ApiResponse<GenerationJobStatus>>(
            `${this.baseUrl}/jobs/${encodeURIComponent(jobId)}`
        );
        return response.data.data as GenerationJobStatus;
    }

    /** Poll the durable job until a terminal state; never invent a script. */
    async waitForGenerationJob(
        jobId: string,
        { intervalMs = 1200, timeoutMs = 120_000 }: { intervalMs?: number; timeoutMs?: number } = {}
    ): Promise<GenerationJobStatus> {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() <= deadline) {
            const job = await this.getGenerationJob(jobId);
            if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                return job;
            }
            await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
        }
        throw new ApiError({
            code: 'GENERATION_TIMEOUT',
            message: 'The generation job did not finish in time.',
        });
    }

    async getProjectScripts(projectId: string): Promise<Script[]> {
        const response = await apiClient.get<ApiResponse<Script[]>>(`${this.baseUrl}/project/${projectId}`);
        return response.data.data;
    }

    async getScriptById(id: string): Promise<Script> {
        const response = await apiClient.get<ApiResponse<Script>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async updateScript(id: string, data: UpdateScriptDTO): Promise<Script> {
        const response = await apiClient.patch<ApiResponse<Script>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    async deleteScript(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const scriptsService = new ScriptsService();
