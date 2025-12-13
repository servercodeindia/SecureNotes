import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { spawn } from "child_process";

interface ExecuteRequest {
  script: string;
  noteId: string;
}

interface ExecuteResponse {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

const EXECUTION_TIMEOUT = 30000;
const MAX_OUTPUT_LENGTH = 10000;

function executePython(script: string): Promise<ExecuteResponse> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";

    const process = spawn("python3", ["-c", script], {
      timeout: EXECUTION_TIMEOUT,
      env: { ...globalThis.process.env, PYTHONIOENCODING: "utf-8" },
    });

    const timeout = setTimeout(() => {
      process.kill("SIGTERM");
      resolve({
        success: false,
        error: `Execution timed out after ${EXECUTION_TIMEOUT / 1000} seconds`,
        executionTime: Date.now() - startTime,
      });
    }, EXECUTION_TIMEOUT);

    process.stdout.on("data", (data) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) + "\n... (output truncated)";
      }
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > MAX_OUTPUT_LENGTH) {
        stderr = stderr.slice(0, MAX_OUTPUT_LENGTH) + "\n... (output truncated)";
      }
    });

    process.on("close", (code) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;

      if (code === 0) {
        resolve({
          success: true,
          output: stdout.trim() || "(no output)",
          executionTime,
        });
      } else {
        resolve({
          success: false,
          output: stdout.trim() || undefined,
          error: stderr.trim() || `Process exited with code ${code}`,
          executionTime,
        });
      }
    });

    process.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to execute: ${err.message}`,
        executionTime: Date.now() - startTime,
      });
    });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/execute", async (req: Request, res: Response) => {
    const { script, noteId } = req.body as ExecuteRequest;

    if (!script || typeof script !== "string") {
      return res.status(400).json({
        success: false,
        error: "Script is required",
      });
    }

    console.log(`Executing script for note: ${noteId}`);
    const result = await executePython(script);
    console.log(`Execution complete: ${result.success ? "success" : "failed"} in ${result.executionTime}ms`);

    res.json(result);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
