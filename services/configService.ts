
interface AppConfig {
    geminiApiKey: string;
}

class ConfigService {
    private config: AppConfig | null = null;
    private configPromise: Promise<AppConfig> | null = null;

    fetchConfig(): Promise<AppConfig> {
        if (this.config) {
            return Promise.resolve(this.config);
        }

        if (this.configPromise) {
            return this.configPromise;
        }

        // In a real deployment, this endpoint would securely provide client-side configuration.
        // For example, a Netlify or Google Cloud Function.
        this.configPromise = fetch('/api/config')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch app configuration.');
                }
                return response.json();
            })
            .then(configData => {
                this.config = configData;
                return this.config as AppConfig;
            });
        
        return this.configPromise;
    }

    async getConfig(): Promise<AppConfig | null> {
        try {
            const config = await this.fetchConfig();
            return config;
        } catch (error) {
            console.error("Could not load application configuration:", error);
            return null;
        }
    }
}

export const configService = new ConfigService();
