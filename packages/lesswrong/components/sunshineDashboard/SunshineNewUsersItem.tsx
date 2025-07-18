import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { getUserEmail , userGetProfileUrl} from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'

import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag'
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import SunshineNewUsersInfo from "./SunshineNewUsersInfo";
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import FirstContentIcons from "./FirstContentIcons";

const styles = (theme: ThemeType) => ({
  negativeKarma: {
     color: theme.palette.text.negativeKarmaRed,
  },
  info: {
    // Wrap between MetaInfo elements. Non-standard CSS which may not work in Firefox.
    wordBreak: "break-word",
    display: "inline-block"
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  flagged: {
    background: theme.palette.panelBackground.sunshineFlaggedUser,
  }
})
const SunshineNewUsersItem = ({ user, classes, refetch, currentUser }: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
  refetch: () => void,
  currentUser: UsersCurrent,
}) => {
  const { eventHandlers, hover, anchorEl } = useHover();
  return (
    <div {...eventHandlers} className={user.sunshineFlagged ? classes.flagged : undefined}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <SunshineNewUsersInfo user={user} refetch={refetch} currentUser={currentUser}/>
        </SidebarHoverOver>
        <div>
          <MetaInfo className={classes.info}>
            { user.karma || 0 }
          </MetaInfo>
          <MetaInfo className={classes.info}>
            <Link className={user.karma < 0 ? classes.negativeKarma : ""} to={userGetProfileUrl(user)}>
                {user.displayName}
            </Link>
          </MetaInfo>
          <MetaInfo className={classes.info}>
            <FormatDate date={user.createdAt}/>
          </MetaInfo>
          <FirstContentIcons user={user}/>
          {user.sunshineFlagged && <FlagIcon className={classes.icon}/>}
          {!user.reviewedByUserId && <MetaInfo className={classes.info}>
            { getUserEmail(user) || "This user has no email" }
          </MetaInfo>}
        </div>
      </SunshineListItem>
    </div>
  )
}

export default registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, {
  styles,
  hocs: [
    withErrorBoundary,
  ]
});



