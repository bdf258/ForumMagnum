import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import ConversationPage from "./ConversationPage";

/**
 * A page with a private mesage conversation, with URL parameter parsing.
 */
const ConversationWrapper = () => {
  const currentUser = useCurrentUser()
  const { params } = useLocation();
  
  if (!currentUser) return <div>Log in to access private messages.</div>

  return <ConversationPage conversationId={params._id} currentUser={currentUser} />
}

export default registerComponent('ConversationWrapper', ConversationWrapper);



