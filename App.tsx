import React from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AppShell } from "./src/app/AppShell";

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppShell />
        </AuthProvider>
    );
};

export default App;
