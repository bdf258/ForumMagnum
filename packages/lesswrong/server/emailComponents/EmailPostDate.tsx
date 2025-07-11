import React from 'react';
import { useTimezone } from '../../components/common/withTimezone';
import { EmailFormatDate } from './EmailFormatDate';
import PrettyEventDateTime from '@/components/events/modules/PrettyEventDateTime';
import { maybeDate } from '@/lib/utils/dateUtils';

export const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { timezone, timezoneIsKnown } = useTimezone()
  
  if (post.isEvent) {
    return <span><PrettyEventDateTime post={post} timezone={timezoneIsKnown ? timezone : undefined} /></span>
  } else if (post.curatedDate) {
    return <EmailFormatDate date={maybeDate(post.curatedDate)}/>
  } else {
    return <EmailFormatDate date={maybeDate(post.postedAt)}/>
  }
}
