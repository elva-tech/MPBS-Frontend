import AppRouter from "./app/AppRouter";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import { PopupProvider } from "./shared/context/PopupContext";

export default function App() {
  return (
    <ErrorBoundary>
      <PopupProvider>
        <AppRouter />
      </PopupProvider>
    </ErrorBoundary>
  );
}


