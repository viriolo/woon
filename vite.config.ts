import path from \"path\";
import { defineConfig, loadEnv } from \"vite\";
import react from \"@vitejs/plugin-react\";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, \".\", \"\");
    const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || \"\";

    return {
        plugins: [react()],
        define: {
            \"process.env.GEMINI_API_KEY\": JSON.stringify(geminiKey),
        },
        resolve: {
            alias: {
                \"@\": path.resolve(__dirname, \".\"),
            },
        },
    };
});
