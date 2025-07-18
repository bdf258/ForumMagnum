import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  emailPreview: {
    marginBottom: 40
  },
  headerName: {},
  headerContent: {},
  emailBodyFrame: {
    width: 800,
    height: 500,
    marginLeft: "auto",
    marginRight: "auto",
  },
  emailTextVersion: {
    width: 800,
    height: 300,
    overflowY: "scroll",
    border: theme.palette.border.maxIntensity,
    padding: 10,
    whiteSpace: "pre",
  },
});

export const EmailPreview = ({email, sentDate, classes}: {
  email: EmailPreview,
  sentDate?: Date,
  classes: ClassesType<typeof styles>,
}) => {

  return <div className={classes.emailPreview}>
    <p>{""+sentDate}</p>
    <div>
      <span className={classes.headerName}>Subject: </span>
      <span className={classes.headerContent}>{email.subject}</span>
    </div>
    <div>
      <span className={classes.headerName}>To: </span>
      <span className={classes.headerContent}>{email.to}</span>
    </div>
    {email.html && <iframe className={classes.emailBodyFrame} srcDoc={email.html}/>}
    <div className={classes.emailTextVersion}>
      {email.text}
    </div>
  </div>;
}

export default registerComponent('EmailPreview', EmailPreview, {styles});



