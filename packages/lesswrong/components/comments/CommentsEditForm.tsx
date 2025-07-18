import React from 'react';
import classNames from 'classnames';

import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentForm } from './CommentForm';
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';

const CommentEditQuery = gql(`
  query CommentEdit($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentEdit
      }
    }
  }
`);

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {}, prefilledProps }: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: any,
  cancelCallback?: any,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  const { data, loading } = useQuery(CommentEditQuery, {
    variables: { documentId: comment._id },
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return <Loading />;
  }

  const editableComment = data?.comment?.result ?? undefined;

  return ( 
    <div className={classNames("comments-edit-form", className)}>
      <CommentForm
        initialData={editableComment}
        prefilledProps={prefilledProps}
        onSuccess={successCallback}
        onCancel={cancelCallback}
        submitLabel={comment.draft ? "Publish" : "Save"}
        disableSubmitDropdown={!comment.draft}
      />
    </div>
  )
}

export default registerComponent('CommentsEditForm', CommentsEditForm);



