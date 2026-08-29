import AppRoutes from "./routes/AppRoutes";
import { useTheme } from "./theme/useTheme";

export default function App() {
  useTheme();
  return <AppRoutes />;
}
