// Client-side React wrapper/context provider
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { ApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ForeignApolloClientProvider } from '../components/hooks/useForeignApolloClient';
import { PrefersDarkModeProvider } from '../components/themes/usePrefersDarkMode';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../lib/abTestImpl';
import type { AbstractThemeOptions } from '../themes/themeNames';
import { LayoutOptionsContextProvider } from '../components/hooks/useLayoutOptions';
import { SSRMetadata, EnvironmentOverride, EnvironmentOverrideContext } from '../lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
import AppComponent from '../components/vulcan-core/App';

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ apolloClient, foreignApolloClient, abTestGroupsUsed, themeOptions, ssrMetadata }: {
  apolloClient: ApolloClient<NormalizedCacheObject>,
  foreignApolloClient: ApolloClient<NormalizedCacheObject>,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
}) => {
  return (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        <CookiesProvider>
          <BrowserRouter>
          <ThemeContextProvider options={themeOptions} isEmail={false}>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <PrefersDarkModeProvider>
                <LayoutOptionsContextProvider>
                  <EnvironmentOverrideContextProvider ssrMetadata={ssrMetadata}>
                    <AppComponent apolloClient={apolloClient} />
                  </EnvironmentOverrideContextProvider>
                </LayoutOptionsContextProvider>
              </PrefersDarkModeProvider>
            </ABTestGroupsUsedContext.Provider>
          </ThemeContextProvider>
          </BrowserRouter>
        </CookiesProvider>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
};

const EnvironmentOverrideContextProvider = ({ssrMetadata, children}: {
  ssrMetadata?: SSRMetadata
  children: React.ReactNode
}) => {
  const [envOverride, setEnvOverride] = useState<EnvironmentOverride>(ssrMetadata ? {
    ...ssrMetadata,
    matchSSR: true
  } : { matchSSR: false });
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    if (envOverride.matchSSR === false) return;

    startTransition(() => {
      setEnvOverride({matchSSR: false});
    });

  }, [envOverride.matchSSR]);

  return <EnvironmentOverrideContext.Provider value={envOverride}>
    {children}
  </EnvironmentOverrideContext.Provider>
}

export default AppGenerator;
