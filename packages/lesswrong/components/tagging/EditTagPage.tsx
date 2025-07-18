import React from 'react';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { useTagBySlug } from './useTag';
import { useApolloClient } from "@apollo/client";
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { TagForm } from './TagForm';
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";

export const EditTagForm = ({tag, successCallback, cancelCallback, changeCallback, warnUnsavedChanges}: {
  tag: UpdateTagDataInput & { _id: string; },
  successCallback?: any,
  cancelCallback?: any,
  changeCallback?: any,
  warnUnsavedChanges?: boolean,
}) => {
  return <TagForm
    initialData={tag}
    onSuccess={successCallback}
    onCancel={cancelCallback}
    onChange={changeCallback}
  />
}

const EditTagPage = () => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading } = useTagBySlug(slug, "TagEditFragment");
  const navigate = useNavigate();
  const client = useApolloClient()

  if (loading)
    return <Loading/>
  if (!tag)
    return <Error404/>
  
  return (
    <SingleColumnSection>
      <SectionTitle title={`Edit ${taggingNameCapitalSetting.get()} #${tag.name}`}/>
      <EditTagForm 
        tag={tag} 
        successCallback={ async (tag: any) => {
          await client.resetStore()
          navigate({pathname: tagGetUrl(tag)})
        }}
      />
    </SingleColumnSection>
  );
}

export default registerComponent('EditTagPage', EditTagPage);


