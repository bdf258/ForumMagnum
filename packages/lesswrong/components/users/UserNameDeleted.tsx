import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from '../common/withHover';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import LWTooltip from "../common/LWTooltip";

/**
 * Username for a deleted user. Ordinarily, looks like "[anonymous]" and
 * provides no info about the user. However, if a nonnull `userShownToMods` is
 * provided and the current user is an admin, then this will reveal the name on
 * hover-over and work as a link.
 */
const UserNameDeleted = ({userShownToAdmins}: {
  userShownToAdmins?: UsersMinimumInfo|null
}) => {
  const currentUser = useCurrentUser();

  if (currentUser?.isAdmin && userShownToAdmins) {
    // Note that the currentUser?.isAdmin here should be redundant, since if the
    // user isn't an admin, userShownToAdmins should be null anyways (because
    // Users.checkAccess will have filtered out server side.)
    return <UserNameDeletedWithAdminHover user={userShownToAdmins}/>
  }
  return <LWTooltip title={<div>
    <div>Author has deactivated their account,</div>
    <div>or is no longer associated with this post.</div>
  </div>}>
    [anonymous]
  </LWTooltip>
};

const UserNameDeletedWithAdminHover = ({user}: {
  user: UsersMinimumInfo
}) => {
  const {eventHandlers,hover} = useHover();
  return <span {...eventHandlers}>
    <LWTooltip
      title={<div>
        This user account has been deleted. The username is only visible to site admins, and only visible on hover-over.
      </div> }
      inlineBlock={false}
    >
      {hover
        ? <Link to={userGetProfileUrl(user)}>
            {userGetDisplayName(user)}
          </Link>
        : "[anonymous]"
      }
    </LWTooltip>
  </span>
}

export default registerComponent('UserNameDeleted', UserNameDeleted);


