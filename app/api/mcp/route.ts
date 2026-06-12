import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface McpServerConfig {
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  lifecycle?: string;
  debug?: boolean;
  directTools?: string[];
  disabled?: boolean;
  [key: string]: unknown;
}

interface McpConfig {
  settings?: Record<string, unknown>;
  mcpServers?: Record<string, McpServerConfig>;
}

interface McpServerInfo {
  name: string;
  config: McpServerConfig;
  enabled: boolean;
  toolCount: number;
}

function findMcpConfig(cwd?: string): string | null {
  // Check project directory first
  if (cwd) {
    const projectConfig = join(cwd, ".mcp.json");
    if (existsSync(projectConfig)) return projectConfig;
  }
  
  // Check user home directory
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  if (homeDir) {
    const userConfig = join(homeDir, ".pi", "agent", ".mcp.json");
    if (existsSync(userConfig)) return userConfig;
  }
  
  return null;
}

async function readMcpConfig(cwd?: string): Promise<McpConfig> {
  const configPath = findMcpConfig(cwd);
  if (!configPath) return {};
  
  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeMcpConfig(config: McpConfig, cwd?: string): Promise<void> {
  const configPath = findMcpConfig(cwd);
  if (!configPath) {
    // Create in project directory if specified, otherwise user home
    const targetDir = cwd || join(process.env.HOME || process.env.USERPROFILE || "", ".pi", "agent");
    const targetPath = join(targetDir, ".mcp.json");
    await writeFile(targetPath, JSON.stringify(config, null, 2), "utf-8");
    return;
  }
  
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

function parseServerConfig(name: string, config: McpServerConfig): McpServerInfo {
  return {
    name,
    config,
    enabled: config.disabled !== true,
    toolCount: config.directTools?.length ?? 0,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cwd = searchParams.get("cwd") || undefined;
    
    const config = await readMcpConfig(cwd);
    const servers: McpServerInfo[] = [];
    
    if (config.mcpServers) {
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        servers.push(parseServerConfig(name, serverConfig));
      }
    }
    
    return NextResponse.json({
      servers,
      settings: config.settings,
      hasConfig: findMcpConfig(cwd) !== null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to read MCP config: ${error}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { name, enabled, cwd } = body;
    
    if (!name || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: name, enabled" },
        { status: 400 }
      );
    }
    
    const config = await readMcpConfig(cwd);
    
    if (!config.mcpServers?.[name]) {
      return NextResponse.json(
        { error: `Server '${name}' not found` },
        { status: 404 }
      );
    }
    
    // Toggle disabled flag
    if (enabled) {
      delete config.mcpServers[name].disabled;
    } else {
      config.mcpServers[name].disabled = true;
    }
    
    await writeMcpConfig(config, cwd);
    
    return NextResponse.json({
      success: true,
      server: parseServerConfig(name, config.mcpServers[name]),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update MCP config: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, config: serverConfig, cwd } = body;
    
    if (!name || !serverConfig) {
      return NextResponse.json(
        { error: "Missing required fields: name, config" },
        { status: 400 }
      );
    }
    
    const config = await readMcpConfig(cwd);
    
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // Add or update server
    config.mcpServers[name] = serverConfig;
    
    await writeMcpConfig(config, cwd);
    
    return NextResponse.json({
      success: true,
      server: parseServerConfig(name, serverConfig),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to add MCP server: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const cwd = searchParams.get("cwd") || undefined;
    
    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }
    
    const config = await readMcpConfig(cwd);
    
    if (!config.mcpServers?.[name]) {
      return NextResponse.json(
        { error: `Server '${name}' not found` },
        { status: 404 }
      );
    }
    
    delete config.mcpServers[name];
    
    await writeMcpConfig(config, cwd);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete MCP server: ${error}` },
      { status: 500 }
    );
  }
}
