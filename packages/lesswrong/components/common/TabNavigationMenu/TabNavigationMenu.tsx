import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUser } from '../withUser';
import TabNavigationItem, { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import menuTabs from './menuTabs'
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { forumSelect } from '../../../lib/forumTypeUtils';
import classNames from 'classnames';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import EventsList from './EventsList';
import { SubscribeWidget } from '../SubscribeWidget';
import { isIfAnyoneBuildsItFrontPage } from '@/components/seasonal/IfAnyoneBuildsItSplash';

export const TAB_NAVIGATION_MENU_WIDTH = 250

const styles = (theme: ThemeType) => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      maxWidth: TAB_NAVIGATION_MENU_WIDTH,
      paddingTop: 15,
      ...(isFriendlyUI
        ? {
          paddingLeft: 6,
          height: "100%",
        }
        : {
          justifyContent: "space-around",
        }),
    },
    noTopMargin: {
      paddingTop: "0px !important",
    },
    navSidebarTransparent: {
      zIndex: 10,
      background: theme.palette.panelBackground.bannerAdTranslucent,
      backdropFilter: theme.palette.filters.bannerAdBlurMedium
    },
    divider: {
      width: 50,
      borderBottom: theme.palette.border.normal,
      ...(isBookUI && theme.themeOptions.name==='dark' && {
        color: theme.palette.text.bannerAdOverlay,
        background: theme.palette.text.bannerAdOverlay,
      }),
      marginBottom: theme.spacing.unit * 2.5,
      ...(isFriendlyUI
        ? {
          marginLeft: theme.spacing.unit * 2.5,
          marginTop: theme.spacing.unit * 2.5,
        }
        : {
          marginLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)) - 2,
          marginTop: theme.spacing.unit * 1.5,
        }),
    },
  }
}

const TabNavigationMenu = ({
  onClickSection,
  transparentBackground,
  noTopMargin,
  classes,
}: {
  onClickSection?: (e?: React.BaseSyntheticEvent) => void,
  transparentBackground?: boolean,
  noTopMargin?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const handleClick = (e: React.BaseSyntheticEvent, tabId: string) => {
    captureEvent(`${tabId}NavClicked`)
    onClickSection && onClickSection(e)
  }

  return (
      <AnalyticsContext pageSectionContext="navigationMenu">
        <div className={classNames(classes.root, {
          [classes.navSidebarTransparent]: transparentBackground,
          [classes.noTopMargin]: noTopMargin,
        })}>
          {forumSelect(menuTabs).map(tab => {
            if ('loggedOutOnly' in tab && tab.loggedOutOnly && currentUser) return null

            if ('divider' in tab) {
              return <div key={tab.id} className={classes.divider} />
            }
            if ('customComponentName' in tab) {
              switch (tab.customComponentName) {
                case 'EventsList':
                  return <EventsList
                    key={tab.id}
                    onClick={(e: React.BaseSyntheticEvent) => handleClick(e, tab.id)}
                    currentUser={currentUser}
                  />;
                case 'SubscribeWidget':
                  return <SubscribeWidget key={tab.id} />;
              }
            }

            return <TabNavigationItem
              key={tab.id}
              tab={tab}
              onClick={(e) => handleClick(e, tab.id)}
            />
          })}
          {/* NB: This returns null if you don't have any active resources */}
          {/* <FeaturedResourceBanner terms={{view: "activeResources"}}/> */}
        </div>
    </AnalyticsContext>  )
};

export default registerComponent(
  'TabNavigationMenu', TabNavigationMenu, {styles}
);


