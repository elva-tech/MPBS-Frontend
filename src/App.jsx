import AppRouter from "./app/AppRouter";
import ErrorBoundary from "./shared/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}


