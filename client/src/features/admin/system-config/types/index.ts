export interface SystemConfig {
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SystemConfigListResponse {
  status: "ok";
  data: {
    configs: SystemConfig[];
    total: number;
  };
}

export interface SystemConfigResponse {
  status: "ok";
  data: {
    config: SystemConfig;
  };
}
