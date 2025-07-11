import React, {useState} from 'react';
import { Menu } from '@/components/widgets/Menu';
import { Link } from "../../lib/reactRouterWrapper";
import EditIcon from "@/lib/vendor/@material-ui/icons/src/Edit";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import NewConversationButton, { TemplateQueryStrings } from '../messaging/NewConversationButton'
import { commentBodyStyles } from '../../themes/stylePiping';
import { ContentItemBody } from "../contents/ContentItemBody";
import LWTooltip from "../common/LWTooltip";
import { MenuItem } from "../common/Menus";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const ModerationTemplateFragmentMultiQuery = gql(`
  query multiModerationTemplateSunshineSendMessageWithDefaultsQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const MODERATION_TEMPLATES_URL = "/admin/moderationTemplates"

export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  editIcon: {
    width: 20,
    color: theme.palette.grey[400],
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },
  defaultMessage: {
    maxWidth: 500,
    ...commentBodyStyles(theme),
    backgroundColor: theme.palette.panelBackground.default,
    padding:12,
    boxShadow: theme.palette.boxShadow.sunshineSendMessage,
  },
  sendMessageButton: {
    marginTop: 8,
    padding: 8,
    paddingTop: 6,
    height: 32,
    wordBreak: "keep-all",
    fontSize: "1rem",
    border: theme.palette.border.faint,
    borderRadius: 2,
    color: theme.palette.grey[500],
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    }
  }
})

const SunshineSendMessageWithDefaults = ({ user, embedConversation, classes }: {
  user: SunshineUsersList|UsersMinimumInfo|null,
  embedConversation?: (conversationId: string, templateQueries: TemplateQueryStrings) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const [anchorEl, setAnchorEl] = useState<any>(null);
  
  const { data } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Messages" } },
      limit: 50,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const defaultResponses = data?.moderationTemplates?.results;

  if (!(user && currentUser)) return null
  
  return (
    <div className={classes.root}>
      <span
        className={classes.sendMessageButton}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
      >
        New Message
      </span>
      <Menu
        onClick={() => setAnchorEl(null)}
        open={!!anchorEl}
        anchorEl={anchorEl}
      >
        <MenuItem value={0}>
          <NewConversationButton user={user} currentUser={currentUser} includeModerators embedConversation={embedConversation}>
            New Message
          </NewConversationButton>
        </MenuItem>
        {defaultResponses && defaultResponses.map((template, i) =>
          <div key={`template-${template._id}`}>
            <LWTooltip tooltip={false} placement="left" title={
              <div className={classes.defaultMessage}>
                <ContentItemBody dangerouslySetInnerHTML={{__html:template.contents?.html || ""}}/>
              </div>}
            >
              <MenuItem>
                <NewConversationButton user={user} currentUser={currentUser} templateQueries={{templateId: template._id, displayName: user.displayName}} includeModerators embedConversation={embedConversation}>
                  {template.name}
                </NewConversationButton>
              </MenuItem>
            </LWTooltip>
          </div>)}
          <Link to={MODERATION_TEMPLATES_URL}>
            <MenuItem>
              <EditIcon className={classes.editIcon}/>
              <em>Edit Messages</em>
            </MenuItem>
          </Link>
        </Menu>

    </div>
  )
}

export default registerComponent('SunshineSendMessageWithDefaults', SunshineSendMessageWithDefaults, {
  styles,
});


