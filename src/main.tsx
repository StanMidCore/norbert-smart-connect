
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.tsx';
import './index.css';
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import N8NWebhook from "./pages/N8NWebhook.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";
import StripeSuccess from "./pages/StripeSuccess.tsx";
import StripeSuccessHandler from "./pages/StripeSuccessHandler.tsx";
import LogsViewer from "./pages/LogsViewer.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "auth", element: <Auth /> },
      { path: "n8n-webhook", element: <N8NWebhook /> },
      { path: "oauth-callback", element: <OAuthCallback /> },
      { path: "stripe/success", element: <StripeSuccess /> },
      { path: "stripe-success", element: <StripeSuccessHandler /> },
      { path: "logs", element: <LogsViewer /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
