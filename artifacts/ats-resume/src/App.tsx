import { useEffect, useRef } from "react"
import { ClerkProvider, SignIn, SignUp, Show, useClerk, ClerkLoaded } from "@clerk/react"
import { publishableKeyFromHost } from "@clerk/react/internal"
import { shadcn, dark } from "@clerk/themes"
import { Route, Switch, useLocation, Router as WouterRouter, Redirect } from "wouter"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { Toaster } from "sonner"

import NotFound from "@/pages/not-found"
import Dashboard from "@/pages/Dashboard"
import ResumeForm from "@/pages/ResumeForm"
import ResumePreview from "@/pages/ResumePreview"
import Analyze from "@/pages/Analyze"
import AnalysisDetails from "@/pages/AnalysisDetails"
import History from "@/pages/History"
import Landing from "@/pages/Landing"
import { ThemeProvider, useTheme } from "@/components/theme-provider"

const queryClient = new QueryClient()

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
)

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file")
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/20 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  )
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/20 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  )
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk()
  const queryClient = useQueryClient()
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear()
      }
      prevUserIdRef.current = userId
    })
    return unsubscribe
  }, [addListener, queryClient])

  return null
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  )
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  )
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation()
  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const clerkAppearance = {
    baseTheme: isDark ? dark : undefined,
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: isDark ? "hsl(226, 80%, 65%)" : "hsl(228, 75%, 26%)",
      colorForeground: isDark ? "hsl(210, 40%, 96%)" : "hsl(226, 50%, 12%)",
      colorMutedForeground: isDark ? "hsl(215, 20%, 65%)" : "hsl(226, 20%, 45%)",
      colorDanger: isDark ? "hsl(0, 70%, 50%)" : "hsl(0, 84%, 60%)",
      colorBackground: isDark ? "hsl(226, 40%, 9%)" : "white",
      colorInput: isDark ? "hsl(226, 35%, 15%)" : "hsl(226, 15%, 90%)",
      colorInputForeground: isDark ? "hsl(210, 40%, 96%)" : "hsl(226, 50%, 12%)",
      colorNeutral: isDark ? "hsl(226, 35%, 15%)" : "hsl(226, 15%, 90%)",
      fontFamily: "Geist, sans-serif",
      borderRadius: "0.5rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: `${isDark ? "bg-[hsl(226,40%,9%)] border-[hsl(226,35%,15%)]" : "bg-white border-slate-200"} rounded-2xl w-[440px] max-w-full overflow-hidden shadow-sm border`,
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-2xl font-bold tracking-tight",
      headerSubtitle: isDark ? "text-slate-400" : "text-slate-500",
      socialButtonsBlockButtonText: "font-medium",
      formFieldLabel: `font-medium text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`,
      footerActionLink: `font-semibold ${isDark ? "text-[hsl(226,80%,65%)]" : "text-[hsl(228,75%,26%)]"}`,
      footerActionText: isDark ? "text-slate-400" : "text-slate-500",
      dividerText: `${isDark ? "text-slate-500" : "text-slate-400"} text-xs font-medium uppercase`,
    },
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access ResumeForge",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/analyze"><ProtectedRoute component={Analyze} /></Route>
          <Route path="/analyses/:id"><ProtectedRoute component={AnalysisDetails} /></Route>
          <Route path="/history"><ProtectedRoute component={History} /></Route>
          
          <Route path="/resumes/new"><ProtectedRoute component={ResumeForm} /></Route>
          <Route path="/resumes/:id/edit"><ProtectedRoute component={ResumeForm} /></Route>
          <Route path="/resumes/:id/preview"><ProtectedRoute component={ResumePreview} /></Route>
          
          <Route component={NotFound} />
        </Switch>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ClerkProvider>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="resumeforge-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  )
}

export default App
