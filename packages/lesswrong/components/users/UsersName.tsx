import { registerComponent } from '../../lib/vulcan-lib/components';
import type { Placement as PopperPlacementType } from "popper.js"
import React from 'react';
import UsersNameDisplay from "./UsersNameDisplay";
import UsersNameWrapper from "./UsersNameWrapper";
import UserNameDeleted from "./UserNameDeleted";

/**
 * A user name, with styling, tooltip, etc. Takes either a user object or a
 * documentId. If neither is provided, renders as "[deleted]" (this comes up
 * with deleted accounts, where the user object that comes back in a query is
 * null for non-admins).
 */
const UsersName = ({
  user,
  documentId,
  nofollow=false,
  simple=false,
  tooltipPlacement="left",
  nowrap,
  className,
  ...otherProps
}: {
  user?: UsersMinimumInfo|null|undefined,
  documentId?: string,
  /** Marks the link nofollow, so if it's spammy search engines won't crawl the user page. */
  nofollow?: boolean,
  /** Makes it not a link, and removes the tooltip. */
  simple?: boolean,
  tooltipPlacement?: PopperPlacementType,
  nowrap?: boolean,
  noTooltip?: boolean,
  color?: boolean,
  pageSectionContext?: string,
  /** LW specific */
  hideFollowButton?: boolean,
  /** Add an extra class/styling to the link */
  className?: string,
}) => {
  if (user) {
    return <UsersNameDisplay user={user} nofollow={nofollow} simple={simple} tooltipPlacement={tooltipPlacement} nowrap={nowrap} className={className} {...otherProps}/>
  } else if (documentId) {
    return <UsersNameWrapper documentId={documentId} nofollow={nofollow} simple={simple} nowrap={nowrap} className={className}  {...otherProps}/>
  } else {
    return <UserNameDeleted />
  }
}

export default registerComponent('UsersName', UsersName);


